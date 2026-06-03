import { createServerFn } from '@tanstack/react-start'
import { db } from '~/lib/db'
import { requireAuth } from './auth'
import type { EnergyLevel } from '~/types/todoist'

export const setEnergy = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { taskId: string; level: EnergyLevel })
  .handler(async ({ data }) => {
    await requireAuth()
    await db`
      INSERT INTO task_meta (task_id, level)
      VALUES (${data.taskId}, ${data.level})
      ON CONFLICT (task_id) DO UPDATE
      SET level = EXCLUDED.level, updated_at = NOW()
    `
  })

export const deleteEnergy = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => d as { taskId: string })
  .handler(async ({ data }) => {
    await requireAuth()
    await db`UPDATE task_meta SET level = NULL, updated_at = NOW() WHERE task_id = ${data.taskId}`
  })
