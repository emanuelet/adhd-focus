import { useState } from "react";
import type { SprintLength } from "~/types/todoist";

const OPTIONS: { length: SprintLength; label: string }[] = [
	{ length: 25, label: "25 min" },
	{ length: 52, label: "52 min" },
	{ length: 90, label: "90 min" },
	{ length: 120, label: "2 hr" },
];

interface Props {
	onSelect: (length: SprintLength) => void;
	onClose: () => void;
}

export function SprintPicker({ onSelect, onClose }: Props) {
	const [selected, setSelected] = useState<SprintLength>(52);

	return (
		<>
			<div
				className="fixed inset-0 bg-black/50 z-50"
				onClick={onClose}
				role="presentation"
			/>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
				<div
					className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
					onClick={(e) => e.stopPropagation()}
				>
					<h2 className="text-base font-semibold text-[var(--text)] mb-1">
						Sprint duration
					</h2>
					<p className="text-sm text-[var(--muted)] mb-4">
						How long will you focus?
					</p>

					<div className="grid grid-cols-2 gap-3 mb-6">
						{OPTIONS.map((opt) => (
							<button
								key={opt.length}
								type="button"
								onClick={() => setSelected(opt.length)}
								className={`px-4 py-3 rounded-xl text-sm font-medium cursor-pointer border transition-all ${
									selected === opt.length
										? "border-[var(--accent)] bg-[var(--accent-dim)] text-[var(--accent)]"
										: "border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:border-[var(--border-alt)]"
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>

					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={onClose}
							className="text-sm text-[var(--muted)] hover:text-[var(--text)] cursor-pointer bg-transparent border-0"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={() => onSelect(selected)}
							className="px-5 py-2 rounded-lg text-sm font-medium cursor-pointer border-0 bg-[var(--accent)] text-[var(--bg)] hover:brightness-110"
						>
							Focus →
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
