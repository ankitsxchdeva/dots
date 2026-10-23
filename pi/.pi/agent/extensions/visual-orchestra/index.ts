/**
 * visual-orchestra — a live, zero-token board of task subagents.
 *
 * Observes tool_execution_start/update/end events for the task tool and
 * renders a node graph: the main session as a hub (with its model), one node
 * per subagent, spokes between them. Every running node states its assignment
 * (task:) and its live activity (now:). Layout adapts to the terminal: radial
 * constellation for up to 4 agents on wide terminals, horizontal fan beyond
 * that, vertical fan on narrow terminals. Nodes fill the available width and
 * slack vertical space spreads the branches. Pure event observation: no model
 * calls, nothing added to context. The /orchestra command itself never enters
 * the transcript.
 *
 * Open with /orchestra or ctrl+alt+o, mid-turn or idle. Esc closes.
 *
 * Watched tool name defaults to "task"; override with PI_ORCHESTRA_TOOL.
 *
 * Live activity (the subagent's current tool call) requires a task tool that
 * streams onUpdate partials with details:
 *   { agent, activity, turns, tokens, model }
 * Without streaming partials the graph still shows start/end state and
 * elapsed time, so it degrades gracefully against an unpatched task tool.
 *
 * Aesthetic follows ~/Documents/design/DESIGN.md: hairline box drawing on the
 * flat background, a dimming ladder instead of extra colors, one accent
 * reserved for the running state, status glyphs as data, lowercase terse
 * copy. The running glyph pulses at 1 Hz: the single flourish.
 */

import type { ExtensionAPI, ExtensionContext, Theme } from "@earendil-works/pi-coding-agent";
import { matchesKey, truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { scrollWindow } from "./windowing.ts";

/** Tool whose executions appear on the board. */
const TOOL_NAME = process.env.PI_ORCHESTRA_TOOL || "task";

type AgentState = "running" | "done" | "failed";

interface AgentRow {
	id: string;
	agent: string;
	task: string;
	state: AgentState;
	startedAt: number;
	endedAt?: number;
	activity?: string;
	turns?: number;
	tokens?: number;
	model?: string;
}

/** Session-scoped board state. Events keep flowing while the view is closed. */
const rows: AgentRow[] = [];

/** Selection cursor: id of the selected row. Falls back to the newest row. */
let selectedId: string | null = null;

function selectedIndex(): number {
	const i = rows.findIndex((r) => r.id === selectedId);
	return i === -1 ? Math.max(0, rows.length - 1) : i;
}

function selectIndex(i: number): void {
	selectedId = rows[i]?.id ?? null;
}

/** Set while the view is open; event handlers poke it to re-render. */
let refreshView: (() => void) | undefined;

/** Main session model id, shown in the hub. From ctx.model / model_select. */
let mainModel: string | undefined;

/** Model ids are identifiers; strip anything outside the safe charset
 *  (k3 sometimes leaks literal "[0m" garbage into string params). */
function modelIdOf(m: unknown): string | undefined {
	const s = String(m ?? "").replace(/[^\w./:-]/g, "");
	return s || undefined;
}

function taskPreview(prompt: unknown): string {
	// Strip control chars (incl. real ESC bytes) so a hostile or glitchy
	// prompt can never break canvas styling; collapse whitespace after.
	return String(prompt ?? "")
		.replace(/[\u0000-\u001f\u007f]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 200);
}

function formatTokens(count: number): string {
	if (count < 1000) return String(count);
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	return `${(count / 1000000).toFixed(1)}M`;
}

function formatElapsed(startedAt: number, endedAt?: number): string {
	const ms = (endedAt ?? Date.now()) - startedAt;
	const s = Math.max(0, Math.round(ms / 1000));
	if (s < 60) return `${s}s`;
	const m = Math.floor(s / 60);
	if (m < 60) return `${m}m`;
	return `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}m`;
}

function statLine(row: AgentRow): string {
	const parts = [formatElapsed(row.startedAt, row.endedAt)];
	if (row.turns) parts.push(`${row.turns}t`);
	if (row.tokens) parts.push(formatTokens(row.tokens));
	if (row.model) parts.push(row.model);
	return parts.join(" · ");
}

/** Sanitize streamed activity text the same way as prompts. */
function cleanActivity(activity: unknown): string {
	return String(activity ?? "")
		.replace(/[\u0000-\u001f\u007f]/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function totals(): { agents: number; turns: number; tokens: number } {
	let turns = 0;
	let tokens = 0;
	for (const r of rows) {
		turns += r.turns ?? 0;
		tokens += r.tokens ?? 0;
	}
	return { agents: rows.length, turns, tokens };
}

/** Width-aware clip (CJK/emoji safe). truncateToWidth appends the ellipsis
 *  itself when it truncates — pass ours through rather than adding a second. */
function clip(text: string, max: number): string {
	if (max <= 1) return "";
	return visibleWidth(text) > max ? truncateToWidth(text, max, "…") : text;
}

/** Greedy word wrap to at most maxLines, width-aware; leftover text ellipsizes
 *  the last line. Always returns at least one line so height math stays stable. */
function wrapText(s: string, width: number, maxLines: number): string[] {
	maxLines = Math.max(1, maxLines);
	const out: string[] = [];
	let cur = "";
	if (width > 1) {
		for (const word of s.split(" ").filter(Boolean)) {
			const next = cur ? `${cur} ${word}` : word;
			if (visibleWidth(next) <= width) {
				cur = next;
			} else {
				if (cur) out.push(cur);
				// A word longer than the line stands alone, clipped.
				cur = visibleWidth(word) > width ? clip(word, width) : word;
			}
		}
		if (cur) out.push(cur);
	}
	if (out.length === 0) out.push(clip(s, Math.max(1, width)));
	if (out.length > maxLines) {
		const rest = out.slice(maxLines - 1).join(" ");
		out.length = maxLines;
		out[maxLines - 1] = clip(rest, width);
	}
	return out;
}

// ---------------------------------------------------------------------------
// Cell canvas: draw boxes/spokes/text at (x, y), emit styled lines per row.
// Wide chars occupy two cells (the second is a zero-width filler) so layout
// never breaks on CJK or emoji content.

type StyleName = "accent" | "success" | "error" | "text" | "textBold" | "muted" | "dim" | "borderMuted";

interface Cell {
	ch: string;
	style: StyleName;
}

class Canvas {
	readonly w: number;
	readonly h: number;
	private cells: Cell[][];

	constructor(w: number, h: number) {
		this.w = Math.max(1, w);
		this.h = Math.max(1, h);
		this.cells = Array.from({ length: this.h }, () =>
			Array.from({ length: this.w }, () => ({ ch: " ", style: "text" as StyleName })),
		);
	}

	set(x: number, y: number, ch: string, style: StyleName): void {
		if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
		this.cells[y][x] = { ch, style };
	}

	text(x: number, y: number, s: string, style: StyleName): void {
		// Cells are style-flat: strip SGR sequences (truncateToWidth emits them
		// around its ellipsis) or the ESC bytes would render as literal text.
		s = s.replace(/\u001b\[[0-9;]*m/g, "");
		let col = x;
		for (const ch of s) {
			const cw = visibleWidth(ch);
			if (cw === 0) continue; // combining mark: skip rather than misalign
			if (cw >= 2) {
				this.set(col, y, ch, style);
				this.set(col + 1, y, "", style);
				col += 2;
			} else {
				this.set(col, y, ch, style);
				col += 1;
			}
			if (col >= this.w) return;
		}
	}

	hline(x0: number, x1: number, y: number, style: StyleName): void {
		for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, "─", style);
	}

	vline(y0: number, y1: number, x: number, style: StyleName): void {
		for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, "│", style);
	}

	box(x: number, y: number, w: number, h: number, style: StyleName): void {
		if (w < 2 || h < 2) return;
		this.hline(x + 1, x + w - 2, y, style);
		this.hline(x + 1, x + w - 2, y + h - 1, style);
		this.vline(y + 1, y + h - 2, x, style);
		this.vline(y + 1, y + h - 2, x + w - 1, style);
		this.set(x, y, "┌", style);
		this.set(x + w - 1, y, "┐", style);
		this.set(x, y + h - 1, "└", style);
		this.set(x + w - 1, y + h - 1, "┘", style);
	}

	emit(theme: Theme): string[] {
		const out: string[] = [];
		for (const row of this.cells) {
			let line = "";
			let run = "";
			let runStyle: StyleName = row[0].style;
			const flush = () => {
				if (!run) return;
				line += runStyle === "textBold" ? theme.fg("text", theme.bold(run)) : theme.fg(runStyle, run);
				run = "";
			};
			for (const cell of row) {
				if (cell.style !== runStyle) {
					flush();
					runStyle = cell.style;
				}
				run += cell.ch;
			}
			flush();
			out.push(line);
		}
		return out;
	}
}

// ---------------------------------------------------------------------------
// Graph drawing

const NH_FIN = 4; // finished node height (radial layout): task + stats
const NH_RUN = 5; // running node height: task + now + stats
const SPOKE_H = 6;
const SPOKE_V = 2;
const MIN_NODE_W = 26;

/** Hub geometry, recomputed each render by measureHub(): the model line makes
 *  both dimensions content-dependent. Layouts read these render-scoped values. */
let HW = 20;
let HH = 5;

function stateGlyph(row: AgentRow, pulse: boolean): { ch: string; style: StyleName } {
	if (row.state === "running") return { ch: pulse ? "○" : "●", style: "accent" };
	if (row.state === "done") return { ch: "✓", style: "success" };
	return { ch: "✗", style: "error" };
}

const LABEL_W = 6; // "task: " / "now:  " prefix width inside nodes

/** Task lines inside a node: one, or two when the selected row expands. The
 *  width must match the draw call exactly — row heights derive from this. */
function taskLines(row: AgentRow, nodeW: number, selected: boolean, expand: boolean): string[] {
	return wrapText(row.task, nodeW - 4 - LABEL_W, selected && expand ? 2 : 1);
}

/** Box height for drawAgentNode. Finished nodes are task + stats; running adds
 *  the now line and, when selected and expanded, a second task line. */
function nodeHeight(row: AgentRow, nodeW: number, selected: boolean, expand: boolean): number {
	if (row.state !== "running") return NH_FIN;
	return NH_RUN + taskLines(row, nodeW, selected, expand).length - 1;
}

/** Compact finished row height: one line, plus up to two wrapped task lines
 *  when selected. w is the row width passed to drawCompactRow. */
function compactHeight(row: AgentRow, w: number, selected: boolean): number {
	return selected ? 1 + wrapText(row.task, w - 2, 2).length : 1;
}

/** Row height in the scrollable layouts. Must stay in sync with drawAgentNode
 *  / drawCompactRow, which it shares taskLines / wrapText calls with. */
function rowHeight(row: AgentRow, w: number, selected: boolean): number {
	return row.state === "running" ? nodeHeight(row, w, selected, true) : compactHeight(row, w, selected);
}

/** Box-drawing junction for the given open sides. */
function tee(up: boolean, right: boolean, down: boolean, left: boolean): string {
	if (up && right && down && left) return "┼";
	if (up && down && left) return "┤";
	if (up && right && down) return "├";
	if (up && left) return "┘";
	if (up && right) return "└";
	if (down && left) return "┐";
	if (down && right) return "┌";
	if (up && down) return "│";
	return "─";
}

function edgeStyle(row: AgentRow): StyleName {
	return row.state === "running" ? "accent" : "borderMuted";
}

/** Node: title embedded in the top border, then the assignment (task:), the
 *  live activity for running agents (now:), and a stats line. The selected
 *  expanded node wraps the task onto a second line. */
function drawAgentNode(
	c: Canvas,
	row: AgentRow,
	x: number,
	y: number,
	w: number,
	pulse: boolean,
	selected: boolean,
	expand: boolean,
): void {
	const h = nodeHeight(row, w, selected, expand);
	const border: StyleName = selected ? "text" : edgeStyle(row);
	c.box(x, y, w, h, border);
	const glyph = stateGlyph(row, pulse);
	const nameStyle: StyleName = selected ? "textBold" : row.state === "running" ? "text" : "muted";
	const name = clip(row.agent, w - 11);
	// top border: ┌─ ● name ──────┐
	c.set(x + 1, y, "─", border);
	c.text(x + 2, y, ` ${glyph.ch} `, glyph.style);
	c.text(x + 5, y, `${name} `, nameStyle);
	const cw = w - 4 - LABEL_W;
	let line = y + 1;
	const lines = taskLines(row, w, selected, expand);
	c.text(x + 2, line, "task: ", "muted");
	c.text(x + 2 + LABEL_W, line, lines[0], "dim");
	for (const extra of lines.slice(1)) c.text(x + 2 + LABEL_W, ++line, extra, "dim");
	line++;
	if (row.state === "running") {
		c.text(x + 2, line, "now:  ", "muted");
		c.text(x + 2 + LABEL_W, line, clip(row.activity || "starting", cw), "dim");
		line++;
	}
	c.text(x + 2, line, clip(statLine(row), w - 4), "muted");
}

/** Finished agent as a one-line row: glyph, name, task preview, right-aligned
 *  stats. Selected adds a full task line below. */
function drawCompactRow(c: Canvas, row: AgentRow, x: number, y: number, w: number, selected: boolean): void {
	const glyph = stateGlyph(row, false);
	const stats = clip(statLine(row), Math.floor(w / 2));
	const statsW = visibleWidth(stats);
	c.text(x + w - statsW, y, stats, "muted");
	c.text(x, y, glyph.ch, glyph.style);
	const name = clip(row.agent, Math.max(1, Math.min(24, w - statsW - 6)));
	c.text(x + 2, y, name, selected ? "textBold" : "muted");
	if (selected) {
		wrapText(row.task, w - 2, 2).forEach((l, i) => c.text(x + 2, y + 1 + i, l, "dim"));
	} else {
		const taskX = x + 2 + visibleWidth(name) + 2;
		const taskW = x + w - statsW - 2 - taskX;
		if (taskW > 4) c.text(taskX, y, clip(row.task, taskW), "dim");
	}
}

/** Hub content: name, the main session's model when known, agent count,
 *  aggregate turns/tokens. */
function hubLines(): Array<[string, StyleName]> {
	const t = totals();
	const stats = t.tokens > 0 ? `${t.turns} turns · ${formatTokens(t.tokens)}` : `${t.turns} turns`;
	const lines: Array<[string, StyleName]> = [["main", "textBold"]];
	if (mainModel) lines.push([mainModel, "muted"]);
	lines.push([`${t.agents} agents`, "muted"], [stats, "dim"]);
	return lines;
}

/** Size the hub to its content; called once per render before layout. */
function measureHub(): void {
	const lines = hubLines();
	HW = Math.min(34, Math.max(20, Math.max(...lines.map(([s]) => visibleWidth(s))) + 4));
	HH = lines.length + 2;
}

function drawHub(c: Canvas, x: number, y: number): void {
	c.box(x, y, HW, HH, "text");
	hubLines().forEach(([s, style], i) => {
		const line = clip(s, HW - 2);
		c.text(x + Math.max(1, Math.floor((HW - visibleWidth(line)) / 2)), y + 1 + i, line, style);
	});
}

/** Radial: hub center, nodes on cross spokes. Caller guarantees n <= 4 and fit.
 *  No scrolling here: selection only brightens the node (expansion would break
 *  the slots). Node widths fill the horizontal space instead of capping out. */
function layoutRadial(c: Canvas, agents: AgentRow[], pulse: boolean, sel: number): void {
	const cx = Math.floor(c.w / 2);
	const cy = Math.floor(c.h / 2);
	const NW = Math.max(MIN_NODE_W, Math.floor((c.w - HW - 2 * SPOKE_H - 4) / 2));
	const hx0 = cx - Math.floor(HW / 2);
	const hy0 = cy - Math.floor(HH / 2);
	const pick = [[1], [0, 1], [0, 1, 3], [0, 1, 2, 3]][agents.length - 1];

	drawHub(c, hx0, hy0);
	agents.forEach((row, i) => {
		const side = pick[i];
		const h = nodeHeight(row, NW, i === sel, false);
		let nx: number, ny: number;
		if (side === 0) [nx, ny] = [hx0 - SPOKE_H - NW, cy - Math.floor(h / 2)];
		else if (side === 1) [nx, ny] = [hx0 + HW + SPOKE_H, cy - Math.floor(h / 2)];
		else if (side === 2) [nx, ny] = [cx - Math.floor(NW / 2), hy0 - SPOKE_V - h];
		else [nx, ny] = [cx - Math.floor(NW / 2), hy0 + HH + SPOKE_V];
		drawAgentNode(c, row, nx, ny, NW, pulse, i === sel, false);
		if (i === sel) c.text(nx - 2, ny, ">", "text");
		const es = edgeStyle(row);
		if (side === 1) {
			// right: straight horizontal at cy
			c.set(hx0 + HW - 1, cy, "├", es);
			c.hline(hx0 + HW, nx - 1, cy, es);
			c.set(nx, cy, "┤", es);
		} else if (side === 0) {
			// left
			c.set(hx0, cy, "┤", es);
			c.hline(nx + NW, hx0 - 1, cy, es);
			c.set(nx + NW - 1, cy, "├", es);
		} else if (side === 2) {
			// top: straight vertical at cx
			c.set(cx, hy0, "┴", es);
			c.vline(ny + h, hy0 - 1, cx, es);
			c.set(cx, ny + h - 1, "┬", es);
		} else {
			// bottom
			c.set(cx, hy0 + HH - 1, "┬", es);
			c.vline(hy0 + HH, ny - 1, cx, es);
			c.set(cx, ny, "┴", es);
		}
	});
}

/** Fan: hub left, vertical spine, one branch per agent. For wide terminals.
 *  Slack vertical space spreads the branches (capped) so the board fills the
 *  screen. Overflow: shows a scroll window around the selected row instead of
 *  silently dropping old agents; ↑/↓ indicators mark hidden ends. */
function layoutFan(c: Canvas, agents: AgentRow[], pulse: boolean, sel: number): void {
	const hx0 = 2;
	const sx = hx0 + HW + 3;
	const nx0 = sx + 4;
	const NW = Math.max(MIN_NODE_W, c.w - nx0 - 2);
	const GAP = 1;
	const heights = agents.map((r, i) => rowHeight(r, r.state === "running" ? NW : NW - 3, i === sel));
	const total = heights.reduce((a, b) => a + b, 0) + GAP * (agents.length - 1);
	const fits = total <= c.h - 2;
	const gap = fits && agents.length > 1 ? GAP + Math.min(3, Math.floor((c.h - 2 - total) / (agents.length - 1))) : GAP;
	// Overflow: row 0 stays free for the ↑ indicator, the last for hints.
	const [s, e] = fits ? [0, agents.length] : scrollWindow(heights, GAP, Math.max(1, c.h - 3), sel);
	const shownH = heights.slice(s, e);
	const stackH = shownH.reduce((a, b) => a + b, 0) + gap * (shownH.length - 1);
	const y0 = fits ? Math.max(1, Math.floor((c.h - stackH) / 2)) : 1;
	const hy0 = Math.min(Math.max(1, Math.floor(c.h / 2) - Math.floor(HH / 2)), c.h - HH - 1);
	const hubMid = hy0 + Math.floor(HH / 2);

	drawHub(c, hx0, hy0);

	const centers: number[] = [];
	let y = y0;
	agents.slice(s, e).forEach((row, i) => {
		const h = shownH[i];
		const nodeCy = y + Math.floor((h - 1) / 2);
		centers.push(nodeCy);
		const selected = s + i === sel;
		if (row.state === "running") {
			drawAgentNode(c, row, nx0, y, NW, pulse, selected, true);
		} else {
			drawCompactRow(c, row, nx0 + 2, y, NW - 3, selected);
		}
		const es = edgeStyle(row);
		c.hline(sx + 1, row.state === "running" ? nx0 - 1 : nx0, nodeCy, es);
		if (row.state === "running") c.set(nx0, nodeCy, "┤", es);
		if (selected) c.set(sx + 1, nodeCy, ">", "text");
		y += h + gap;
	});

	// Spine spans the visible branches and reaches hubMid, so the hub
	// connector always lands even when the window is scrolled past it.
	const firstCy = centers[0];
	const lastCy = centers[centers.length - 1];
	const spineTop = Math.min(firstCy, hubMid);
	const spineBot = Math.max(lastCy, hubMid);
	c.vline(spineTop, spineBot, sx, "borderMuted");
	for (const cy of centers) c.set(sx, cy, tee(cy > spineTop, true, cy < spineBot, cy === hubMid), "borderMuted");

	// hub -> spine
	c.set(hx0 + HW - 1, hubMid, "├", "borderMuted");
	c.hline(hx0 + HW, sx - 1, hubMid, "borderMuted");
	c.set(sx, hubMid, tee(hubMid > spineTop, centers.includes(hubMid), hubMid < spineBot, true), "borderMuted");

	if (s > 0) {
		const up = `↑ ${s} older`;
		c.text(c.w - up.length - 1, 0, up, "dim");
	}
	if (e < agents.length) c.text(2, c.h - 1, `↓ ${agents.length - e} newer`, "dim");
}

/** Vertical fan: hub top-left, spine below it, full-width nodes. Narrow terminals.
 *  Same scroll-window overflow as the wide fan. */
function layoutVertical(c: Canvas, agents: AgentRow[], pulse: boolean, sel: number): void {
	const hx0 = 1;
	const hy0 = 0;
	const sx = hx0 + 3;
	const nx0 = sx + 3;
	const NW = Math.max(12, c.w - nx0 - 1);
	const GAP = 1;
	const top = hy0 + HH + 1;
	const heights = agents.map((r, i) => rowHeight(r, r.state === "running" ? NW : NW - 3, i === sel));
	const total = heights.reduce((a, b) => a + b, 0) + GAP * (agents.length - 1);
	const avail = Math.max(1, c.h - top - 1);
	const fits = total <= avail;
	const gap = fits && agents.length > 1 ? GAP + Math.min(3, Math.floor((avail - total) / (agents.length - 1))) : GAP;
	const [s, e] = fits ? [0, agents.length] : scrollWindow(heights, GAP, avail, sel);
	const shownH = heights.slice(s, e);

	drawHub(c, hx0, hy0);

	const centers: number[] = [];
	let y = top;
	agents.slice(s, e).forEach((row, i) => {
		const h = shownH[i];
		const nodeCy = y + Math.floor((h - 1) / 2);
		centers.push(nodeCy);
		const selected = s + i === sel;
		if (row.state === "running") {
			drawAgentNode(c, row, nx0, y, NW, pulse, selected, true);
		} else {
			drawCompactRow(c, row, nx0 + 2, y, NW - 3, selected);
		}
		const es = edgeStyle(row);
		c.hline(sx + 1, row.state === "running" ? nx0 - 1 : nx0, nodeCy, es);
		if (row.state === "running") c.set(nx0, nodeCy, "┤", es);
		if (selected) c.set(sx + 1, nodeCy, ">", "text");
		y += h + gap;
	});

	// Spine hangs from the hub; hidden-above rows read as continuation of it.
	const lastCy = centers[centers.length - 1];
	c.set(sx, hy0 + HH - 1, "┬", "borderMuted");
	c.vline(hy0 + HH, lastCy, sx, "borderMuted");
	for (const cy of centers) c.set(sx, cy, cy === lastCy ? "└" : "├", "borderMuted");

	if (s > 0) {
		const up = `↑ ${s} older`;
		c.text(c.w - up.length - 1, 0, up, "dim");
	}
	if (e < agents.length) c.text(1, c.h - 1, `↓ ${agents.length - e} newer`, "dim");
}

class OrchestraView {
	private tui: { requestRender(): void };
	private theme: Theme;
	private done: () => void;
	private interval: ReturnType<typeof setInterval>;
	private pulse = false;

	constructor(tui: { requestRender(): void }, theme: Theme, done: () => void) {
		this.tui = tui;
		this.theme = theme;
		this.done = done;
		// 1 Hz tick drives the elapsed column and the running-glyph pulse.
		this.interval = setInterval(() => {
			this.pulse = !this.pulse;
			this.tui.requestRender();
		}, 1000);
	}

	dispose(): void {
		clearInterval(this.interval);
		if (refreshView) refreshView = undefined;
	}

	invalidate(): void {
		// Stateless: every render rebuilds the canvas from current state.
	}

	handleInput(data: string): void {
		// ctrl+c closes too: never trap the user's abort key behind the view.
		if (matchesKey(data, "escape") || matchesKey(data, "ctrl+c") || data === "q") {
			this.done();
			return;
		}
		if (rows.length === 0) return;
		if (matchesKey(data, "up") || data === "k") {
			selectIndex(Math.max(0, selectedIndex() - 1));
			this.tui.requestRender();
		} else if (matchesKey(data, "down") || data === "j") {
			selectIndex(Math.min(rows.length - 1, selectedIndex() + 1));
			this.tui.requestRender();
		}
	}

	render(width: number): string[] {
		const height = process.stdout.rows ?? 24;
		measureHub();
		const c = new Canvas(width, height);
		if (rows.length === 0) {
			const hx0 = Math.max(0, Math.floor((width - HW) / 2));
			const hy0 = Math.max(0, Math.floor((height - HH) / 2) - 1);
			drawHub(c, hx0, hy0);
			const msg = "no agents yet. task subagents appear here as they run.";
			c.text(Math.max(0, Math.floor((width - visibleWidth(msg)) / 2)), hy0 + HH + 1, msg, "muted");
		} else {
			const sel = selectedIndex();
			const radialFits =
				rows.length <= 4 &&
				width >= 2 * MIN_NODE_W + HW + 2 * SPOKE_H + 4 &&
				height >= HH + 2 * SPOKE_V + 2 * NH_RUN + 3;
			if (radialFits) layoutRadial(c, [...rows], this.pulse, sel);
			else if (width >= 60 && height >= 8) layoutFan(c, [...rows], this.pulse, sel);
			else if (height >= 12) layoutVertical(c, [...rows], this.pulse, sel);
			// Below both floors the canvas stays blank but for the hint.
		}
		const hint = rows.length === 0 ? "esc closes" : "↑/↓ navigate · esc closes";
		c.text(width - hint.length - 1, height - 1, hint, "dim");
		return c.emit(this.theme);
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		rows.length = 0;
		selectedId = null;
		mainModel = modelIdOf(ctx?.model?.id);
	});

	pi.on("model_select", (event) => {
		mainModel = modelIdOf(event.model?.id);
		refreshView?.();
	});

	pi.on("tool_execution_start", (event, ctx) => {
		if (event.toolName !== TOOL_NAME) return;
		mainModel = modelIdOf(ctx?.model?.id) ?? mainModel;
		// Follow the newest agent only when the cursor is already at the tail;
		// never yank the view away from someone inspecting an older row.
		const atTail = selectedIndex() === rows.length - 1;
		rows.push({
			id: event.toolCallId,
			agent: String(event.args?.agent ?? "task"),
			task: taskPreview(event.args?.prompt),
			state: "running",
			startedAt: Date.now(),
		});
		if (atTail) selectedId = event.toolCallId;
		refreshView?.();
	});

	pi.on("tool_execution_update", (event) => {
		if (event.toolName !== TOOL_NAME) return;
		const row = rows.find((r) => r.id === event.toolCallId);
		if (!row) return;
		const details = event.partialResult?.details as
			| { agent?: string; activity?: string; turns?: number; tokens?: number; model?: string }
			| undefined;
		if (!details) return;
		if (details.agent) row.agent = String(details.agent);
		if (details.activity) row.activity = cleanActivity(details.activity);
		if (typeof details.turns === "number") row.turns = details.turns;
		if (typeof details.tokens === "number") row.tokens = details.tokens;
		if (details.model) row.model = String(details.model).replace(/[^\w./:-]/g, "");
		refreshView?.();
	});

	pi.on("tool_execution_end", (event) => {
		if (event.toolName !== TOOL_NAME) return;
		const row = rows.find((r) => r.id === event.toolCallId);
		if (!row) return;
		row.state = event.isError ? "failed" : "done";
		row.endedAt = Date.now();
		row.activity = undefined;
		const details = event.result?.details as { turns?: number; tokens?: number; model?: string } | undefined;
		if (typeof details?.turns === "number") row.turns = details.turns;
		if (typeof details?.tokens === "number") row.tokens = details.tokens;
		if (details?.model) row.model = String(details.model).replace(/[^\w./:-]/g, "");
		refreshView?.();
	});

	const openView = async (ctx: ExtensionContext) => {
		if (ctx.mode !== "tui") {
			ctx.ui.notify("orchestra view needs interactive mode", "error");
			return;
		}
		mainModel = modelIdOf(ctx.model?.id) ?? mainModel;
		if (refreshView) return; // already open
		await ctx.ui.custom(
			(tui, theme, _keybindings, done) => {
				const view = new OrchestraView(tui, theme, () => {
					refreshView = undefined;
					done(undefined);
				});
				refreshView = () => tui.requestRender();
				return view;
			},
			{
				overlay: true,
				overlayOptions: { width: "100%", maxHeight: "100%", anchor: "top-left", margin: 0 },
			},
		);
	};

	pi.registerCommand("orchestra", {
		description: "Open the live subagent graph. Esc closes.",
		handler: async (_args, ctx) => openView(ctx),
	});

	pi.registerShortcut("ctrl+alt+o", {
		description: "Open the orchestra subagent graph",
		handler: async (ctx) => openView(ctx),
	});
}
