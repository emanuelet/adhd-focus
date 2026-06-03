import { createFileRoute } from '@tanstack/react-router'
import { getAppState } from '~/server/state'
import { getTasks, getProjects } from '~/server/todoist'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [state, tasks, projects] = await Promise.all([
      getAppState(),
      getTasks(),
      getProjects(),
    ])
    console.log('[Phase 4 verify] state:', state)
    console.log('[Phase 4 verify] tasks:', tasks)
    console.log('[Phase 4 verify] projects:', projects)
    return { state, tasks, projects }
  },

  component: Home,
})

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold">⬡ ADHD Focus</h1>
      <p className="mt-4 text-lg">Loading…</p>
    </div>
  )
}
