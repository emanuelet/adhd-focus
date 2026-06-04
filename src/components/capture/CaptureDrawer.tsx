import { useState, useRef, useEffect } from 'react'
import { useMutations } from '~/hooks/useMutations'
import { useAppStore } from '~/store/useAppStore'

interface Props {
  open: boolean
  onClose: () => void
}

export function CaptureDrawer({ open, onClose }: Props) {
  const [text, setText] = useState('')
  const [sendToTodoist, setSendToTodoist] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { saveCapture } = useMutations()
  const captures = useAppStore((s) => s.captures)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const handleSave = async () => {
    const trimmed = text.trim()
    if (!trimmed) return
    await saveCapture(trimmed, sendToTodoist)
    setText('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        role="presentation"
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] border-t border-[var(--border)] rounded-t-2xl p-4 pb-8 shadow-2xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[var(--text)]">Quick Capture</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-0"
            >
              ✕ Done capturing
            </button>
          </div>

          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            rows={3}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm p-3 resize-none focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--faint)]"
          />

          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendToTodoist}
                onChange={(e) => setSendToTodoist(e.target.checked)}
                className="rounded border-[var(--border)] bg-[var(--bg)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-xs text-[var(--muted)]">Send to Todoist inbox</span>
            </label>

            <button
              type="button"
              onClick={handleSave}
              disabled={!text.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent)] text-[var(--bg)] hover:brightness-110"
            >
              Save{sendToTodoist ? ' & sync' : ''}
            </button>
          </div>

          {captures.length > 0 && (
            <div className="mt-4 space-y-1">
              <p className="text-xs text-[var(--faint)]">Recent captures</p>
              {captures.slice(0, 5).map((cap) => (
                <div key={cap.id} className="flex items-center gap-2 py-1">
                  <span className="text-xs text-[var(--muted)] truncate flex-1">{cap.text}</span>
                  {cap.sentToTodoist && <span className="text-[10px] text-[var(--green)]">synced</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
