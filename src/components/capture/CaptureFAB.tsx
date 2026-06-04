interface Props {
  onClick: () => void
}

export function CaptureFAB({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full shadow-lg cursor-pointer border-0 flex items-center justify-center text-2xl transition-transform hover:scale-105 active:scale-95 bg-[var(--accent)] text-[var(--bg)]"
      title="Quick capture"
    >
      +
    </button>
  )
}
