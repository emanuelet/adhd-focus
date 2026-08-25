import { describe, expect, it } from "vitest";
import { validateFocusSlots, validatePullInput, validatePushInput } from "../sync";

const operation = {
	id: "550e8400-e29b-41d4-a716-446655440000",
	entity: "focus_slots",
	key: "2026-08-25",
	action: "upsert",
	baseRevision: "0",
	data: { slots: ["task-1", "task-2", "task-3"] },
};

describe("sync validation", () => {
	it("accepts a JSON-safe three-slot document", () => {
		expect(validateFocusSlots(operation.data)).toBeUndefined();
		expect(validatePushInput({ operations: [operation] })).toEqual({ operations: [operation] });
	});

	it("rejects duplicate focus tasks as a server-side collision", () => {
		expect(validateFocusSlots({ slots: ["task-1", "task-1"] })).toBe("a task cannot occupy more than one focus slot");
	});

	it("rejects more than three focus slots", () => {
		expect(validateFocusSlots({ slots: ["1", "2", "3", "4"] })).toContain("at most three");
	});

	it("rejects malformed and non-JSON operation input at runtime", () => {
		expect(() => validatePushInput({ operations: [{ ...operation, id: "not-a-uuid" }] })).toThrow("operation.id must be a UUID");
		expect(() => validatePushInput({ operations: [{ ...operation, data: { bad: undefined } }] })).toThrow("operation.data must be JSON object");
	});

	it("validates authenticated cursor input without creating Date or bigint values", () => {
		expect(validatePullInput({ cursor: "12", limit: 50 })).toEqual({ cursor: "12", limit: 50 });
		expect(() => validatePullInput({ cursor: "12.5" })).toThrow("cursor must be a decimal string");
		expect(() => validatePullInput({ limit: 501 })).toThrow("limit must be an integer");
	});
});
