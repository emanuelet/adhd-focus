import type { Task as TaskType } from '~/types/todoist'

interface Props {
  task: TaskType | null
  formatted: string
  progress: number
  phase: 'idle' | 'work' | 'break'
  onStop: () => void
}

export function FocusBanner({ task, formatted, progress, phase, onStop }: Props) {
  if (phase === 'idle' || !task) return null

  return (
    <div className="rounded-xl border border-[var(--accent)] bg-[var(--accent-dim)] p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--accent)] uppercase tracking-wide">
          {phase === 'work' ? 'Focused' : 'Break'}
        </span>
        <button
          type="button"
          onClick={onStop}
          className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-0 px-2 py-1 rounded transition-colors"
        >
          ✕ End
        </button>
      </div>

      <p className="text-sm font-medium text-[var(--text)] truncate mb-3">{task.content}</p>

      <div className="flex items-center gap-3">
        <span className="text-lg font-mono font-medium text-[var(--accent)]">{formatted}</span>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-linear"
            style={{
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: phase === 'work' ? 'var(--accent)' : 'var(--green)',
            }}
          />
        </div>
      </div>
    </div>
  )
}
