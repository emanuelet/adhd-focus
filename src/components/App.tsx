import { useState } from 'react'
import type { Task as TaskType, Project, EnergyLevel } from '~/types/todoist'
import { useAppStore } from '~/store/useAppStore'
import { useMutations } from '~/hooks/useMutations'
import { usePomodoro } from '~/hooks/usePomodoro'
import { Nav } from '~/components/layout/Nav'
import { TodayView } from '~/components/today/TodayView'
import { InboxView } from '~/components/inbox/InboxView'
import { DoneView } from '~/components/done/DoneView'

interface Props {
  tasks: TaskType[]
  projectMap: Record<string, Project>
}

type Tab = 'today' | 'inbox' | 'done'

export default function App({ tasks, projectMap }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const { todayIds, doneIds, energyMap } = useAppStore()
  const { promote, demote, markDone, tagEnergy } = useMutations()
  const pomodoro = usePomodoro()
  const effectiveTodayIds = todayIds.length > 0 ? todayIds : []

  const handleEnergyChange = (taskId: string, level: EnergyLevel) => {
    tagEnergy(taskId, level)
  }

  const handleEnergyClear = (taskId: string) => {
    tagEnergy(taskId, '' as EnergyLevel)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--text)]">⬡ ADHD Focus</h1>
      </div>

      <Nav activeTab={tab} onTabChange={setTab} />

      {tab === 'today' && (
        <TodayView
          tasks={tasks}
          todayIds={effectiveTodayIds}
          projectMap={projectMap}
          energyMap={energyMap}
          focusId={pomodoro.focusId}
          pomodoroPhase={pomodoro.phase}
          pomodoroTime={pomodoro.formatted}
          pomodoroProgress={pomodoro.progress}
          onPromote={promote}
          onDemote={demote}
          onMarkDone={markDone}
          onEnergyChange={handleEnergyChange}
          onEnergyClear={handleEnergyClear}
          onStartFocus={pomodoro.start}
          onStopFocus={pomodoro.stop}
        />
      )}

      {tab === 'inbox' && (
        <InboxView
          tasks={tasks}
          projectMap={projectMap}
          energyMap={energyMap}
          onPromote={promote}
          onEnergyChange={handleEnergyChange}
        />
      )}

      {tab === 'done' && (
        <DoneView
          doneIds={doneIds}
          allTasks={tasks}
        />
      )}
    </div>
  )
}
