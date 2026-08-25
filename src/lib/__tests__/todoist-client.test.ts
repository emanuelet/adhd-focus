import { afterEach, describe, expect, it, vi } from "vitest";
import { todoistClient } from "../todoist-client";

describe("todoistClient.updateTask", () => {
	afterEach(() => vi.restoreAllMocks());

	it("sends the typed update payload to Todoist", async () => {
		process.env.TODOIST_API_TOKEN = "test-token";
		const fetchMock = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(new Response(JSON.stringify({ id: "task-1" }), { status: 200 }));

		await todoistClient.updateTask("task-1", { content: "Updated", priority: 2 });

		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.todoist.com/api/v1/tasks/task-1",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ content: "Updated", priority: 2 }),
			}),
		);
	});
});
