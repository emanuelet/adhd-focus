import type { StaleReviewSettings as Settings } from "~/types/review";

interface Props {
	settings: Settings;
	onChange: (settings: Settings) => void;
	onSave?: () => void | Promise<void>;
}

const FIELDS: Array<{ key: keyof Settings; label: string }> = [
	{ key: "mustReadDays", label: "Must-read" },
	{ key: "ideasDays", label: "Ideas and projects" },
	{ key: "looseEndsDays", label: "Loose ends" },
];

export function StaleReviewSettings({ settings, onChange, onSave }: Props) {
	return (
		<section className="space-y-3">
			<div>
				<h2 className="text-base font-semibold text-[var(--text)]">
					Stale review
				</h2>
				<p className="text-sm text-[var(--muted)]">
					Choose when unfinished items should come back for review.
				</p>
			</div>
			<div className="space-y-3">
				{FIELDS.map(({ key, label }) => (
					<label
						key={key}
						className="flex items-center justify-between gap-4 text-sm text-[var(--text)]"
					>
						<span>{label}</span>
						<span className="flex items-center gap-2">
							<input
								type="number"
								min={1}
								value={settings[key]}
								onChange={(event) =>
									onChange({
										...settings,
										[key]: Math.max(1, Number(event.target.value)),
									})
								}
								className="w-16 rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-right text-[var(--text)]"
							/>
							<span className="text-[var(--muted)]">days</span>
						</span>
					</label>
				))}
			</div>
			{onSave && (
				<button
					type="button"
					onClick={onSave}
					className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--accent)] text-[var(--bg)] border-0 cursor-pointer"
				>
					Save settings
				</button>
			)}
		</section>
	);
}
