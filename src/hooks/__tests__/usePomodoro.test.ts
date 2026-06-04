// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoro } from '../usePomodoro'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('usePomodoro', () => {
  it('starts in idle phase with no focusId', () => {
    const { result } = renderHook(() => usePomodoro())
    expect(result.current.phase).toBe('idle')
    expect(result.current.focusId).toBeNull()
    expect(result.current.formatted).toBe('00:00')
    expect(result.current.progress).toBe(0)
  })

  it('enters work phase when start is called', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1') })
    expect(result.current.phase).toBe('work')
    expect(result.current.focusId).toBe('task-1')
  })

  it('defaults to 52 minute sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1') })
    expect(result.current.sprintLength).toBe(52)
    expect(result.current.formatted).toBe('52:00')
  })

  it('accepts custom sprint length', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 25) })
    expect(result.current.sprintLength).toBe(25)
    expect(result.current.formatted).toBe('25:00')
  })

  it('accepts 90 minute sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 90) })
    expect(result.current.sprintLength).toBe(90)
    expect(result.current.formatted).toBe('90:00')
  })

  it('accepts 120 minute sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 120) })
    expect(result.current.sprintLength).toBe(120)
    expect(result.current.formatted).toBe('120:00')
  })

  it('progress increases as time passes', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 25) })
    expect(result.current.progress).toBe(0)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(result.current.progress).toBeGreaterThan(0)
    expect(result.current.progress).toBeLessThan(1)
  })

  it('formatted counts down', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 25) })
    expect(result.current.formatted).toBe('25:00')
    act(() => { vi.advanceTimersByTime(60000) })
    expect(result.current.formatted).toBe('24:00')
  })

  it('stop resets to idle', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1') })
    expect(result.current.phase).toBe('work')
    act(() => { result.current.stop() })
    expect(result.current.phase).toBe('idle')
    expect(result.current.focusId).toBeNull()
    expect(result.current.formatted).toBe('00:00')
  })

  it('transitions to break phase when work completes', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 25) })
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000) })
    expect(result.current.phase).toBe('break')
  })

  it('break phase has correct duration for 25 min sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 25) })
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000) })
    expect(result.current.phase).toBe('break')
    expect(result.current.formatted).toBe('05:00')
  })

  it('break phase has correct duration for 52 min sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 52) })
    act(() => { vi.advanceTimersByTime(52 * 60 * 1000) })
    expect(result.current.phase).toBe('break')
    expect(result.current.formatted).toBe('10:00')
  })

  it('break phase has correct duration for 90 min sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 90) })
    act(() => { vi.advanceTimersByTime(90 * 60 * 1000) })
    expect(result.current.phase).toBe('break')
    expect(result.current.formatted).toBe('15:00')
  })

  it('break phase has correct duration for 120 min sprint', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 120) })
    act(() => { vi.advanceTimersByTime(120 * 60 * 1000) })
    expect(result.current.phase).toBe('break')
    expect(result.current.formatted).toBe('20:00')
  })

  it('calls onComplete handler when work phase ends', () => {
    const { result } = renderHook(() => usePomodoro())
    const handler = vi.fn()
    act(() => { result.current.setSprintCompleteHandler(handler) })
    act(() => { result.current.start('task-1', 25) })
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000) })
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith('task-1', 25)
  })

  it('does not call onComplete handler during work phase', () => {
    const { result } = renderHook(() => usePomodoro())
    const handler = vi.fn()
    act(() => { result.current.setSprintCompleteHandler(handler) })
    act(() => { result.current.start('task-1', 25) })
    act(() => { vi.advanceTimersByTime(10000) })
    expect(handler).not.toHaveBeenCalled()
  })

  it('does not call onComplete when no handler is set', () => {
    const { result } = renderHook(() => usePomodoro())
    act(() => { result.current.start('task-1', 25) })
    act(() => { vi.advanceTimersByTime(25 * 60 * 1000) })
    expect(result.current.phase).toBe('break')
  })
})
