import type { Task as TaskType } from "~/types/todoist";

interface Props {
	doneIds: string[];
	allTasks: TaskType[];
}

const TAGLINES = [
	[0, "The day is young."],
	[1, "First blood. Keep going."],
	[2, "Momentum building."],
	[3, "Three deep. That's a real day."],
	[4, "You're in the zone now."],
	[5, "Locked in. Legendary pace."],
] as const;

function tagline(count: number): string {
	let best: string = TAGLINES[0][1];
	for (const [threshold, line] of TAGLINES) {
		if (count >= threshold) best = line;
	}
	return best;
}

export function DoneView({ doneIds, allTasks }: Props) {
	const doneTasks = doneIds
		.map((id) => allTasks.find((t) => t.id === id))
		.filter(Boolean) as TaskType[];

	return (
		<div className="space-y-4">
			<div>
				<p className="text-lg font-semibold text-[var(--text)]">
					{doneTasks.length} done
				</p>
				<p className="text-sm text-[var(--muted)]">
					{tagline(doneTasks.length)}
				</p>
			</div>

			{doneTasks.length === 0 ? (
				<p className="text-sm text-[var(--faint)]">
					No tasks completed yet today.
				</p>
			) : (
				<div className="space-y-2">
					{doneTasks.map((task) => (
						<div
							key={task.id}
							className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]"
						>
							<span className="text-[var(--green)]">✓</span>
							<span className="text-sm text-[var(--muted)] line-through">
								{task.content}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
