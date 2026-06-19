import { createServerFn } from "@tanstack/react-start";
import { todoistClient } from "~/lib/todoist-client";
import type { Project, Task } from "~/types/todoist";
import { requireAuth } from "./auth-guard.server";

export const getTasks = createServerFn({ method: "GET" }).handler(
	async (): Promise<Task[]> => {
		await requireAuth();
		return todoistClient.getTasks() as Promise<Task[]>;
	},
);

export const getProjects = createServerFn({ method: "GET" }).handler(
	async (): Promise<Project[]> => {
		await requireAuth();
		return todoistClient.getProjects() as Promise<Project[]>;
	},
);

export const closeTask = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { taskId: string })
	.handler(async ({ data }) => {
		await requireAuth();
		const res = await todoistClient.closeTask(data.taskId);
		if (!res.ok) throw new Error(`Close task failed: ${res.status}`);
	});

export const createTodoistTask = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { content: string })
	.handler(async ({ data }): Promise<{ id: string }> => {
		await requireAuth();
		const res = await todoistClient.createTask(data.content);
		if (!res.ok) throw new Error(`Create task failed: ${res.status}`);
		return res.json();
	});
