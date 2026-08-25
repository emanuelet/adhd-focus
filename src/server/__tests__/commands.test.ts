import { describe, expect, it } from "vitest";
import { validateCommand } from "../commands";

describe("command validation", () => {
	it("accepts a serializable idempotent command", () => {
		expect(
			validateCommand({
				id: "550e8400-e29b-41d4-a716-446655440000",
				kind: "state.today",
				payload: { todayIds: ["task-1"] },
			}),
		).toMatchObject({ kind: "state.today" });
	});

	it("rejects unknown commands and non-UUID ids", () => {
		expect(() =>
			validateCommand({ id: "invalid", kind: "state.today", payload: {} }),
		).toThrow("command.id must be a UUID");
		expect(() =>
			validateCommand({
				id: "550e8400-e29b-41d4-a716-446655440000",
				kind: "unknown",
				payload: {},
			}),
		).toThrow("command.kind is invalid");
	});
});
