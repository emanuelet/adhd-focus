interface Props {
  activeTab: 'today' | 'inbox' | 'done'
  onTabChange: (tab: 'today' | 'inbox' | 'done') => void
}

const TABS = [
  { id: 'today' as const, label: 'Today' },
  { id: 'inbox' as const, label: 'Inbox' },
  { id: 'done' as const, label: 'Done' },
]

export function Nav({ activeTab, onTabChange }: Props) {
  return (
    <nav className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] mb-6">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg cursor-pointer border-0 transition-all ${
            activeTab === tab.id
              ? 'bg-[var(--bg)] text-[var(--accent)] shadow-sm'
              : 'bg-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
