interface Props {
  progress: number
  phase: 'idle' | 'work' | 'break'
  formatted: string
  size?: number
  onClick?: () => void
}

const PHASE_COLORS = {
  idle: 'var(--faint)',
  work: 'var(--accent)',
  break: 'var(--green)',
}

export function PomodoroRing({ progress, phase, formatted, size = 72, onClick }: Props) {
  const r = 30
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.min(progress, 1))
  const color = PHASE_COLORS[phase]

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center justify-center rounded-full bg-transparent border-0 cursor-pointer p-0 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      style={{ width: size, height: size }}
      title={phase === 'idle' ? 'Start focus' : phase === 'work' ? 'Stop' : 'Break in progress'}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-linear"
        />
      </svg>
      <span className="relative text-xs font-mono font-medium" style={{ color }}>
        {formatted}
      </span>
    </button>
  )
}
