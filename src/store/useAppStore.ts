import { create } from 'zustand'
import type { AppState, EnergyLevel, Capture } from '~/types/todoist'

interface Store extends AppState {
  hydrate:       (state: AppState) => void
  setTodayIds:   (ids: string[]) => void
  setDoneIds:    (ids: string[]) => void
  setEnergy:     (taskId: string, level: EnergyLevel) => void
  setCaptures:   (captures: Capture[]) => void
  addCapture:    (capture: Capture) => void
  updateCapture: (id: string, patch: Partial<Capture>) => void
  removeCapture: (id: string) => void
}

export const useAppStore = create<Store>()((set) => ({
  todayIds:  [],
  doneIds:   [],
  energyMap: {},
  captures:  [],

  hydrate:       (state)         => set(state),
  setTodayIds:   (ids)           => set({ todayIds: ids }),
  setDoneIds:    (ids)           => set({ doneIds: ids }),
  setEnergy:     (taskId, level) => set((s) => ({ energyMap: { ...s.energyMap, [taskId]: level } })),
  setCaptures:   (captures)      => set({ captures }),
  addCapture:    (cap)           => set((s) => ({ captures: [cap, ...s.captures] })),
  updateCapture: (id, patch)     => set((s) => ({
    captures: s.captures.map((c) => c.id === id ? { ...c, ...patch } : c),
  })),
  removeCapture: (id)            => set((s) => ({
    captures: s.captures.filter((c) => c.id !== id),
  })),
}))
