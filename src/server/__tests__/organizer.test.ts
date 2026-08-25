import { describe, expect, it } from "vitest";
import {
	buildApprovedKarakeepBookmark,
	buildTodoistRequest,
	parseOrganizerResponse,
	validateOrganizerPayload,
} from "~/server/organizer";

describe("organizer proposal boundaries", () => {
	it("accepts only a strict Todoist proposal shape", () => {
		const parsed = parseOrganizerResponse(
			JSON.stringify({
				proposal: {
					type: "todoist",
					action: "create",
					content: "Write proposal",
					description: "",
					projectId: null,
					taskId: null,
					labels: ["work"],
					dueString: null,
				},
				rationale: "It is an actionable task.",
			}),
		);
		expect(parsed.payload.type).toBe("todoist");
		expect(() =>
			validateOrganizerPayload({
				type: "todoist",
				action: "update",
				content: "x",
			}),
		).toThrow("require a task id");
	});

	it("rejects malformed or non-JSON AI output", () => {
		expect(() => parseOrganizerResponse("not json")).toThrow("not valid JSON");
		expect(() =>
			parseOrganizerResponse(
				JSON.stringify({ proposal: { type: "other" }, rationale: "x" }),
			),
		).toThrow("Unsupported organizer proposal type");
	});

	it("adds must-read only at explicit Karakeep approval construction", () => {
		const payload = {
			type: "karakeep" as const,
			url: "https://example.test",
			title: "Read this",
			tags: ["research", "must-read"],
		};
		expect(buildApprovedKarakeepBookmark(payload).tags).toEqual([
			"research",
			"must-read",
		]);
	});

	it("builds Todoist create/update body without leaking proposal control fields", () => {
		const body = buildTodoistRequest({
			type: "todoist",
			action: "update",
			content: "Updated task",
			description: "Details",
			projectId: "project-1",
			taskId: "task-1",
			labels: ["focus"],
			dueString: "tomorrow",
		});
		expect(body).toEqual({
			content: "Updated task",
			description: "Details",
			projectId: "project-1",
			labels: ["focus"],
			dueString: "tomorrow",
		});
		expect(body).not.toHaveProperty("taskId");
	});
});
