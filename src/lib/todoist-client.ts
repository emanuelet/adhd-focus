const BASE = "https://api.todoist.com/api/v1";

function headers() {
	const token = process.env.TODOIST_API_TOKEN;
	if (!token) throw new Error("TODOIST_API_TOKEN not set");
	return {
		Authorization: `Bearer ${token}`,
		"Content-Type": "application/json",
	};
}

async function getAll(url: string, init: RequestInit): Promise<unknown[]> {
	const all: unknown[] = [];
	let cursor: string | null = null;
	do {
		const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
		const res = await fetch(`${url}${query}`, init);
		if (!res.ok) throw res;
		const json = (await res.json()) as {
			results: unknown[];
			next_cursor?: string | null;
		};
		all.push(...(json.results ?? []));
		cursor = json.next_cursor ?? null;
	} while (cursor);
	return all;
}

export const todoistClient = {
	getTasks: () => getAll(`${BASE}/tasks`, { headers: headers() }),
	getProjects: () => getAll(`${BASE}/projects`, { headers: headers() }),
	closeTask: (id: string) =>
		fetch(`${BASE}/tasks/${id}/close`, { method: "POST", headers: headers() }),
	createTask: (content: string) =>
		fetch(`${BASE}/tasks`, {
			method: "POST",
			headers: headers(),
			body: JSON.stringify({ content }),
		}),
};
