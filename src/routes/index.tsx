import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { getAppState } from '~/server/state'
import { getTasks, getProjects } from '~/server/todoist'
import { useAppStore } from '~/store/useAppStore'
import App from '~/components/App'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [state, tasks, projects] = await Promise.all([
      getAppState(),
      getTasks(),
      getProjects(),
    ])
    return { state, tasks, projects }
  },

  component: IndexPage,
})

function IndexPage() {
  const { state, tasks, projects } = Route.useLoaderData()
  const hydrate = useAppStore((s) => s.hydrate)
  const router = useRouter()

  useEffect(() => {
    hydrate(state)
  }, [state, hydrate])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') router.invalidate()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [router])

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]))

  return <App tasks={tasks} projectMap={projectMap} />
}
