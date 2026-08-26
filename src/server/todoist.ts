import { createServerFn } from "@tanstack/react-start";
import { db } from "~/lib/db";
import { todoistClient } from "~/lib/todoist-client";
import type { Project, Task, TodoistTaskUpdate } from "~/types/todoist";
import { requireAuth } from "./auth-guard.server";

let cacheReady: Promise<void> | undefined;

function ensureCache() {
	cacheReady ??= db`
		CREATE TABLE IF NOT EXISTS todoist_cache (
			cache_key TEXT PRIMARY KEY,
			data JSONB NOT NULL,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`.then(() => undefined);
	return cacheReady;
}

async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
	await ensureCache();
	try {
		const data = await load();
		await db`
			INSERT INTO todoist_cache (cache_key, data)
			VALUES (${key}, ${JSON.stringify(data)}::jsonb)
			ON CONFLICT (cache_key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
		`;
		return data;
	} catch (error) {
		const rows = await db<{ data: T }[]>`
			SELECT data FROM todoist_cache WHERE cache_key = ${key}
		`;
		if (rows[0]) return rows[0].data;
		throw error;
	}
}

export const getTasks = createServerFn({ method: "GET" }).handler(
	async (): Promise<Task[]> => {
		await requireAuth();
		return cached("tasks", () => todoistClient.getTasks() as Promise<Task[]>);
	},
);

export const getProjects = createServerFn({ method: "GET" }).handler(
	async (): Promise<Project[]> => {
		await requireAuth();
		return cached("projects", () => todoistClient.getProjects() as Promise<Project[]>);
	},
);

export const closeTask = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { taskId: string })
	.handler(async ({ data }) => {
		await requireAuth();
		const res = await todoistClient.closeTask(data.taskId);
		if (!res.ok) throw new Error(`Close task failed: ${res.status}`);
	});

export const updateTask = createServerFn({ method: "POST" })
	.validator(
		(d: unknown) => d as { taskId: string; updates: TodoistTaskUpdate },
	)
	.handler(async ({ data }) => {
		await requireAuth();
		const res = await todoistClient.updateTask(data.taskId, data.updates);
		if (!res.ok) throw new Error(`Update task failed: ${res.status}`);
		return res.json();
	});

export const createTodoistTask = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { content: string })
	.handler(async ({ data }): Promise<Task> => {
		await requireAuth();
		const res = await todoistClient.createTask(data.content);
		if (!res.ok) throw new Error(`Create task failed: ${res.status}`);
		return res.json() as Promise<Task>;
	});
