import { create } from "zustand";
import type {
	AppState,
	Capture,
	EnergyLevel,
	SyncState,
} from "~/types/todoist";

let nextSyncToken = 0;
const syncTokens = new Map<string, string>();

interface Store extends AppState {
	hydrate: (state: AppState) => void;
	setTodayIds: (ids: string[]) => void;
	setDoneIds: (ids: string[]) => void;
	setEnergy: (taskId: string, level: EnergyLevel) => void;
	clearEnergy: (taskId: string) => void;
	setCaptures: (captures: Capture[]) => void;
	addCapture: (capture: Capture) => void;
	updateCapture: (id: string, patch: Partial<Capture>) => void;
	removeCapture: (id: string) => void;
	restoreCapture: (capture: Capture, index: number) => void;
	syncState: Record<string, SyncState>;
	beginSync: (key: string) => string;
	completeSync: (key: string, token: string) => void;
	failSync: (key: string, token: string, error: string) => void;
	isCurrentSync: (key: string, token: string) => boolean;
}

export const useAppStore = create<Store>()((set) => ({
	todayIds: [],
	doneIds: [],
	energyMap: {},
	captures: [],
	syncState: {},

	hydrate: (state) => set(state),
	setTodayIds: (ids) => set({ todayIds: ids }),
	setDoneIds: (ids) => set({ doneIds: ids }),
	setEnergy: (taskId, level) =>
		set((s) => ({ energyMap: { ...s.energyMap, [taskId]: level } })),
	clearEnergy: (taskId) =>
		set((s) => {
			const energyMap = { ...s.energyMap };
			delete energyMap[taskId];
			return { energyMap };
		}),
	setCaptures: (captures) => set({ captures }),
	addCapture: (cap) => set((s) => ({ captures: [cap, ...s.captures] })),
	updateCapture: (id, patch) =>
		set((s) => ({
			captures: s.captures.map((c) => (c.id === id ? { ...c, ...patch } : c)),
		})),
	removeCapture: (id) =>
		set((s) => ({
			captures: s.captures.filter((c) => c.id !== id),
		})),
	restoreCapture: (capture, index) =>
		set((s) => {
			const captures = s.captures.filter((c) => c.id !== capture.id);
			captures.splice(Math.min(index, captures.length), 0, capture);
			return { captures };
		}),
	beginSync: (key) => {
		const token = `${++nextSyncToken}`;
		syncTokens.set(key, token);
		set((s) => ({
			syncState: { ...s.syncState, [key]: { status: "pending" } },
		}));
		return token;
	},
	completeSync: (key, token) =>
		set((s) => {
			if (syncTokens.get(key) !== token) return s;
			syncTokens.delete(key);
			const syncState = { ...s.syncState };
			delete syncState[key];
			return { syncState };
		}),
	failSync: (key, token, error) =>
		set((s) =>
			syncTokens.get(key) === token
				? { syncState: { ...s.syncState, [key]: { status: "failed", error } } }
				: s,
		),
		isCurrentSync: (key, token) =>
			syncTokens.get(key) === token,
}));
