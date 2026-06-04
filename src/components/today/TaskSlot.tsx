import type { Task as TaskType, EnergyLevel } from '~/types/todoist'
import { ProjectBadge } from '~/components/shared/ProjectBadge'
import { PriorityBadge } from '~/components/shared/PriorityBadge'
import { PomodoroRing } from '~/components/shared/PomodoroRing'
import { EnergyPicker } from './EnergyPicker'

interface Props {
  task: TaskType | null
  index: number
  projectMap: Record<string, { id: string; name: string; color: string }>
  energy?: EnergyLevel
  pomodoroPhase?: 'idle' | 'work' | 'break'
  pomodoroTime?: string
  pomodoroProgress?: number
  isFocused?: boolean
  onPromote?: () => void
  onDemote?: () => void
  onMarkDone?: () => void
  onEnergyChange?: (level: EnergyLevel) => void
  onEnergyClear?: () => void
  onStartFocus?: () => void
  onStopFocus?: () => void
}

export function TaskSlot({
  task, index, projectMap, energy,
  pomodoroPhase = 'idle', pomodoroTime = '25:00', pomodoroProgress = 0,
  isFocused, onPromote, onDemote, onMarkDone,
  onEnergyChange, onEnergyClear, onStartFocus, onStopFocus,
}: Props) {
  const isEmpty = !task

  if (isEmpty) {
    return (
      <div
        className="rounded-xl border border-dashed border-[var(--border)] p-4 flex items-center justify-center min-h-[80px] cursor-pointer hover:border-[var(--border-alt)] transition-colors"
        onClick={onPromote}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onPromote?.() }}
      >
        <span className="text-sm text-[var(--faint)]">
          Slot {index + 1} — tap to fill
        </span>
      </div>
    )
  }

  const project = projectMap[task.project_id]
  const isActive = isFocused || pomodoroPhase !== 'idle'

  return (
    <div
      className={`rounded-xl border p-4 transition-all ${
        isActive
          ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
          : 'border-[var(--border)] bg-[var(--surface)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={task.priority} />
            {project && <ProjectBadge name={project.name} color={project.color} />}
          </div>
          <p className="text-sm font-medium text-[var(--text)] leading-snug truncate">
            {task.content}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PomodoroRing
            progress={pomodoroProgress}
            phase={pomodoroPhase}
            formatted={pomodoroTime}
            onClick={pomodoroPhase === 'idle' ? onStartFocus : onStopFocus}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <EnergyPicker
          value={energy}
          onChange={(l) => onEnergyChange?.(l)}
          onClear={onEnergyClear}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDemote}
            className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-0 px-2 py-1 rounded transition-colors"
          >
            ← Remove
          </button>
          <button
            type="button"
            onClick={onMarkDone}
            className="text-xs px-3 py-1 rounded cursor-pointer border-0 transition-colors bg-[var(--green-dim)] text-[var(--green)] hover:brightness-110"
          >
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  )
}
