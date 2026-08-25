export const REVIEW_PROMPTS = [
	"What did I actually move forward today?",
	"What's the one thing that matters most tomorrow?",
	"What loose ends will nag at me if I don't write them down right now?",
] as const;

export interface DailyReviewInput {
	movedForward: string;
	tomorrowPriority: string;
	looseEnds: string;
}

export interface DailyReview extends DailyReviewInput {
	date: string;
	totalSprints: number;
	totalFocusMins: number;
}

export interface StaleReviewSettings {
	mustReadDays: number;
	ideasDays: number;
	looseEndsDays: number;
}

export const DEFAULT_STALE_REVIEW_SETTINGS: StaleReviewSettings = {
	mustReadDays: 7,
	ideasDays: 30,
	looseEndsDays: 7,
};
