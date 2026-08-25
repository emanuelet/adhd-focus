// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppStore } from "~/store/useAppStore";
import { useMutations } from "../useMutations";

const mocks = vi.hoisted(() => ({
	updateTodayIds: vi.fn(),
	updateDoneIds: vi.fn(),
	closeTask: vi.fn(),
	setEnergy: vi.fn(),
	deleteEnergy: vi.fn(),
	createCapture: vi.fn(),
	deleteCapture: vi.fn(),
}));

vi.mock("~/server/state", () => ({
	updateTodayIds: mocks.updateTodayIds,
	updateDoneIds: mocks.updateDoneIds,
}));
vi.mock("~/server/todoist", () => ({
	closeTask: mocks.closeTask,
	createTodoistTask: vi.fn(),
}));
vi.mock("~/server/energy", () => ({
	setEnergy: mocks.setEnergy,
	deleteEnergy: mocks.deleteEnergy,
}));
vi.mock("~/server/captures", () => ({
	createCapture: mocks.createCapture,
	deleteCapture: mocks.deleteCapture,
}));

describe("useMutations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAppStore.setState({
			todayIds: [],
			doneIds: [],
			energyMap: {},
			captures: [],
			syncState: {},
		});
	});

	it("rolls back an optimistic promote and exposes the failure", async () => {
		useAppStore.setState({ todayIds: ["existing"] });
		mocks.updateTodayIds.mockRejectedValueOnce(new Error("offline"));
		const { result } = renderHook(() => useMutations());

		await expect(act(() => result.current.promote("new-task"))).rejects.toThrow(
			"offline",
		);

		expect(useAppStore.getState().todayIds).toEqual(["existing"]);
		expect(useAppStore.getState().syncState.todayIds).toEqual({
			status: "failed",
			error: "offline",
		});
	});

	it("exposes pending state while a mutation is in flight", async () => {
		let resolveRequest!: () => void;
		mocks.updateTodayIds.mockImplementationOnce(
			() => new Promise<void>((resolve) => (resolveRequest = resolve)),
		);
		const { result } = renderHook(() => useMutations());

		const mutation = act(() => result.current.promote("task-1"));
		expect(useAppStore.getState().syncState.todayIds).toEqual({
			status: "pending",
		});
		resolveRequest();
		await mutation;
		expect(useAppStore.getState().syncState).toEqual({});
	});

	it("clears pending state after a successful energy sync", async () => {
		mocks.setEnergy.mockResolvedValueOnce(undefined);
		const { result } = renderHook(() => useMutations());

		await act(() => result.current.tagEnergy("task-1", "high"));

		expect(useAppStore.getState().energyMap).toEqual({ "task-1": "high" });
		expect(useAppStore.getState().syncState).toEqual({});
	});

	it("restores a removed capture when persistence fails", async () => {
		const capture = {
			id: "capture-1",
			text: "Keep this",
			isUrl: false,
			createdAt: "2024-01-01",
			sentToTodoist: false,
		};
		useAppStore.setState({ captures: [capture] });
		mocks.deleteCapture.mockRejectedValueOnce(new Error("db unavailable"));
		const { result } = renderHook(() => useMutations());

		await expect(
			act(() => result.current.removeCapture(capture.id)),
		).rejects.toThrow("db unavailable");

		expect(useAppStore.getState().captures).toEqual([capture]);
		expect(useAppStore.getState().syncState["capture:capture-1"]).toEqual({
			status: "failed",
			error: "db unavailable",
		});
	});
});
