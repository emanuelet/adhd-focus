import type { Task } from "~/types/todoist";

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

/** Order work by urgency first, then keep explicitly selected focus tasks visible. */
export function orderTasksForToday(
	tasks: Task[],
	focusIds: string[] = [],
	now = new Date(),
): Task[] {
	const focus = new Set(focusIds);
	const today = dateOnly(now);

	return tasks
		.filter((task) => !task.is_completed)
		.map((task, index) => ({
			task,
			index,
			bucket:
				task.due?.date && task.due.date < today
					? 0
					: task.due?.date === today
						? 1
						: focus.has(task.id)
							? 2
							: 3,
		}))
		.sort((a, b) => a.bucket - b.bucket || a.index - b.index)
		.map(({ task }) => task);
}
