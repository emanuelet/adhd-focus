interface Props {
  priority: 1 | 2 | 3 | 4
}

const COLORS: Record<number, string> = {
  1: 'var(--muted)',
  2: 'var(--text)',
  3: 'var(--blue)',
  4: 'var(--red)',
}

const LABELS: Record<number, string> = {
  1: 'p4',
  2: 'p3',
  3: 'p2',
  4: 'p1',
}

export function PriorityBadge({ priority }: Props) {
  return (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono leading-none"
      style={{
        color: COLORS[priority],
        border: `1px solid ${COLORS[priority]}`,
        opacity: priority === 1 ? 0.4 : 1,
      }}
    >
      {LABELS[priority]}
    </span>
  )
}
