import { createServerFn } from "@tanstack/react-start";
import { db } from "~/lib/db";
import type {
	DailyReview,
	DailyReviewInput,
	StaleReviewSettings,
} from "~/types/review";
import { requireAuth } from "./auth-guard.server";

const today = () => new Date().toISOString().slice(0, 10);

export const saveDailyReview = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as DailyReviewInput)
	.handler(async ({ data }): Promise<void> => {
		await requireAuth();
		await db`
      INSERT INTO daily_reviews (
        date, moved_forward_note, tomorrow_priority, loose_ends_note
      ) VALUES (
        ${today()}, ${data.movedForward}, ${data.tomorrowPriority}, ${data.looseEnds}
      )
      ON CONFLICT (date) DO UPDATE SET
        moved_forward_note = EXCLUDED.moved_forward_note,
        tomorrow_priority = EXCLUDED.tomorrow_priority,
        loose_ends_note = EXCLUDED.loose_ends_note,
        updated_at = NOW()
    `;
	});

export const getStaleReviewSettings = createServerFn({ method: "GET" }).handler(
	async (): Promise<StaleReviewSettings> => {
		await requireAuth();
		const rows = await db`
      SELECT must_read_days, ideas_days, loose_ends_days
      FROM review_settings WHERE id = TRUE
    `;
		const row = rows[0] as Record<string, number> | undefined;
		return {
			mustReadDays: row?.must_read_days ?? 7,
			ideasDays: row?.ideas_days ?? 30,
			looseEndsDays: row?.loose_ends_days ?? 7,
		};
	},
);

export const updateStaleReviewSettings = createServerFn({ method: "POST" })
	.validator((d: unknown) => d as StaleReviewSettings)
	.handler(async ({ data }): Promise<void> => {
		await requireAuth();
		await db`
      INSERT INTO review_settings (
        id, must_read_days, ideas_days, loose_ends_days
      ) VALUES (TRUE, ${data.mustReadDays}, ${data.ideasDays}, ${data.looseEndsDays})
      ON CONFLICT (id) DO UPDATE SET
        must_read_days = EXCLUDED.must_read_days,
        ideas_days = EXCLUDED.ideas_days,
        loose_ends_days = EXCLUDED.loose_ends_days,
        updated_at = NOW()
    `;
	});

export const getDailyReview = createServerFn({ method: "GET" }).handler(
	async (): Promise<DailyReview | null> => {
		await requireAuth();
		const rows = await db`
      SELECT date, moved_forward_note, tomorrow_priority, loose_ends_note,
             total_sprints, total_focus_mins
      FROM daily_reviews WHERE date = ${today()}
    `;
		const row = rows[0] as Record<string, string | number | null> | undefined;
		if (!row) return null;
		return {
			date: String(row.date),
			movedForward: String(row.moved_forward_note ?? ""),
			tomorrowPriority: String(row.tomorrow_priority ?? ""),
			looseEnds: String(row.loose_ends_note ?? ""),
			totalSprints: Number(row.total_sprints ?? 0),
			totalFocusMins: Number(row.total_focus_mins ?? 0),
		};
	},
);
