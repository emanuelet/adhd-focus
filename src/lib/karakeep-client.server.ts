import { createKarakeepClient as createSdkClient } from "@karakeep/sdk";

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
			const sdk = createSdkClient({
				baseUrl: `${baseUrl}/api/v1`,
				headers: { Authorization: `Bearer ${apiKey}` },
				fetch: (request: Request) => {
					const controller = new AbortController();
					const timeout = setTimeout(() => controller.abort(), timeoutMs);
					return fetchImpl(new Request(request, { signal: controller.signal })).finally(() => clearTimeout(timeout));
				},
			});
			const created = await sdk.POST("/bookmarks", {
				body: { type: "link", url: input.url, title: input.title },
			});
			if (created.error || !created.data) throw new Error("Karakeep bookmark creation failed");
			const tagged = await sdk.POST("/bookmarks/{bookmarkId}/tags", {
				params: { path: { bookmarkId: created.data.id } },
				body: { tags: input.tags.map((tagName) => ({ tagName, attachedBy: "human" as const })) },
			});
			if (tagged.error) throw new Error("Karakeep bookmark tagging failed");
			return { id: created.data.id };
		},
	};
}

export const karakeepClient = createKarakeepClient();
