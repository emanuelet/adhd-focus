import { createServerFn } from '@tanstack/react-start'
import { todoistClient } from '~/lib/todoist-client'
import { requireAuth } from './auth'
import type { Task, Project } from '~/types/todoist'

export const getTasks = createServerFn({ method: 'GET' })
  .handler(async (): Promise<Task[]> => {
    await requireAuth()
    const res = await todoistClient.getTasks()
    if (!res.ok) throw new Error(`Todoist tasks: ${res.status}`)
    return res.json()
  })

export const getProjects = createServerFn({ method: 'GET' })
  .handler(async (): Promise<Project[]> => {
    await requireAuth()
    const res = await todoistClient.getProjects()
    if (!res.ok) throw new Error(`Todoist projects: ${res.status}`)
    return res.json()
  })

export const closeTask = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { taskId: string })
  .handler(async ({ data }) => {
    await requireAuth()
    const res = await todoistClient.closeTask(data.taskId)
    if (!res.ok) throw new Error(`Close task failed: ${res.status}`)
  })

export const createTodoistTask = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { content: string })
  .handler(async ({ data }): Promise<{ id: string }> => {
    await requireAuth()
    const res = await todoistClient.createTask(data.content)
    if (!res.ok) throw new Error(`Create task failed: ${res.status}`)
    return res.json()
  })
