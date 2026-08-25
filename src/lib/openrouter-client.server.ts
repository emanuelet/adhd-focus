const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 15_000;

export interface OpenRouterMessage {
	role: "system" | "user";
	content: string;
}

export interface OpenRouterClientOptions {
	fetchImpl?: typeof fetch;
	timeoutMs?: number;
}

function apiKey() {
	const key = process.env.OPENROUTER_API_KEY;
	if (!key) throw new Error("OPENROUTER_API_KEY not set");
	return key;
}

export function createOpenRouterClient(options: OpenRouterClientOptions = {}) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	return {
		async chat(messages: OpenRouterMessage[]): Promise<string> {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const response = await fetchImpl(OPENROUTER_URL, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${apiKey()}`,
						"Content-Type": "application/json",
						"HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost",
					},
					body: JSON.stringify({
						model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini",
						messages,
						temperature: 0,
						response_format: { type: "json_object" },
					}),
					signal: controller.signal,
				});
				if (!response.ok) throw new Error(`OpenRouter request failed: ${response.status}`);
				const body = (await response.json()) as {
					choices?: Array<{ message?: { content?: string | null } }>;
				};
				const content = body.choices?.[0]?.message?.content;
				if (!content) throw new Error("OpenRouter response did not contain content");
				return content;
			} catch (error) {
				if (error instanceof Error && error.name === "AbortError") {
					throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
				}
				throw error;
			} finally {
				clearTimeout(timeout);
			}
		},
	};
}

export const openRouterClient = createOpenRouterClient();
