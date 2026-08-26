import { useState } from "react";
import { ClockOffModal } from "~/components/review/ClockOffModal";
import { orderTasksForToday } from "~/lib/task-ordering";
import { saveDailyReview } from "~/server/review";
import { createTodoistTask } from "~/server/todoist";
import type { EnergyLevel, Task as TaskType } from "~/types/todoist";
import { TaskSlot } from "./TaskSlot";

interface Props {
	tasks: TaskType[];
	todayIds: string[];
	projectMap: Record<string, { id: string; name: string; color: string }>;
	energyMap: Record<string, EnergyLevel>;
	focusId: string | null;
	pomodoroPhase: "idle" | "work" | "break";
	pomodoroTime: string;
	pomodoroProgress: number;
	onPromote: (id: string) => void;
	onDemote: (id: string) => void;
	onMarkDone: (id: string) => void;
	onEnergyChange: (taskId: string, level: EnergyLevel) => void;
	onEnergyClear: (taskId: string) => void;
	onStartFocus: (taskId: string) => void;
	onStopFocus: () => void;
}

export function TodayView({
	tasks,
	todayIds,
	projectMap,
	energyMap,
	focusId,
	pomodoroPhase,
	pomodoroTime,
	pomodoroProgress,
	onPromote,
	onDemote,
	onMarkDone,
	onEnergyChange,
	onEnergyClear,
	onStartFocus,
	onStopFocus,
}: Props) {
	const [showClockOff, setShowClockOff] = useState(false);
	const [activeSlot, setActiveSlot] = useState<number | null>(null);
	const [draft, setDraft] = useState("");
	const [localTasks, setLocalTasks] = useState<TaskType[]>([]);
	const [createError, setCreateError] = useState("");
	const allTasks = [...tasks, ...localTasks];
	const todayTaskIds = new Set(todayIds.slice(0, 5));
	const todayTasks = orderTasksForToday(allTasks, todayIds).filter((task) =>
		todayTaskIds.has(task.id),
	) as TaskType[];
	const filled = todayTasks.slice(0, 3).length;
	const availableTasks = allTasks.filter((task) => !todayTaskIds.has(task.id));
	const selectTask = (id: string) => {
		onPromote(id);
		setActiveSlot(null);
	};
	const createTask = async () => {
		const content = draft.trim();
		if (!content) return;
		setCreateError("");
		try {
			const task = (await createTodoistTask({ data: { content } })) as TaskType;
			setLocalTasks((current) => [...current, task]);
			setDraft("");
			selectTask(task.id);
		} catch (error) {
			setCreateError(error instanceof Error ? error.message : "Could not create task");
		}
	};

	const headerText =
		filled === 0
			? "What are the 3 things that would make today a win?"
			: filled >= 3
				? "Locked in. These are your only jobs today."
				: `Pick your ${3 - filled} remaining task${3 - filled > 1 ? "s" : ""}`;

	return (
		<div className="space-y-3">
			<p className="text-sm text-[var(--muted)] mb-4">{headerText}</p>

			{Array.from({ length: 5 }).map((_, i) => {
				const task = todayTasks[i] ?? null;
				return (
					<TaskSlot
						key={task?.id ?? `empty-${i}`}
						task={task}
						index={i}
						projectMap={projectMap}
						energy={task ? energyMap[task.id] : undefined}
						pomodoroPhase={focusId === task?.id ? pomodoroPhase : "idle"}
						pomodoroTime={pomodoroTime}
						pomodoroProgress={pomodoroProgress}
						isFocused={focusId === task?.id}
						onPromote={task ? undefined : () => setActiveSlot(i)}
						label={i >= 3 ? `Later ${i - 2}` : undefined}
						onDemote={task ? () => onDemote(task.id) : undefined}
						onMarkDone={task ? () => onMarkDone(task.id) : undefined}
						onEnergyChange={
							task ? (l) => onEnergyChange(task.id, l) : undefined
						}
						onEnergyClear={task ? () => onEnergyClear(task.id) : undefined}
						onStartFocus={task ? () => onStartFocus(task.id) : undefined}
						onStopFocus={onStopFocus}
					/>
				);
			})}

			{activeSlot !== null && (
				<div className="fixed inset-0 z-50 flex items-end bg-black/40" role="dialog" aria-modal="true">
					<div className="w-full rounded-t-2xl bg-[var(--surface)] p-4 pb-8">
						<div className="mx-auto max-w-lg space-y-3">
							<p className="text-sm font-medium text-[var(--text)]">Fill {activeSlot < 3 ? `priority slot ${activeSlot + 1}` : `later slot ${activeSlot - 2}`}</p>
							<div className="flex gap-2">
								<input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createTask(); }} placeholder="Write a new task" className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]" />
								<button type="button" onClick={createTask} disabled={!draft.trim()} className="rounded-lg border-0 bg-[var(--accent)] px-3 text-sm font-medium text-[var(--bg)] disabled:opacity-40">Add</button>
							</div>
							{createError && <p className="text-xs text-red-400">{createError}</p>}
							{availableTasks.length > 0 && <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border)]">{availableTasks.map((task) => <button key={task.id} type="button" onClick={() => selectTask(task.id)} className="block w-full border-0 border-b border-[var(--border)] bg-transparent px-3 py-3 text-left text-sm text-[var(--text)] last:border-b-0">{task.content}</button>)}</div>}
							<button type="button" onClick={() => setActiveSlot(null)} className="text-xs text-[var(--muted)]">Cancel</button>
						</div>
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={() => setShowClockOff(true)}
				className="w-full mt-3 rounded-lg border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text)] hover:border-[var(--accent)] cursor-pointer bg-transparent"
			>
				Clock Off
			</button>

			{showClockOff && (
				<ClockOffModal
					onClose={() => setShowClockOff(false)}
					onSubmit={async (answers) => {
						await saveDailyReview({ data: answers });
						setShowClockOff(false);
					}}
				/>
			)}
		</div>
	);
}
