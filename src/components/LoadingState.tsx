interface Props {
	message?: string;
}

export function LoadingState({ message = "Loading…" }: Props) {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8">
			<div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin mb-3" />
			<p className="text-sm text-[var(--muted)]">{message}</p>
		</div>
	);
}
