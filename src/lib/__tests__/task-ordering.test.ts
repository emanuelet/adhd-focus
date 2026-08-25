import { describe, expect, it } from "vitest";
import { orderTasksForToday } from "~/lib/task-ordering";
import type { Task } from "~/types/todoist";

const task = (id: string, due: string | null): Task => ({
	id,
	content: id,
	description: "",
	project_id: "project",
	section_id: null,
	parent_id: null,
	order: 1,
	priority: 4,
	due: due ? { date: due, string: due, is_recurring: false } : null,
	labels: [],
	is_completed: false,
	created_at: "2026-08-01T00:00:00.000Z",
	url: "",
});

describe("orderTasksForToday", () => {
	it("orders overdue, due today, then selected focus tasks", () => {
		const tasks = [
			task("focus", null),
			task("tomorrow", "2026-08-26"),
			task("today", "2026-08-25"),
			task("overdue", "2026-08-24"),
		];

		expect(
			orderTasksForToday(
				tasks,
				["focus"],
				new Date("2026-08-25T12:00:00Z"),
			).map((t) => t.id),
		).toEqual(["overdue", "today", "focus", "tomorrow"]);
	});

	it("excludes completed tasks", () => {
		const completed = { ...task("done", "2026-08-24"), is_completed: true };
		expect(orderTasksForToday([completed], ["done"])).toEqual([]);
	});
});
