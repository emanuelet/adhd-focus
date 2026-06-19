export function uid(): string {
	return Math.random().toString(36).slice(2, 9);
}

export function isUrl(text: string): boolean {
	return /^https?:\/\/\S+/.test(text.trim());
}

export function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

export function fmt(secs: number): string {
	const m = Math.floor(secs / 60);
	const s = secs % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
