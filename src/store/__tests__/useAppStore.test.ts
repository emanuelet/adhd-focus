import { beforeEach, describe, expect, it } from "vitest";
import type { AppState } from "~/types/todoist";
import { useAppStore } from "../useAppStore";

const mockState: AppState = {
	todayIds: ["a", "b", "c"],
	doneIds: ["d"],
	energyMap: { a: "high", b: "low" },
	captures: [
		{
			id: "c1",
			text: "test",
			isUrl: false,
			createdAt: "2024-01-01",
			sentToTodoist: false,
		},
	],
};

describe("useAppStore", () => {
	beforeEach(() => {
		useAppStore.setState({
			todayIds: [],
			doneIds: [],
			energyMap: {},
			captures: [],
		});
	});

	describe("hydrate", () => {
		it("replaces full state", () => {
			useAppStore.getState().hydrate(mockState);
			const state = useAppStore.getState();
			expect(state.todayIds).toEqual(["a", "b", "c"]);
			expect(state.doneIds).toEqual(["d"]);
			expect(state.energyMap).toEqual({ a: "high", b: "low" });
			expect(state.captures).toHaveLength(1);
		});
	});

	describe("setTodayIds", () => {
		it("updates todayIds", () => {
			useAppStore.getState().setTodayIds(["x", "y"]);
			expect(useAppStore.getState().todayIds).toEqual(["x", "y"]);
		});
	});

	describe("setDoneIds", () => {
		it("updates doneIds", () => {
			useAppStore.getState().setDoneIds(["d1", "d2"]);
			expect(useAppStore.getState().doneIds).toEqual(["d1", "d2"]);
		});
	});

	describe("setEnergy", () => {
		it("sets energy level for a task", () => {
			useAppStore.getState().setEnergy("t1", "high");
			expect(useAppStore.getState().energyMap).toEqual({ t1: "high" });
		});

		it("preserves existing energy entries", () => {
			useAppStore.getState().setEnergy("t1", "high");
			useAppStore.getState().setEnergy("t2", "low");
			expect(useAppStore.getState().energyMap).toEqual({
				t1: "high",
				t2: "low",
			});
		});
	});

	describe("addCapture", () => {
		it("prepends capture to list", () => {
			useAppStore.getState().hydrate(mockState);
			useAppStore.getState().addCapture({
				id: "c2",
				text: "new",
				isUrl: true,
				createdAt: "2024-01-02",
				sentToTodoist: false,
			});
			expect(useAppStore.getState().captures).toHaveLength(2);
			expect(useAppStore.getState().captures[0].id).toBe("c2");
		});
	});

	describe("updateCapture", () => {
		it("patches a capture field", () => {
			useAppStore.getState().hydrate(mockState);
			useAppStore
				.getState()
				.updateCapture("c1", { sentToTodoist: true, todoistTaskId: "r1" });
			const cap = useAppStore.getState().captures[0];
			expect(cap.sentToTodoist).toBe(true);
			expect(cap.todoistTaskId).toBe("r1");
		});
	});

	describe("removeCapture", () => {
		it("removes capture by id", () => {
			useAppStore.getState().hydrate(mockState);
			useAppStore.getState().removeCapture("c1");
			expect(useAppStore.getState().captures).toHaveLength(0);
		});
	});
});
