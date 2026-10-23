/**
 * Pure scroll-window math for the board's overflow mode.
 *
 * Given per-item row heights, the gap between items, a row budget, and the
 * selected index, pick which items to show. The selected item is always
 * visible; free space fills downward first, then upward, alternating, so the
 * cursor stays roughly centered with lookahead below. Deterministic and
 * stateless: the same inputs always produce the same window, so renders
 * never drift between 1 Hz ticks.
 *
 * Returns [start, end), end exclusive. An item taller than the budget is
 * shown alone; the canvas clips what doesn't fit.
 */
export function scrollWindow(heights: number[], gap: number, budget: number, selected: number): [number, number] {
	const n = heights.length;
	if (n === 0) return [0, 0];
	const sel = Math.max(0, Math.min(selected, n - 1));
	let start = sel;
	let end = sel + 1;
	let used = heights[sel];
	for (;;) {
		let grew = false;
		if (end < n && used + gap + heights[end] <= budget) {
			used += gap + heights[end];
			end++;
			grew = true;
		}
		if (start > 0 && used + gap + heights[start - 1] <= budget) {
			used += gap + heights[start - 1];
			start--;
			grew = true;
		}
		if (!grew) break;
	}
	return [start, end];
}
