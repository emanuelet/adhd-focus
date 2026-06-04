import type { Task as TaskType, EnergyLevel } from '~/types/todoist'
import { TaskSlot } from './TaskSlot'

interface Props {
  tasks: TaskType[]
  todayIds: string[]
  projectMap: Record<string, { id: string; name: string; color: string }>
  energyMap: Record<string, EnergyLevel>
  focusId: string | null
  pomodoroPhase: 'idle' | 'work' | 'break'
  pomodoroTime: string
  pomodoroProgress: number
  onPromote: (id: string) => void
  onDemote: (id: string) => void
  onMarkDone: (id: string) => void
  onEnergyChange: (taskId: string, level: EnergyLevel) => void
  onEnergyClear: (taskId: string) => void
  onStartFocus: (taskId: string) => void
  onStopFocus: () => void
}

export function TodayView({
  tasks, todayIds, projectMap, energyMap,
  focusId, pomodoroPhase, pomodoroTime, pomodoroProgress,
  onDemote, onMarkDone, onEnergyChange, onEnergyClear,
  onStartFocus, onStopFocus,
}: Props) {
  const todayTasks = todayIds.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) as TaskType[]
  const filled = todayTasks.length

  const headerText =
    filled === 0
      ? 'What are the 3 things that would make today a win?'
      : filled >= 3
        ? 'Locked in. These are your only jobs today.'
        : `Pick your ${3 - filled} remaining task${3 - filled > 1 ? 's' : ''}`

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted)] mb-4">{headerText}</p>

      {Array.from({ length: 3 }).map((_, i) => {
        const task = todayTasks[i] ?? null
        return (
          <TaskSlot
            key={task?.id ?? `empty-${i}`}
            task={task}
            index={i}
            projectMap={projectMap}
            energy={task ? energyMap[task.id] : undefined}
            pomodoroPhase={focusId === task?.id ? pomodoroPhase : 'idle'}
            pomodoroTime={pomodoroTime}
            pomodoroProgress={pomodoroProgress}
            isFocused={focusId === task?.id}
            onPromote={task ? undefined : () => {}}
            onDemote={task ? () => onDemote(task.id) : undefined}
            onMarkDone={task ? () => onMarkDone(task.id) : undefined}
            onEnergyChange={task ? (l) => onEnergyChange(task.id, l) : undefined}
            onEnergyClear={task ? () => onEnergyClear(task.id) : undefined}
            onStartFocus={task ? () => onStartFocus(task.id) : undefined}
            onStopFocus={onStopFocus}
          />
        )
      })}
    </div>
  )
}
