import { useState, useCallback, useEffect } from 'react'
import type { Task as TaskType, Project, EnergyLevel, SprintLength } from '~/types/todoist'
import { useAppStore } from '~/store/useAppStore'
import { useMutations } from '~/hooks/useMutations'
import { usePomodoro } from '~/hooks/usePomodoro'
import { recordSprintCompletion } from '~/server/state'
import { Nav } from '~/components/layout/Nav'
import { FocusBanner } from '~/components/layout/FocusBanner'
import { TodayView } from '~/components/today/TodayView'
import { InboxView } from '~/components/inbox/InboxView'
import { DoneView } from '~/components/done/DoneView'
import { CaptureDrawer } from '~/components/capture/CaptureDrawer'
import { CaptureFAB } from '~/components/capture/CaptureFAB'
import { PreFlightModal } from '~/components/focus/PreFlightModal'
import { SprintPicker } from '~/components/focus/SprintPicker'

interface Props {
  tasks: TaskType[]
  projectMap: Record<string, Project>
}

type Tab = 'today' | 'inbox' | 'done'

export default function App({ tasks, projectMap }: Props) {
  const [tab, setTab] = useState<Tab>('today')
  const [captureOpen, setCaptureOpen] = useState(false)
  const [showPreflight, setShowPreflight] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null)
  const { todayIds, doneIds, energyMap } = useAppStore()
  const { promote, demote, markDone, tagEnergy } = useMutations()
  const pomodoro = usePomodoro()
  const effectiveTodayIds = todayIds.length > 0 ? todayIds : []

  const focusedTask = pomodoro.focusId
    ? tasks.find((t) => t.id === pomodoro.focusId) ?? null
    : null

  const handleSprintComplete = useCallback(async (taskId: string, length: SprintLength) => {
    try {
      await recordSprintCompletion({ data: { taskId, minutes: length } })
    } catch {
      // Silently fail — stats are non-critical
    }
  }, [])

  useEffect(() => {
    pomodoro.setSprintCompleteHandler(handleSprintComplete)
  }, [pomodoro, handleSprintComplete])

  const handleStartFocusRequest = useCallback((taskId: string) => {
    setPendingTaskId(taskId)
    setShowPreflight(true)
  }, [])

  const handlePreflightContinue = useCallback(() => {
    setShowPreflight(false)
    setShowPicker(true)
  }, [])

  const handlePreflightSkip = useCallback(() => {
    setShowPreflight(false)
    setShowPicker(true)
  }, [])

  const handlePickerSelect = useCallback((length: SprintLength) => {
    setShowPicker(false)
    if (pendingTaskId) {
      pomodoro.start(pendingTaskId, length)
      setPendingTaskId(null)
    }
  }, [pendingTaskId, pomodoro])

  const handlePickerClose = useCallback(() => {
    setShowPicker(false)
    setPendingTaskId(null)
  }, [])

  const handlePreflightClose = useCallback(() => {
    setShowPreflight(false)
    setPendingTaskId(null)
  }, [])

  const handleEnergyChange = (taskId: string, level: EnergyLevel) => {
    tagEnergy(taskId, level)
  }

  const handleEnergyClear = (taskId: string) => {
    tagEnergy(taskId, '' as EnergyLevel)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--text)]">⬡ ADHD Focus</h1>
      </div>

      <FocusBanner
        task={focusedTask}
        formatted={pomodoro.formatted}
        progress={pomodoro.progress}
        phase={pomodoro.phase}
        onStop={pomodoro.stop}
      />

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
          onStartFocus={handleStartFocusRequest}
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

      <CaptureFAB onClick={() => setCaptureOpen(true)} />
      <CaptureDrawer open={captureOpen} onClose={() => setCaptureOpen(false)} />

      {showPreflight && (
        <PreFlightModal
          onContinue={handlePreflightContinue}
          onSkip={handlePreflightSkip}
          onClose={handlePreflightClose}
        />
      )}

      {showPicker && (
        <SprintPicker
          onSelect={handlePickerSelect}
          onClose={handlePickerClose}
        />
      )}
    </div>
  )
}
