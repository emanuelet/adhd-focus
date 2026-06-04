import { useState, useEffect, useRef, useCallback } from 'react'
import type { SprintLength } from '~/types/todoist'

type Phase = 'idle' | 'work' | 'break'

const BREAK_MAP: Record<SprintLength, number> = {
  25: 5,
  52: 10,
  90: 15,
  120: 20,
}

const DEFAULT_LENGTH: SprintLength = 52

export function usePomodoro() {
  const [focusId, setFocusId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [secs, setSecs] = useState(0)
  const [workSecs, setWorkSecs] = useState(DEFAULT_LENGTH * 60)
  const [breakSecs, setBreakSecs] = useState(BREAK_MAP[DEFAULT_LENGTH] * 60)
  const [sprintLength, setSprintLength] = useState<SprintLength>(DEFAULT_LENGTH)
  const ivl = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef<((taskId: string, length: SprintLength) => void) | null>(null)

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
          notify('⏰ Break time!', 'Nice work — take a break.')
          const taskId = focusId
          const len = sprintLength
          if (taskId && onCompleteRef.current) {
            onCompleteRef.current(taskId, len)
          }
          setPhase('break')
          return breakSecs
        }
        notify('🎯 Back to work!', "Break's over.")
        setPhase('idle')
        return workSecs
      })
    }, 1000)
    return () => { if (ivl.current) clearInterval(ivl.current) }
  }, [phase, notify, workSecs, breakSecs, focusId, sprintLength])

  const start = useCallback((taskId: string, length: SprintLength = DEFAULT_LENGTH) => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    const work = length * 60
    const brk = BREAK_MAP[length] * 60
    setSprintLength(length)
    setWorkSecs(work)
    setBreakSecs(brk)
    setFocusId(taskId)
    setPhase('work')
    setSecs(work)
  }, [])

  const stop = useCallback(() => {
    setFocusId(null)
    setPhase('idle')
    setSecs(0)
  }, [])

  const setSprintCompleteHandler = useCallback(
    (fn: (taskId: string, length: SprintLength) => void) => {
      onCompleteRef.current = fn
    },
    [],
  )

  const totalSecs = phase === 'work' ? workSecs : phase === 'break' ? breakSecs : 0
  const progress = totalSecs > 0 ? (totalSecs - secs) / totalSecs : 0
  const formatted = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`

  return { focusId, phase, sprintLength, secs, formatted, progress, start, stop, setSprintCompleteHandler }
}
