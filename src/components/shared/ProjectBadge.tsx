import { resolveColor } from "~/lib/todoist-colors";

interface Props {
	name: string;
	color: string;
}

export function ProjectBadge({ name, color }: Props) {
	const hex = resolveColor(color);
	return (
		<span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
			<span
				className="inline-block w-2 h-2 rounded-full shrink-0"
				style={{ backgroundColor: hex }}
			/>
			{name}
		</span>
	);
}
