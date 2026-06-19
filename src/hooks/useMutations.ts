import { useCallback } from "react";
import { uid } from "~/lib/utils";
import {
	createCapture,
	deleteCapture as deleteCaptureFn,
	markCaptureSent,
} from "~/server/captures";
import { setEnergy as setEnergyFn } from "~/server/energy";
import { updateDoneIds, updateTodayIds } from "~/server/state";
import { closeTask, createTodoistTask } from "~/server/todoist";
import { useAppStore } from "~/store/useAppStore";
import type { EnergyLevel } from "~/types/todoist";

export function useMutations() {
	const store = useAppStore();

	const promote = useCallback(
		async (id: string) => {
			const { todayIds } = useAppStore.getState();
			if (todayIds.length >= 3 || todayIds.includes(id)) return;
			const next = [...todayIds, id];
			store.setTodayIds(next);
			await updateTodayIds({ data: { todayIds: next } });
		},
		[store],
	);

	const demote = useCallback(
		async (id: string) => {
			const next = useAppStore.getState().todayIds.filter((x) => x !== id);
			store.setTodayIds(next);
			await updateTodayIds({ data: { todayIds: next } });
		},
		[store],
	);

	const markDone = useCallback(
		async (id: string) => {
			const s = useAppStore.getState();
			const nextToday = s.todayIds.filter((x) => x !== id);
			const nextDone = s.doneIds.includes(id) ? s.doneIds : [...s.doneIds, id];
			store.setTodayIds(nextToday);
			store.setDoneIds(nextDone);
			await Promise.all([
				updateTodayIds({ data: { todayIds: nextToday } }),
				updateDoneIds({ data: { doneIds: nextDone } }),
				closeTask({ data: { taskId: id } }),
			]);
		},
		[store],
	);

	const tagEnergy = useCallback(
		async (taskId: string, level: EnergyLevel) => {
			store.setEnergy(taskId, level);
			await setEnergyFn({ data: { taskId, level } });
		},
		[store],
	);

	const saveCapture = useCallback(
		async (text: string, sendToTodoist = false) => {
			const cap = {
				id: uid(),
				text,
				isUrl: /^https?:\/\/\S+/.test(text.trim()),
				createdAt: new Date().toISOString(),
				sentToTodoist: sendToTodoist,
			};
			store.addCapture(cap);
			const result = await createCapture({ data: { ...cap, sendToTodoist } });
			if (result.todoistTaskId) {
				store.updateCapture(cap.id, {
					sentToTodoist: true,
					todoistTaskId: result.todoistTaskId,
				});
			}
		},
		[store],
	);

	const sendCaptureToTodoist = useCallback(
		async (captureId: string) => {
			const cap = useAppStore
				.getState()
				.captures.find((c) => c.id === captureId);
			if (!cap) return;
			const content = cap.isUrl ? `[Link](${cap.text})` : cap.text;
			const { id: todoistTaskId } = await createTodoistTask({
				data: { content },
			});
			store.updateCapture(captureId, { sentToTodoist: true, todoistTaskId });
			await markCaptureSent({ data: { id: captureId, todoistTaskId } });
		},
		[store],
	);

	const removeCapture = useCallback(
		async (id: string) => {
			store.removeCapture(id);
			await deleteCaptureFn({ data: { id } });
		},
		[store],
	);

	return {
		promote,
		demote,
		markDone,
		tagEnergy,
		saveCapture,
		sendCaptureToTodoist,
		removeCapture,
	};
}
