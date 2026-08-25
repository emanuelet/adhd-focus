import { createServerFn } from "@tanstack/react-start";
import { db } from "~/lib/db";
import { todoistClient } from "~/lib/todoist-client";
import type { CommandInput, CommandKind, CommandResult } from "~/types/commands";
import { requireAuth } from "./auth-guard.server";

const commandKinds = new Set<CommandKind>([
	"state.today",
	"state.done",
	"energy.set",
	"energy.delete",
	"todoist.close",
	"capture.create",
	"capture.delete",
	"capture.send",
]);

const today = () => new Date().toISOString().slice(0, 10);

export function validateCommand(value: unknown): CommandInput {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		throw new TypeError("command must be an object");
	const input = value as Record<string, unknown>;
	if (
		typeof input.id !== "string" ||
		!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id)
	)
		throw new TypeError("command.id must be a UUID");
	if (typeof input.kind !== "string" || !commandKinds.has(input.kind as CommandKind))
		throw new TypeError("command.kind is invalid");
	if (typeof input.payload !== "object" || input.payload === null || Array.isArray(input.payload))
		throw new TypeError("command.payload must be an object");
	return input as unknown as CommandInput;
}

async function applyCommand(command: CommandInput): Promise<CommandResult> {
	const payload = command.payload;
	switch (command.kind) {
		case "state.today":
			if (!Array.isArray(payload.todayIds) || !payload.todayIds.every((id) => typeof id === "string")) throw new TypeError("todayIds must be strings");
			if (payload.todayIds.length > 3) throw new TypeError("todayIds can contain at most three tasks");
			await db`INSERT INTO daily_state (date, today_ids) VALUES (${today()}, ${payload.todayIds as string[]}) ON CONFLICT (date) DO UPDATE SET today_ids = EXCLUDED.today_ids, updated_at = NOW()`;
			return {};
		case "state.done":
			if (!Array.isArray(payload.doneIds) || !payload.doneIds.every((id) => typeof id === "string")) throw new TypeError("doneIds must be strings");
			await db`INSERT INTO daily_state (date, done_ids) VALUES (${today()}, ${payload.doneIds as string[]}) ON CONFLICT (date) DO UPDATE SET done_ids = EXCLUDED.done_ids, updated_at = NOW()`;
			return {};
		case "energy.set":
			if (typeof payload.taskId !== "string" || !["low", "med", "high"].includes(String(payload.level))) throw new TypeError("invalid energy payload");
			await db`INSERT INTO task_meta (task_id, level) VALUES (${payload.taskId}, ${payload.level as string}) ON CONFLICT (task_id) DO UPDATE SET level = EXCLUDED.level, updated_at = NOW()`;
			return {};
		case "energy.delete":
			if (typeof payload.taskId !== "string") throw new TypeError("taskId must be a string");
			await db`UPDATE task_meta SET level = NULL, updated_at = NOW() WHERE task_id = ${payload.taskId}`;
			return {};
		case "todoist.close":
			if (typeof payload.taskId !== "string") throw new TypeError("taskId must be a string");
			{
				const response = await todoistClient.closeTask(payload.taskId, command.id);
				if (!response.ok) throw new Error(`Close task failed: ${response.status}`);
			}
			return {};
		case "capture.create": {
			if (typeof payload.captureId !== "string" || typeof payload.text !== "string" || typeof payload.isUrl !== "boolean" || typeof payload.sendToTodoist !== "boolean") throw new TypeError("invalid capture payload");
			let todoistTaskId: string | undefined;
			if (payload.sendToTodoist) {
				const response = await todoistClient.createTask(
					payload.isUrl ? `[Link](${payload.text})` : payload.text,
					command.id,
				);
				if (!response.ok) throw new Error(`Create task failed: ${response.status}`);
				todoistTaskId = (await response.json() as { id: string }).id;
			}
			await db`INSERT INTO captures (id, text, is_url, sent_to_todoist, todoist_task_id) VALUES (${payload.captureId}, ${payload.text}, ${payload.isUrl}, ${Boolean(todoistTaskId)}, ${todoistTaskId ?? null}) ON CONFLICT (id) DO NOTHING`;
			return todoistTaskId ? { todoistTaskId } : {};
		}
		case "capture.delete":
			if (typeof payload.captureId !== "string") throw new TypeError("captureId must be a string");
			await db`DELETE FROM captures WHERE id = ${payload.captureId}`;
			return {};
		case "capture.send": {
			if (typeof payload.captureId !== "string" || typeof payload.content !== "string") throw new TypeError("invalid capture payload");
			const response = await todoistClient.createTask(payload.content, command.id);
			if (!response.ok) throw new Error(`Create task failed: ${response.status}`);
			const todoistTaskId = (await response.json() as { id: string }).id;
			await db`UPDATE captures SET sent_to_todoist = TRUE, todoist_task_id = ${todoistTaskId} WHERE id = ${payload.captureId}`;
			return { todoistTaskId };
		}
	}
}

export const runCommand = createServerFn({ method: "POST" })
	.validator(validateCommand)
	.handler(async ({ data }) => {
		await requireAuth();
		const existing = await db`SELECT status, result FROM command_operations WHERE operation_id = ${data.id}::uuid`;
		if (existing[0]?.status === "applied") return existing[0].result as CommandResult;
		await db`INSERT INTO command_operations (operation_id, kind, payload, status) VALUES (${data.id}::uuid, ${data.kind}, ${JSON.stringify(data.payload)}::jsonb, 'pending') ON CONFLICT (operation_id) DO UPDATE SET status = 'pending', error = NULL, updated_at = NOW()`;
		try {
			const result = await applyCommand(data);
			await db`UPDATE command_operations SET status = 'applied', result = ${JSON.stringify(result)}::jsonb, updated_at = NOW() WHERE operation_id = ${data.id}::uuid`;
			return result;
		} catch (error) {
			await db`UPDATE command_operations SET status = 'failed', error = ${error instanceof Error ? error.message : String(error)}, updated_at = NOW() WHERE operation_id = ${data.id}::uuid`;
			throw error;
		}
	});
