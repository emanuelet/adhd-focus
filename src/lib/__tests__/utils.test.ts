import { describe, expect, it } from "vitest";
import { fmt, isUrl, todayStr, uid } from "../utils";

describe("uid", () => {
	it("returns a string", () => {
		expect(typeof uid()).toBe("string");
	});

	it("returns 7 characters", () => {
		expect(uid()).toHaveLength(7);
	});

	it("returns unique values", () => {
		const ids = new Set(Array.from({ length: 100 }, uid));
		expect(ids.size).toBe(100);
	});
});

describe("isUrl", () => {
	it("returns true for http URLs", () => {
		expect(isUrl("http://example.com")).toBe(true);
	});

	it("returns true for https URLs", () => {
		expect(isUrl("https://todoist.com/api")).toBe(true);
	});

	it("returns false for plain text", () => {
		expect(isUrl("buy groceries")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isUrl("")).toBe(false);
	});

	it("requires protocol prefix", () => {
		expect(isUrl("example.com")).toBe(false);
	});
});

describe("todayStr", () => {
	it("returns YYYY-MM-DD format", () => {
		const str = todayStr();
		expect(str).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it("matches actual date", () => {
		const expected = new Date().toISOString().slice(0, 10);
		expect(todayStr()).toBe(expected);
	});
});

describe("fmt", () => {
	it("formats zero", () => {
		expect(fmt(0)).toBe("00:00");
	});

	it("formats seconds only", () => {
		expect(fmt(45)).toBe("00:45");
	});

	it("formats minutes and seconds", () => {
		expect(fmt(125)).toBe("02:05");
	});

	it("formats hours", () => {
		expect(fmt(3661)).toBe("61:01");
	});

	it("pads with leading zeros", () => {
		expect(fmt(5)).toBe("00:05");
		expect(fmt(65)).toBe("01:05");
	});
});
