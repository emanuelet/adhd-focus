import { useState } from "react";
import { type DailyReviewInput, REVIEW_PROMPTS } from "~/types/review";

interface Props {
	onSubmit: (answers: DailyReviewInput) => void | Promise<void>;
	onClose: () => void;
}

export function ClockOffModal({ onSubmit, onClose }: Props) {
	const [answers, setAnswers] = useState<DailyReviewInput>({
		movedForward: "",
		tomorrowPriority: "",
		looseEnds: "",
	});
	const [saving, setSaving] = useState(false);

	const fields: Array<keyof DailyReviewInput> = [
		"movedForward",
		"tomorrowPriority",
		"looseEnds",
	];
	const complete = fields.every((field) => answers[field].trim());

	const submit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!complete) return;
		setSaving(true);
		try {
			await onSubmit(answers);
		} finally {
			setSaving(false);
		}
	};

	return (
		<>
			<button
				type="button"
				aria-label="Close clock off review"
				className="fixed inset-0 bg-black/50 z-50 border-0 cursor-default"
				onClick={onClose}
			/>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<form
					className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-5"
					onSubmit={submit}
				>
					<div>
						<h2 className="text-base font-semibold text-[var(--text)]">
							Clock Off
						</h2>
						<p className="text-sm text-[var(--muted)] mt-1">
							Close the loop before you leave.
						</p>
					</div>

					{fields.map((field, index) => (
						<label key={field} className="block space-y-2">
							<span className="text-sm font-medium text-[var(--text)]">
								{REVIEW_PROMPTS[index]}
							</span>
							<textarea
								aria-label={REVIEW_PROMPTS[index]}
								value={answers[field]}
								onChange={(event) =>
									setAnswers((current) => ({
										...current,
										[field]: event.target.value,
									}))
								}
								rows={3}
								required
								className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]"
							/>
						</label>
					))}

					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={onClose}
							className="text-sm text-[var(--muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-0"
						>
							Not now
						</button>
						<button
							type="submit"
							disabled={!complete || saving}
							className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 bg-[var(--accent)] text-[var(--bg)] disabled:opacity-40 disabled:cursor-not-allowed"
						>
							{saving ? "Saving..." : "Save review"}
						</button>
					</div>
				</form>
			</div>
		</>
	);
}
