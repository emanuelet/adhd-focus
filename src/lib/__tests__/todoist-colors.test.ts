import { describe, expect, it } from "vitest";
import { resolveColor } from "../todoist-colors";

describe("resolveColor", () => {
	it("resolves berry_red", () => {
		expect(resolveColor("berry_red")).toBe("#b8256f");
	});

	it("resolves blue", () => {
		expect(resolveColor("blue")).toBe("#4272b3");
	});

	it("resolves charcoal", () => {
		expect(resolveColor("charcoal")).toBe("#7a7a7a");
	});

	it("returns unknown colors as-is", () => {
		expect(resolveColor("#ff5500")).toBe("#ff5500");
	});

	it("returns hex values unchanged", () => {
		expect(resolveColor("#abc")).toBe("#abc");
	});
});
