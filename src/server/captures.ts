import { createServerFn } from "@tanstack/react-start";
import { db } from "~/lib/db";
import { todoistClient } from "~/lib/todoist-client";
import { requireAuth } from "./auth-guard.server";

export const createCapture = createServerFn({ method: "POST" })
	.validator(
		(d: unknown) =>
			d as { id: string; text: string; isUrl: boolean; sendToTodoist: boolean },
	)
	.handler(async ({ data }): Promise<{ todoistTaskId?: string }> => {
		await requireAuth();

		let todoistTaskId: string | undefined;
		if (data.sendToTodoist) {
			const content = data.isUrl ? `[Link](${data.text})` : data.text;
			const res = await todoistClient.createTask(content);
			const task = await res.json();
			todoistTaskId = task.id;
		}

		await db`
      INSERT INTO captures (id, text, is_url, sent_to_todoist, todoist_task_id)
      VALUES (
        ${data.id}, ${data.text}, ${data.isUrl},
        ${!!todoistTaskId}, ${todoistTaskId ?? null}
      )
    `;
		return { todoistTaskId };
	});

export const markCaptureSent = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { id: string; todoistTaskId: string })
	.handler(async ({ data }) => {
		await requireAuth();
		await db`
      UPDATE captures
      SET sent_to_todoist = TRUE, todoist_task_id = ${data.todoistTaskId}
      WHERE id = ${data.id}
    `;
	});

export const deleteCapture = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { id: string })
	.handler(async ({ data }) => {
		await requireAuth();
		await db`DELETE FROM captures WHERE id = ${data.id}`;
	});
