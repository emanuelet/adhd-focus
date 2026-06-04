import type { Task as TaskType, EnergyLevel } from '~/types/todoist'
import { InboxRow } from './InboxRow'

interface Props {
  tasks: TaskType[]
  projectMap: Record<string, { id: string; name: string; color: string }>
  energyMap: Record<string, EnergyLevel>
  onPromote: (id: string) => void
  onEnergyChange: (taskId: string, level: EnergyLevel) => void
}

export function InboxView({ tasks, projectMap, energyMap, onPromote, onEnergyChange }: Props) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-[var(--muted)] px-4 mb-2">
        {tasks.length} task{tasks.length !== 1 ? 's' : ''} in backlog
      </p>

      {tasks.length === 0 ? (
        <p className="text-sm text-[var(--faint)] px-4">No tasks in backlog.</p>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {tasks.map((task) => (
            <InboxRow
              key={task.id}
              task={task}
              projectMap={projectMap}
              energy={energyMap[task.id]}
              onPromote={() => onPromote(task.id)}
              onEnergyChange={(level) => onEnergyChange(task.id, level)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
