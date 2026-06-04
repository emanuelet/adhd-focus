import type { Task as TaskType, EnergyLevel } from '~/types/todoist'
import { ProjectBadge } from '~/components/shared/ProjectBadge'
import { PriorityBadge } from '~/components/shared/PriorityBadge'

interface Props {
  task: TaskType
  projectMap: Record<string, { id: string; name: string; color: string }>
  energy?: EnergyLevel
  onPromote: () => void
  onEnergyChange: (level: EnergyLevel) => void
}

export function InboxRow({ task, projectMap, energy, onPromote, onEnergyChange }: Props) {
  const project = projectMap[task.project_id]

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--surface-alt)] transition-colors">
      <button
        type="button"
        onClick={onPromote}
        className="shrink-0 w-6 h-6 rounded-full border-2 border-[var(--faint)] flex items-center justify-center text-xs text-[var(--faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer bg-transparent transition-colors"
        title="Promote to today"
      >
        +
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          <span className="text-sm text-[var(--text)] truncate">{task.content}</span>
        </div>
        {project && (
          <div className="mt-0.5">
            <ProjectBadge name={project.name} color={project.color} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {(['low', 'med', 'high'] as EnergyLevel[]).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onEnergyChange(level)}
            className={`text-xs px-1.5 py-0.5 rounded cursor-pointer border transition-colors ${
              energy === level
                ? 'border-[var(--accent)] bg-[var(--accent-dim)]'
                : 'border-transparent text-[var(--faint)] hover:text-[var(--muted)]'
            }`}
          >
            {level === 'low' ? '🌱' : level === 'med' ? '⚡' : '🔥'}
          </button>
        ))}
      </div>
    </div>
  )
}
