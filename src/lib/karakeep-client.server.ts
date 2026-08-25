const DEFAULT_TIMEOUT_MS = 10_000;

export interface KarakeepClientOptions {
	fetchImpl?: typeof fetch;
	timeoutMs?: number;
}

function config() {
	const apiKey = process.env.KARAKEEP_API_KEY;
	if (!apiKey) throw new Error("KARAKEEP_API_KEY not set");
	return {
		apiKey,
		baseUrl: (process.env.KARAKEEP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
	};
}

export function createKarakeepClient(options: KarakeepClientOptions = {}) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	return {
		async createBookmark(input: { url: string; title: string; tags: string[] }): Promise<{ id: string }> {
			const { apiKey, baseUrl } = config();
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const response = await fetchImpl(`${baseUrl}/api/v1/bookmarks`, {
					method: "POST",
					headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
					body: JSON.stringify(input),
					signal: controller.signal,
				});
				if (!response.ok) throw new Error(`Karakeep request failed: ${response.status}`);
				const body = (await response.json()) as { id?: string; bookmark?: { id?: string } };
				const id = body.id ?? body.bookmark?.id;
				if (!id) throw new Error("Karakeep response did not contain a bookmark id");
				return { id };
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					throw new Error(`Karakeep request timed out after ${timeoutMs}ms`);
				}
				throw error;
			} finally {
				clearTimeout(timeout);
			}
		},
	};
}

export const karakeepClient = createKarakeepClient();
