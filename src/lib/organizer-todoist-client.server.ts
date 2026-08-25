const BASE = "https://api.todoist.com/api/v1";

function headers() {
	const token = process.env.TODOIST_API_TOKEN;
	if (!token) throw new Error("TODOIST_API_TOKEN not set");
	return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export function createOrganizerTodoistClient(fetchImpl: typeof fetch = fetch) {
	return {
		createTask: (input: Record<string, unknown>) =>
			fetchImpl(`${BASE}/tasks`, { method: "POST", headers: headers(), body: JSON.stringify(input) }),
		updateTask: (id: string, input: Record<string, unknown>) =>
			fetchImpl(`${BASE}/tasks/${encodeURIComponent(id)}`, {
				method: "POST",
				headers: headers(),
				body: JSON.stringify(input),
			}),
	};
}

export const organizerTodoistClient = createOrganizerTodoistClient();
