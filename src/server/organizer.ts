import { createServerFn } from "@tanstack/react-start";
import { db } from "~/lib/db";
import { karakeepClient } from "~/lib/karakeep-client.server";
import { openRouterClient } from "~/lib/openrouter-client.server";
import { organizerTodoistClient } from "~/lib/organizer-todoist-client.server";
import { uid } from "~/lib/utils";
import type {
	CreateOrganizerItemInput,
	KarakeepProposal,
	OrganizerProposal,
	OrganizerProposalPayload,
	TodoistProposal,
} from "~/types/organizer";
import { requireAuth } from "./auth-guard.server";

const MAX_TEXT_LENGTH = 10_000;

function stringValue(value: unknown, name: string, maxLength = 500): string {
	if (
		typeof value !== "string" ||
		value.trim().length === 0 ||
		value.length > maxLength
	) {
		throw new Error(`Invalid organizer ${name}`);
	}
	return value.trim();
}

function nullableString(
	value: unknown,
	name: string,
	maxLength = 500,
): string | null {
	if (value === null || value === undefined || value === "") return null;
	return stringValue(value, name, maxLength);
}

function stringArray(value: unknown, name: string): string[] {
	if (!Array.isArray(value) || value.length > 20)
		throw new Error(`Invalid organizer ${name}`);
	return value.map((entry) => stringValue(entry, name, 80));
}

export function validateCreateOrganizerItem(
	data: unknown,
): CreateOrganizerItemInput {
	if (!data || typeof data !== "object")
		throw new Error("Invalid organizer item");
	const value = data as Record<string, unknown>;
	return {
		id: stringValue(value.id, "item id", 100),
		text: stringValue(value.text, "item text", MAX_TEXT_LENGTH),
		url: nullableString(value.url, "item url", 2_000),
	};
}

export function validateOrganizerPayload(
	data: unknown,
): OrganizerProposalPayload {
	if (!data || typeof data !== "object")
		throw new Error("Invalid organizer proposal payload");
	const value = data as Record<string, unknown>;
	if (value.type === "todoist") {
		const action = value.action;
		if (action !== "create" && action !== "update")
			throw new Error("Invalid Todoist proposal action");
		const taskId = nullableString(value.taskId, "Todoist task id", 100);
		if (action === "update" && !taskId)
			throw new Error("Todoist updates require a task id");
		return {
			type: "todoist",
			action,
			content: stringValue(value.content, "Todoist content", 500),
			description:
				typeof value.description === "string"
					? value.description.slice(0, 2_000)
					: "",
			projectId: nullableString(value.projectId, "Todoist project id", 100),
			taskId,
			labels: stringArray(value.labels ?? [], "Todoist labels"),
			dueString: nullableString(value.dueString, "Todoist due string", 200),
		};
	}
	if (value.type === "karakeep") {
		return {
			type: "karakeep",
			url: stringValue(value.url, "Karakeep url", 2_000),
			title: stringValue(value.title, "Karakeep title", 500),
			tags: stringArray(value.tags ?? [], "Karakeep tags"),
		};
	}
	throw new Error("Unsupported organizer proposal type");
}

export function parseOrganizerResponse(response: string): {
	payload: OrganizerProposalPayload;
	rationale: string;
} {
	let value: unknown;
	try {
		value = JSON.parse(response);
	} catch {
		throw new Error("Organizer AI response was not valid JSON");
	}
	if (!value || typeof value !== "object")
		throw new Error("Organizer AI response was not an object");
	const record = value as Record<string, unknown>;
	return {
		payload: validateOrganizerPayload(record.proposal),
		rationale: stringValue(record.rationale, "rationale", 2_000),
	};
}

export function buildApprovedKarakeepBookmark(payload: KarakeepProposal) {
	return {
		url: payload.url,
		title: payload.title,
		tags: [...new Set([...payload.tags, "must-read"])],
	};
}

export function buildTodoistRequest(payload: TodoistProposal) {
	return {
		content: payload.content,
		description: payload.description,
		...(payload.projectId ? { projectId: payload.projectId } : {}),
		...(payload.labels.length ? { labels: payload.labels } : {}),
		...(payload.dueString ? { dueString: payload.dueString } : {}),
	};
}

function proposalFromRow(row: Record<string, unknown>): OrganizerProposal {
	return {
		id: String(row.id),
		itemId: String(row.item_id),
		payload: validateOrganizerPayload(row.proposal),
		rationale: String(row.rationale),
		status: row.status as OrganizerProposal["status"],
		createdAt: new Date(String(row.created_at)).toISOString(),
	};
}

export const createOrganizerItem = createServerFn({ method: "POST" })
	.validator(validateCreateOrganizerItem)
	.handler(async ({ data }) => {
		await requireAuth();
		await db`
      INSERT INTO organizer_items (id, text, url)
      VALUES (${data.id}, ${data.text}, ${data.url ?? null})
      ON CONFLICT (id) DO UPDATE SET text = EXCLUDED.text, url = EXCLUDED.url
    `;
		return { id: data.id };
	});

export const createOrganizerProposal = createServerFn({ method: "POST" })
	.validator((data: unknown) => {
		if (!data || typeof data !== "object")
			throw new Error("Invalid organizer proposal input");
		return {
			itemId: stringValue(
				(data as Record<string, unknown>).itemId,
				"item id",
				100,
			),
		};
	})
	.handler(async ({ data }) => {
		await requireAuth();
		const items =
			await db`SELECT id, text, url FROM organizer_items WHERE id = ${data.itemId}`;
		const item = items[0] as
			| { id: string; text: string; url: string | null }
			| undefined;
		if (!item) throw new Error("Organizer item not found");

		const response = await openRouterClient.chat([
			{
				role: "system",
				content:
					'Return only JSON: {"proposal": {"type":"todoist"|"karakeep", ...}, "rationale":"..."}. Never perform actions. For URLs prefer karakeep; for tasks use todoist. Todoist create requires action, content, description, projectId, taskId, labels, dueString. Todoist update requires taskId. Karakeep requires url, title, tags.',
			},
			{
				role: "user",
				content: JSON.stringify({ text: item.text, url: item.url }),
			},
		]);
		const parsed = parseOrganizerResponse(response);
		const id = uid();
		await db`
      INSERT INTO organizer_proposals (id, item_id, proposal, rationale)
      VALUES (${id}, ${item.id}, ${JSON.stringify(parsed.payload)}, ${parsed.rationale})
    `;
		return {
			id,
			itemId: item.id,
			payload: parsed.payload,
			rationale: parsed.rationale,
			status: "pending" as const,
		};
	});

export const getOrganizerProposals = createServerFn({ method: "GET" })
	.validator((data: unknown) => data as { itemId?: string })
	.handler(async ({ data }) => {
		await requireAuth();
		const rows = data.itemId
			? await db`SELECT * FROM organizer_proposals WHERE item_id = ${data.itemId} ORDER BY created_at DESC`
			: await db`SELECT * FROM organizer_proposals ORDER BY created_at DESC`;
		return rows.map((row) => proposalFromRow(row as Record<string, unknown>));
	});

export const applyOrganizerProposal = createServerFn({ method: "POST" })
	.validator((data: unknown) => {
		if (!data || typeof data !== "object")
			throw new Error("Invalid organizer apply input");
		const value = data as Record<string, unknown>;
		const decision = value.decision;
		if (decision !== "approve" && decision !== "reject")
			throw new Error("Invalid organizer decision");
		return {
			proposalId: stringValue(value.proposalId, "proposal id", 100),
			decision,
		};
	})
	.handler(async ({ data }) => {
		await requireAuth();
		const rows =
			await db`SELECT * FROM organizer_proposals WHERE id = ${data.proposalId}`;
		const row = rows[0] as Record<string, unknown> | undefined;
		if (!row) throw new Error("Organizer proposal not found");
		if (row.status !== "pending")
			throw new Error("Organizer proposal is no longer pending");
		if (data.decision === "reject") {
			await db`UPDATE organizer_proposals SET status = 'rejected' WHERE id = ${data.proposalId}`;
			return { status: "rejected" as const };
		}

		const payload = validateOrganizerPayload(row.proposal);
		let externalId: string;
		if (payload.type === "todoist") {
			const body = buildTodoistRequest(payload);
			const result =
				payload.action === "update" && payload.taskId
					? await organizerTodoistClient.updateTask(payload.taskId, body)
					: await organizerTodoistClient.createTask(body);
			externalId = result.id;
		} else {
			const result = await karakeepClient.createBookmark(
				buildApprovedKarakeepBookmark(payload),
			);
			externalId = result.id;
		}
		await db`UPDATE organizer_proposals SET status = 'approved' WHERE id = ${data.proposalId}`;
		return { status: "approved" as const, externalId };
	});
