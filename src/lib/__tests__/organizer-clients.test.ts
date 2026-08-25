import { describe, expect, it, vi } from "vitest";
import { createKarakeepClient } from "~/lib/karakeep-client.server";
import { createOpenRouterClient } from "~/lib/openrouter-client.server";

describe("organizer server clients", () => {
	it("fails clearly when OpenRouter is not configured", async () => {
		const client = createOpenRouterClient({ fetchImpl: vi.fn() });
		await expect(client.chat([{ role: "user", content: "x" }])).rejects.toThrow(
			"OPENROUTER_API_KEY not set",
		);
	});

	it("enforces OpenRouter timeouts", async () => {
		process.env.OPENROUTER_API_KEY = "test-key";
		const fetchImpl = vi.fn((_url: RequestInfo, init?: RequestInit) => {
			return new Promise<Response>((_, reject) => {
				init?.signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
			});
		});
		await expect(createOpenRouterClient({ fetchImpl: fetchImpl as unknown as typeof fetch, timeoutMs: 1 }).chat([])).rejects.toThrow(
			"timed out after 1ms",
		);
		delete process.env.OPENROUTER_API_KEY;
	});

	it("surfaces Karakeep HTTP errors", async () => {
		process.env.KARAKEEP_API_KEY = "test-key";
		const fetchImpl = vi.fn(async () => new Response(null, { status: 503 }));
		await expect(createKarakeepClient({ fetchImpl }).createBookmark({ url: "https://x.test", title: "x", tags: [] })).rejects.toThrow(
			"Karakeep request failed: 503",
		);
		delete process.env.KARAKEEP_API_KEY;
	});
});
