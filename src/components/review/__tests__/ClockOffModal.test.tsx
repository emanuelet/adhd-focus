// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { REVIEW_PROMPTS } from "~/types/review";
import { ClockOffModal } from "../ClockOffModal";

describe("ClockOffModal", () => {
	it("asks the three exact review questions", () => {
		render(<ClockOffModal onSubmit={vi.fn()} onClose={vi.fn()} />);

		for (const prompt of REVIEW_PROMPTS) {
			expect(screen.getByText(prompt)).toBeDefined();
			expect(screen.getByLabelText(prompt)).toBeDefined();
		}
	});

	it("submits all three answers", () => {
		const onSubmit = vi.fn();
		render(<ClockOffModal onSubmit={onSubmit} onClose={vi.fn()} />);

		for (const prompt of REVIEW_PROMPTS) {
			fireEvent.change(screen.getByLabelText(prompt), {
				target: { value: prompt },
			});
		}
		fireEvent.click(screen.getByRole("button", { name: "Save review" }));

		expect(onSubmit).toHaveBeenCalledWith({
			movedForward: REVIEW_PROMPTS[0],
			tomorrowPriority: REVIEW_PROMPTS[1],
			looseEnds: REVIEW_PROMPTS[2],
		});
	});
});
