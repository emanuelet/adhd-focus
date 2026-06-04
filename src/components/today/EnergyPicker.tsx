import type { EnergyLevel } from '~/types/todoist'

interface Props {
  value?: EnergyLevel
  onChange: (level: EnergyLevel) => void
  onClear?: () => void
}

const LEVELS: { level: EnergyLevel; label: string; emoji: string }[] = [
  { level: 'low', label: 'Low', emoji: '🌱' },
  { level: 'med', label: 'Med', emoji: '⚡' },
  { level: 'high', label: 'High', emoji: '🔥' },
]

export function EnergyPicker({ value, onChange, onClear }: Props) {
  return (
    <div className="flex items-center gap-1">
      {LEVELS.map(({ level, label, emoji }) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border cursor-pointer transition-all ${
            value === level
              ? 'border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]'
              : 'border-[var(--border)] bg-transparent text-[var(--muted)] hover:border-[var(--border-alt)]'
          }`}
          title={label}
        >
          <span>{emoji}</span>
        </button>
      ))}
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-[var(--faint)] hover:text-[var(--muted)] cursor-pointer bg-transparent border-0 px-1"
          title="Clear energy"
        >
          ✕
        </button>
      )}
    </div>
  )
}
