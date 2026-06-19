import { createServerFn } from "@tanstack/react-start";
import { db } from "~/lib/db";
import type { AppState } from "~/types/todoist";
import { requireAuth } from "./auth-guard.server";

const today = () => new Date().toISOString().slice(0, 10);

export const getAppState = createServerFn({ method: "GET" }).handler(
	async (): Promise<AppState> => {
		await requireAuth();

		const [stateRows, metaRows, captureRows] = await Promise.all([
			db`SELECT today_ids, done_ids FROM daily_state WHERE date = ${today()}`,
			db`SELECT task_id, level FROM task_meta WHERE level IS NOT NULL`,
			db`SELECT id, text, is_url, created_at, sent_to_todoist, todoist_task_id
         FROM captures ORDER BY created_at DESC`,
		]);

		const state = stateRows[0] ?? { today_ids: [], done_ids: [] };

		return {
			todayIds: state.today_ids,
			doneIds: state.done_ids,
			energyMap: Object.fromEntries(
				metaRows
					.filter((r: any) => r.level)
					.map((r: any) => [r.task_id, r.level]),
			),
			captures: captureRows.map((r: any) => ({
				id: r.id,
				text: r.text,
				isUrl: r.is_url,
				createdAt: r.created_at,
				sentToTodoist: r.sent_to_todoist,
				todoistTaskId: r.todoist_task_id ?? undefined,
			})),
		};
	},
);

export const updateTodayIds = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { todayIds: string[] })
	.handler(async ({ data }) => {
		await requireAuth();
		await db`
      INSERT INTO daily_state (date, today_ids)
      VALUES (${today()}, ${data.todayIds})
      ON CONFLICT (date) DO UPDATE
      SET today_ids = EXCLUDED.today_ids, updated_at = NOW()
    `;
	});

export const updateDoneIds = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { doneIds: string[] })
	.handler(async ({ data }) => {
		await requireAuth();
		await db`
      INSERT INTO daily_state (date, done_ids)
      VALUES (${today()}, ${data.doneIds})
      ON CONFLICT (date) DO UPDATE
      SET done_ids = EXCLUDED.done_ids, updated_at = NOW()
    `;
	});

export const recordSprintCompletion = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as { taskId: string; minutes: number })
	.handler(async ({ data }) => {
		await requireAuth();
		await db`
      INSERT INTO daily_reviews (date, total_sprints, total_focus_mins)
      VALUES (${today()}, 1, ${data.minutes})
      ON CONFLICT (date) DO UPDATE
      SET total_sprints = daily_reviews.total_sprints + 1,
          total_focus_mins = daily_reviews.total_focus_mins + ${data.minutes},
          updated_at = NOW()
    `;
	});
