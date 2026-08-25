import { HTTPClient, OpenRouter } from "@openrouter/sdk";

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
	const client = new OpenRouter({
		apiKey: async () => apiKey(),
		httpClient: new HTTPClient({ fetcher: fetchImpl }),
	});

	return {
		async chat(messages: OpenRouterMessage[]): Promise<string> {
			try {
				const response = await client.chat.send(
					{
						httpReferer: process.env.OPENROUTER_SITE_URL ?? "http://localhost",
						chatRequest: {
							model: process.env.OPENROUTER_MODEL ?? "openai/gpt-5.6-luna",
							messages,
							stream: false,
							responseFormat: { type: "json_object" },
						},
					},
					{ timeoutMs },
				);
				if (!("choices" in response)) throw new Error("OpenRouter response was streamed unexpectedly");
				const content = response.choices[0]?.message.content;
				if (typeof content !== "string" || content.length === 0) {
					throw new Error("OpenRouter response did not contain content");
				}
				return content;
			} catch (error) {
				if (error instanceof Error && (error.name === "AbortError" || /timeout|aborted/i.test(error.message))) {
					throw new Error(`OpenRouter request timed out after ${timeoutMs}ms`);
				}
				throw error;
			}
		},
	};
}

export const openRouterClient = createOpenRouterClient();
