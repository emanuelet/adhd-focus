import { useState, useEffect, useRef, useCallback } from 'react'

type Phase = 'idle' | 'work' | 'break'

const WORK_SECS = 25 * 60
const BREAK_SECS = 5 * 60

export function usePomodoro() {
  const [focusId, setFocusId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [secs, setSecs] = useState(WORK_SECS)
  const ivl = useRef<ReturnType<typeof setInterval> | null>(null)

  const notify = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icons/icon-192.png' })
    }
  }, [])

  useEffect(() => {
    if (ivl.current) clearInterval(ivl.current)
    if (phase === 'idle') return
    ivl.current = setInterval(() => {
      setSecs((s) => {
        if (s > 1) return s - 1
        if (phase === 'work') {
          notify('⏰ Break time!', 'Nice work — 5 minutes.')
          setPhase('break')
          return BREAK_SECS
        }
        notify('🎯 Back to work!', "Break's over.")
        setPhase('idle')
        return WORK_SECS
      })
    }, 1000)
    return () => { if (ivl.current) clearInterval(ivl.current) }
  }, [phase, notify])

  const start = useCallback((taskId: string) => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setFocusId(taskId)
    setPhase('work')
    setSecs(WORK_SECS)
  }, [])

  const stop = useCallback(() => {
    setFocusId(null)
    setPhase('idle')
    setSecs(WORK_SECS)
  }, [])

  const totalSecs = phase === 'break' ? BREAK_SECS : WORK_SECS
  const progress = (totalSecs - secs) / totalSecs
  const formatted = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  return { focusId, phase, secs, formatted, progress, start, stop }
}
