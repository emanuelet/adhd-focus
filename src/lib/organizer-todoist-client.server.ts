import { TodoistApi, type AddTaskArgs, type UpdateTaskArgs } from "@doist/todoist-sdk";

const BASE = "https://api.todoist.com/api/v1";
const DEFAULT_TIMEOUT_MS = 10_000;

export interface OrganizerTodoistClientOptions {
	fetchImpl?: typeof fetch;
	timeoutMs?: number;
}

export function createOrganizerTodoistClient(options: OrganizerTodoistClientOptions = {}) {
	const fetchImpl = options.fetchImpl ?? fetch;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	let api: TodoistApi | undefined;
	const getApi = () => {
		if (api) return api;
		const token = process.env.TODOIST_API_TOKEN;
		if (!token) throw new Error("TODOIST_API_TOKEN not set");
		api = new TodoistApi(token, {
			baseUrl: BASE,
			customFetch: async (url, options) => {
				const controller = new AbortController();
				const timeout = setTimeout(() => controller.abort(), timeoutMs);
				try {
					const response = await fetchImpl(url, { ...options, signal: controller.signal });
					return {
						ok: response.ok,
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						text: () => response.text(),
						json: () => response.json(),
					};
				} catch (error) {
					if (error instanceof Error && error.name === "AbortError") {
						throw new Error(`Todoist request timed out after ${timeoutMs}ms`);
					}
					throw error;
				} finally {
					clearTimeout(timeout);
				}
			},
		});
		return api;
	};
	return {
		createTask: (input: AddTaskArgs) => getApi().addTask(input),
		updateTask: (id: string, input: UpdateTaskArgs) => getApi().updateTask(id, input),
	};
}

export const organizerTodoistClient = createOrganizerTodoistClient();
