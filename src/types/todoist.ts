export interface Due {
  date: string
  datetime?: string
  string: string
  is_recurring: boolean
  timezone?: string
}

export interface Task {
  id: string
  content: string
  description: string
  project_id: string
  section_id: string | null
  parent_id: string | null
  order: number
  priority: 1 | 2 | 3 | 4
  due: Due | null
  labels: string[]
  is_completed: boolean
  created_at: string
  url: string
}

export interface Project {
  id: string
  name: string
  color: string
  parent_id: string | null
  order: number
  is_favorite: boolean
  is_inbox_project: boolean
}

export type EnergyLevel = 'low' | 'med' | 'high'
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime'

export interface TaskMeta {
  energy?: EnergyLevel
  timeOfDay?: TimeOfDay
}

export interface Capture {
  id: string
  text: string
  isUrl: boolean
  createdAt: string
  sentToTodoist: boolean
  todoistTaskId?: string
}

export interface AppState {
  todayIds: string[]
  doneIds: string[]
  energyMap: Record<string, EnergyLevel>
  captures: Capture[]
}

export type SprintLength = 25 | 52 | 90 | 120

export interface Sprint {
  taskId: string
  length: SprintLength
  startedAt: string
  phase: 'work' | 'break' | 'idle'
}
