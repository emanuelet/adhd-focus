import { useCallback } from "react";
import { executeCommand } from "~/lib/commands";
import { uid } from "~/lib/utils";
import { useAppStore } from "~/store/useAppStore";
import type { EnergyLevel } from "~/types/todoist";

export function useMutations() {
	const store = useAppStore();

	const runOptimistic = useCallback(
		async (
			key: string,
			apply: () => void,
			rollback: () => void,
			operation: () => Promise<unknown>,
		) => {
			const token = store.beginSync(key);
			apply();
			try {
				await operation();
				store.completeSync(key, token);
			} catch (error) {
				if (store.isCurrentSync(key, token)) {
					rollback();
					store.failSync(
						key,
						token,
						error instanceof Error ? error.message : String(error),
					);
				}
				throw error;
			}
		},
		[store],
	);

	const promote = useCallback(
		async (id: string) => {
			const { todayIds } = useAppStore.getState();
			if (todayIds.length >= 3 || todayIds.includes(id)) return;
			const next = [...todayIds, id];
			await runOptimistic(
				"todayIds",
				() => store.setTodayIds(next),
				() => store.setTodayIds(todayIds),
				() => executeCommand("state.today", { todayIds: next }),
			);
		},
		[runOptimistic, store],
	);

	const demote = useCallback(
		async (id: string) => {
			const previous = useAppStore.getState().todayIds;
			const next = previous.filter((x) => x !== id);
			await runOptimistic(
				"todayIds",
				() => store.setTodayIds(next),
				() => store.setTodayIds(previous),
				() => executeCommand("state.today", { todayIds: next }),
			);
		},
		[runOptimistic, store],
	);

	const markDone = useCallback(
		async (id: string) => {
			const s = useAppStore.getState();
			const nextToday = s.todayIds.filter((x) => x !== id);
			const nextDone = s.doneIds.includes(id) ? s.doneIds : [...s.doneIds, id];
			await runOptimistic(
				`task:${id}`,
				() => {
					store.setTodayIds(nextToday);
					store.setDoneIds(nextDone);
				},
				() => {
					store.setTodayIds(s.todayIds);
					store.setDoneIds(s.doneIds);
				},
				() =>
					Promise.all([
						executeCommand("state.today", { todayIds: nextToday }),
						executeCommand("state.done", { doneIds: nextDone }),
						executeCommand("todoist.close", { taskId: id }),
					]),
			);
		},
		[runOptimistic, store],
	);

	const tagEnergy = useCallback(
		async (taskId: string, level: EnergyLevel) => {
			const previous = useAppStore.getState().energyMap[taskId];
			await runOptimistic(
				`energy:${taskId}`,
				() =>
					level ? store.setEnergy(taskId, level) : store.clearEnergy(taskId),
				() => {
					if (previous) store.setEnergy(taskId, previous);
					else store.clearEnergy(taskId);
				},
				() =>
					level
						? executeCommand("energy.set", { taskId, level })
						: executeCommand("energy.delete", { taskId }),
			);
		},
		[runOptimistic, store],
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
			await runOptimistic(
				`capture:${cap.id}`,
				() => store.addCapture(cap),
				() => store.removeCapture(cap.id),
				async () => {
					const result = await executeCommand("capture.create", {
						captureId: cap.id,
						text: cap.text,
						isUrl: cap.isUrl,
						sendToTodoist,
					});
					if (typeof result.todoistTaskId === "string") {
						store.updateCapture(cap.id, {
							sentToTodoist: true,
							todoistTaskId: result.todoistTaskId,
						});
					}
				},
			);
		},
		[runOptimistic, store],
	);

	const sendCaptureToTodoist = useCallback(
		async (captureId: string) => {
			const cap = useAppStore
				.getState()
				.captures.find((c) => c.id === captureId);
			if (!cap) return;
			const content = cap.isUrl ? `[Link](${cap.text})` : cap.text;
			await runOptimistic(
				`capture:${captureId}`,
				() => store.updateCapture(captureId, { sentToTodoist: true }),
				() => store.updateCapture(captureId, cap),
				async () => {
					const result = await executeCommand("capture.send", {
						captureId,
						content,
					});
					if (typeof result.todoistTaskId === "string") {
						store.updateCapture(captureId, { todoistTaskId: result.todoistTaskId });
					}
				},
			);
		},
		[runOptimistic, store],
	);

	const removeCapture = useCallback(
		async (id: string) => {
			const captures = useAppStore.getState().captures;
			const index = captures.findIndex((capture) => capture.id === id);
			const capture = captures[index];
			if (!capture) return;
			await runOptimistic(
				`capture:${id}`,
				() => store.removeCapture(id),
				() => store.restoreCapture(capture, index),
				() => executeCommand("capture.delete", { captureId: id }),
			);
		},
		[runOptimistic, store],
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
