import { useState } from 'react'

const PREFLIGHT_ITEMS = [
  { id: 'phone', label: 'Phone face-down or in another room' },
  { id: 'sites', label: 'Distracting sites blocked' },
  { id: 'water', label: 'Water + anything you need is nearby' },
  { id: 'ritual', label: 'Work ritual started (music, coffee, etc.)' },
]

interface Props {
  onContinue: () => void
  onSkip: () => void
  onClose: () => void
}

export function PreFlightModal({ onContinue, onSkip, onClose }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allChecked = PREFLIGHT_ITEMS.every((item) => checked.has(item.id))

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} role="presentation" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-base font-semibold text-[var(--text)] mb-1">Pre-flight check</h2>
          <p className="text-sm text-[var(--muted)] mb-4">
            Set yourself up for a focused sprint.
          </p>

          <div className="space-y-3 mb-6">
            {PREFLIGHT_ITEMS.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="mt-0.5 rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span className="text-sm text-[var(--text)]">{item.label}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-[var(--muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-0"
            >
              Skip ritual
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={!allChecked}
              className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] text-[var(--bg)] hover:brightness-110"
            >
              Start sprint →
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
