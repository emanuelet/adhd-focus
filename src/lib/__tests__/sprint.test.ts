import { describe, it, expect } from 'vitest'
import type { SprintLength, Sprint } from '~/types/todoist'

const SPRINT_LENGTHS: SprintLength[] = [25, 52, 90, 120]
const BREAK_MAP: Record<SprintLength, number> = {
  25: 5,
  52: 10,
  90: 15,
  120: 20,
}

describe('SprintLength', () => {
  it('has 4 valid lengths', () => {
    expect(SPRINT_LENGTHS).toHaveLength(4)
  })

  it('includes 52 as default length', () => {
    expect(SPRINT_LENGTHS).toContain(52)
  })

  it('all lengths are positive', () => {
    for (const len of SPRINT_LENGTHS) {
      expect(len).toBeGreaterThan(0)
    }
  })

  it('all lengths are valid SprintLength type values', () => {
    const valid: number[] = [25, 52, 90, 120]
    for (const len of SPRINT_LENGTHS) {
      expect(valid).toContain(len)
    }
  })
})

describe('BREAK_MAP', () => {
  it('maps each sprint length to a break duration', () => {
    for (const len of SPRINT_LENGTHS) {
      expect(BREAK_MAP[len]).toBeDefined()
      expect(BREAK_MAP[len]).toBeGreaterThan(0)
    }
  })

  it('shorter sprints have shorter breaks', () => {
    expect(BREAK_MAP[25]).toBeLessThan(BREAK_MAP[52])
    expect(BREAK_MAP[52]).toBeLessThan(BREAK_MAP[90])
    expect(BREAK_MAP[90]).toBeLessThan(BREAK_MAP[120])
  })

  it('break duration is proportional to sprint duration', () => {
    const ratio = (len: SprintLength) => BREAK_MAP[len] / len
    for (const len of SPRINT_LENGTHS) {
      expect(ratio(len)).toBeGreaterThanOrEqual(0.15)
      expect(ratio(len)).toBeLessThanOrEqual(0.2)
    }
  })
})

describe('Sprint type', () => {
  it('is satisfied by a valid sprint object', () => {
    const sprint: Sprint = {
      taskId: 'abc123',
      length: 52,
      startedAt: '2026-06-04T10:00:00Z',
      phase: 'work',
    }
    expect(sprint.taskId).toBe('abc123')
    expect(sprint.length).toBe(52)
    expect(sprint.phase).toBe('work')
  })

  it('accepts all sprint lengths', () => {
    const phases: Sprint['phase'][] = ['work', 'break', 'idle']
    for (const len of SPRINT_LENGTHS) {
      for (const phase of phases) {
        const sprint: Sprint = {
          taskId: 't1',
          length: len,
          startedAt: new Date().toISOString(),
          phase,
        }
        expect(sprint.length).toBe(len)
        expect(sprint.phase).toBe(phase)
      }
    }
  })

  it('rejects invalid lengths at type level', () => {
    const lengths = [25, 52, 90, 120]
    const invalid = [10, 30, 60, 100, 0, -1]
    for (const len of lengths) {
      expect(SPRINT_LENGTHS.includes(len as SprintLength)).toBe(true)
    }
    for (const len of invalid) {
      expect(SPRINT_LENGTHS.includes(len as SprintLength)).toBe(false)
    }
  })
})
