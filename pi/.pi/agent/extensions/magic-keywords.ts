/**
 * magic-keywords — port of omp's prompt controls (docs/magic-keywords.md).
 * Three standalone lowercase words opt a turn into specialized behavior:
 *
 *   ultrathink  — bump thinking level to xhigh for deep reasoning
 *   orchestrate — run substantial work through parallel `task` subagents
 *   workflowz   — deterministic multi-subagent fan-out with adversarial verify
 *
 * Keywords trigger only as standalone prose — never inside code spans, fenced
 * blocks, or HTML/XML comments and tags, and never as file extensions
 * (`orchestrate.ts`), symbol refs (`foo::orchestrate`), call syntax
 * (`orchestrate()`) or hyphenated compounds (`my-orchestrate`). Matched
 * occurrences are stripped from the prompt before it reaches the model
 * (deliberate deviation: upstream keeps the visible word).
 *
 * Source: ~/src/oh-my-pi/packages/coding-agent/src/
 *   modes/{magic-keyword-boundary,markdown-prose}.ts (matcher, ported) and
 *   prompts/system/{ultrathink,orchestrate,workflow}-notice.md (adapted:
 *   mustache conditionals resolved, fork-only tools removed).
 *   Re-ported from upstream HEAD 7523a2d7 (2026-09-01). Re-check with omp-sync.sh.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const ULTRATHINK_NOTICE = `Multi-step reasoning: think carefully through the problem before responding.`;

const ORCHESTRATE_NOTICE = `Orchestration request. Execute as orchestrator under this contract; it overrides tendencies to yield early, narrate, or do the work yourself.

<role>
Decompose, dispatch, verify, iterate. Substantial or parallelizable work: \`task\` subagents. Trivial self-contained edits: make inline when dispatch overhead exceeds edit cost.
</role>

<rules>
1. NEVER yield before closure. Phase completion is not a yield point: launch the next phase in the same turn. Stop only when every requested item is verifiably done or genuinely blocked.
2. Before dispatch, enumerate the full surface. Expand referenced audits, plans, checklists, and file lists into a flat work list. "Most"/"important" items is failure. Re-read source documents; never work from memory.
3. Parallelize maximally; never launch a one-off task. Disjoint-scope edits MUST be parallel task calls in one message. Divisible work: split and dispatch together, never serially. Before exactly one subagent: find parallel work and dispatch it, or make the small change inline. Serialize only when a produced contract — types, schema, shared module — is consumed next; state the dependency.
4. Every task self-contained; subagents share no context. Specify ≤3–5 explicit target paths (no globs), change APIs/patterns, edge cases, observable acceptance criteria.
5. Verify each phase before the next: type checks, tests, builds as the repo provides. Breakage: dispatch fix-up subagents, then re-verify. Never declare a red tree done.
6. Commit only if requested.
7. Incomplete/wrong subagent work: spawn a corrective subagent specifying the gap; never silently fix it inline.
8. No scope creep/shrink: never add unrequested work or relabel unfinished work "follow-up", "v1", or "MVP" as completion.
9. Subagents never verify, lint, or format. Every task MUST say to skip gates/formatters; edit only. Orchestrator verifies once across the union of changed files at phase end.
10. Right-size offload: task only for substantial or parallelizable chunks. Trivial mechanical edits make inline.
</rules>

<workflow>
1. Ingest: read every referenced doc and current branch state; run git status.
2. Plan: materialize the full work surface in ordered phases; list each phase's parallel units.
3. Dispatch: launch all parallel task subagents in one message; collect every result before advancing.
4. Verify: run gates; on failure dispatch fix-ups and re-verify. Never advance on red.
5. Advance: immediately start the next phase. No inter-phase summary.
6. Final verification: rerun full gates; confirm every work item closed; yield terse status, not recap.
</workflow>

<anti-patterns>
- Doing substantial/parallelizable work yourself rather than fanning out.
- task scaffolding for one trivial edit (for example, one redundant config line): edit inline.
- Yielding after phase 1 with "ready to continue?".
- Serial subagent dispatch when five can run in parallel.
- Skipping between-phase verification because the change "looked safe".
- Closing phases from subagent reports without gate verification.
- Chat progress summaries instead of advancing.
</anti-patterns>`;

const WORKFLOWZ_NOTICE = `Deterministic multi-subagent workflow request. Fan out with the \`task\` tool when it improves thoroughness: parallel decomposition/coverage, independent or adversarial pre-commit checks, or work beyond one context (audits, migrations, broad sweeps). Overrides doing work inline when fan-out is more thorough.

- Explore inline FIRST — list files, scope the diff, find call sites — to discover the work-list; know its shape before fan-out, not at task start.
- Decompose into independent, self-contained task assignments; run all independent tasks in parallel in one message.
- Verify adversarially: spawn independent skeptic subagents prompted to REFUTE each key finding (default refuted when unsure); retain only survivors. Prefer perspective-diverse verifiers — correctness, security, performance, does-it-reproduce — over N identical refuters.
- For judgment calls, use a judge panel: N angle-diverse attempts, then parallel judges scoring and a synthesis pass.
- Loop until dry on unknown-size discovery: keep spawning finder rounds until K consecutive rounds yield nothing new; dedup each round against a SEEN set of all prior findings — not only confirmed ones — or the loop never converges.
- Sweep multi-modal where applicable: run mutually blind finders in parallel, split by container/content/entity/time.
- Close with a completeness critic pass: one agent asks "what's missing — modality not run, claim unverified, file unread?"; its answer drives the next round.
- No silent caps: any bounded coverage (top-N, sampling, no-retry) must log the dropped work; silent truncation falsely implies complete coverage.
- Scale to the ask: "find any bugs" → few finders, single-vote verify. "thoroughly audit" / "be comprehensive" → larger finder pool, 3–5-vote adversarial pass, synthesis.
- You own correctness: read every result, gate, and verify before acting. Subagents do legwork, not the final word.
- Continue until closed; returned fan-out is a step, not an endpoint.`;

// --- prose detection (port of modes/magic-keyword-boundary.ts + markdown-prose.ts) ---

/** Characters that bind a keyword into an identifier or path segment. */
const LEFT_BOUNDARY = String.raw`(?<![\p{L}\p{N}_./\\-])(?<!::)`;

/** Characters that cannot immediately follow a standalone keyword. */
const RIGHT_BOUNDARY = String.raw`(?![\p{L}\p{N}_/\\-])(?!\.[\p{L}\p{N}_-])(?!\()`;

function magicKeywordRegex(keyword: string, flags = ""): RegExp {
	const normalized = flags.includes("u") ? flags : `${flags}u`;
	return new RegExp(`${LEFT_BOUNDARY}${keyword}${RIGHT_BOUNDARY}`, normalized);
}

// Tag/element name; sticky so we can probe at a precise offset without slicing.
const TAG_NAME = /[A-Za-z][A-Za-z0-9-]*/y;

// A line that opens or closes a fenced code block: ≤3 leading spaces then ≥3 backticks/tildes.
const FENCE = /^( {0,3})([`~]{3,})/;

/** Index just past the run of backticks beginning at i. */
function backtickRunEnd(text: string, i: number, n: number): number {
	let j = i;
	while (j < n && text[j] === "`") j++;
	return j;
}

/** Closing backtick run matching an opening run of runLen, or -1 (unmatched run is literal text). */
function findBacktickClose(text: string, from: number, n: number, runLen: number, masked: Uint8Array): number {
	let k = from;
	while (k < n) {
		if (masked[k]) {
			k++;
			continue;
		}
		if (text[k] === "`") {
			const e = backtickRunEnd(text, k, n);
			if (e - k === runLen) return e;
			k = e;
			continue;
		}
		k++;
	}
	return -1;
}

/** Index of the `>` closing a tag whose attributes begin at j, honoring quotes; -1 if malformed. */
function findTagEnd(text: string, j: number, n: number): number {
	let quote = "";
	for (let k = j; k < n; k++) {
		const ch = text[k];
		if (quote) {
			if (ch === quote) quote = "";
			continue;
		}
		if (ch === '"' || ch === "'") {
			quote = ch;
			continue;
		}
		if (ch === ">") return k;
		if (ch === "<") return -1;
	}
	return -1;
}

/** `</name>` balancing an opening <name> at start (nested same-name counted); -1 if never closed. */
function findMatchingClose(text: string, start: number, n: number, name: string, masked: Uint8Array): number {
	const lname = name.toLowerCase();
	let depth = 1;
	let k = start;
	while (k < n) {
		if (masked[k] || text[k] !== "<") {
			k++;
			continue;
		}
		let m = k + 1;
		let isClose = false;
		if (text[m] === "/") {
			isClose = true;
			m++;
		}
		TAG_NAME.lastIndex = m;
		const nm = TAG_NAME.exec(text);
		if (!nm) {
			k++;
			continue;
		}
		const gt = findTagEnd(text, TAG_NAME.lastIndex, n);
		if (gt < 0) {
			k++;
			continue;
		}
		if (nm[0].toLowerCase() === lname) {
			if (isClose) {
				depth--;
				if (depth === 0) return gt + 1;
			} else if (text[gt - 1] !== "/") {
				depth++;
			}
		}
		k = gt + 1;
	}
	return -1;
}

/** Mask the HTML/XML construct at `<` (comment, tag alone, or tag plus content through its close). */
function maskTagAt(text: string, i: number, n: number, masked: Uint8Array): number {
	if (text.startsWith("<!--", i)) {
		const end = text.indexOf("-->", i + 4);
		const stop = end < 0 ? n : end + 3;
		for (let p = i; p < stop; p++) masked[p] = 1;
		return stop;
	}
	let j = i + 1;
	let closing = false;
	if (text[j] === "/") {
		closing = true;
		j++;
	}
	TAG_NAME.lastIndex = j;
	const nm = TAG_NAME.exec(text);
	if (!nm) return i;
	const gt = findTagEnd(text, TAG_NAME.lastIndex, n);
	if (gt < 0) return i;
	const tagEnd = gt + 1;
	const selfClosing = text[gt - 1] === "/";
	for (let p = i; p < tagEnd; p++) masked[p] = 1;
	if (closing || selfClosing) return tagEnd;
	const close = findMatchingClose(text, tagEnd, n, nm[0], masked);
	if (close < 0) return tagEnd;
	for (let p = tagEnd; p < close; p++) masked[p] = 1;
	return close;
}

/**
 * Length-preserving copy of text with every non-prose region — fenced code
 * blocks, inline code spans, HTML/XML comments/tags and the content they
 * enclose — blanked to spaces (newlines kept), so matching on the mask never
 * lands inside code/markup.
 */
function maskNonProse(text: string): string {
	if (!text.includes("`") && !text.includes("<") && !text.includes("~~~")) return text;
	const n = text.length;
	const masked = new Uint8Array(n);

	// Fenced code blocks, line by line.
	let fenceChar = "";
	let fenceLen = 0;
	let lineStart = 0;
	while (lineStart <= n) {
		let nl = text.indexOf("\n", lineStart);
		if (nl < 0) nl = n;
		const line = text.slice(lineStart, nl);
		const open = FENCE.exec(line);
		if (fenceChar) {
			for (let p = lineStart; p < nl; p++) masked[p] = 1;
			// A closing fence is the same char, at least as long, with nothing else on the line.
			if (
				open &&
				open[2]![0] === fenceChar &&
				open[2]!.length >= fenceLen &&
				line.slice(open[1]!.length + open[2]!.length).trim() === ""
			) {
				fenceChar = "";
				fenceLen = 0;
			}
		} else if (open) {
			const marker = open[2]!;
			const ch = marker[0]!;
			// A backtick fence's info string may not contain a backtick.
			if (!(ch === "`" && line.slice(open[1]!.length + marker.length).includes("`"))) {
				fenceChar = ch;
				fenceLen = marker.length;
				for (let p = lineStart; p < nl; p++) masked[p] = 1;
			}
		}
		if (nl === n) break;
		lineStart = nl + 1;
	}

	// Inline code spans and HTML/XML over not-yet-masked regions.
	let i = 0;
	while (i < n) {
		if (masked[i]) {
			i++;
			continue;
		}
		const c = text[i];
		if (c === "`") {
			const runEnd = backtickRunEnd(text, i, n);
			const close = findBacktickClose(text, runEnd, n, runEnd - i, masked);
			if (close >= 0) {
				for (let p = i; p < close; p++) masked[p] = 1;
				i = close;
			} else {
				i = runEnd;
			}
			continue;
		}
		if (c === "<") {
			const end = maskTagAt(text, i, n, masked);
			i = end > i ? end : i + 1;
			continue;
		}
		i++;
	}

	const arr = text.split("");
	for (let p = 0; p < n; p++) {
		if (masked[p] && arr[p] !== "\n") arr[p] = " ";
	}
	return arr.join("");
}

/** Standalone keyword in prose (not code spans/fences, HTML comments/tags, or compounds). */
function hasKeyword(text: string, kw: string): boolean {
	const word = magicKeywordRegex(kw);
	return word.test(text) && word.test(maskNonProse(text));
}

/** Remove prose occurrences of kw (plus leading spaces/tabs on the line) from text. */
function stripKeyword(text: string, kw: string): string {
	const masked = maskNonProse(text);
	const word = magicKeywordRegex(kw, "g");
	let out = "";
	let last = 0;
	for (const m of masked.matchAll(word)) {
		const idx = m.index!;
		let start = idx;
		while (start > last && (text[start - 1] === " " || text[start - 1] === "\t")) start--;
		out += text.slice(last, start);
		last = idx + m[0].length;
	}
	return (out + text.slice(last)).replace(/\n{3,}/g, "\n\n").trim();
}

export default function (pi: ExtensionAPI) {
	pi.on("input", async (event, ctx) => {
		let text = event.text;
		const notices: string[] = [];
		const fired: string[] = [];

		if (hasKeyword(text, "ultrathink")) {
			pi.setThinkingLevel("xhigh");
			notices.push(ULTRATHINK_NOTICE);
			text = stripKeyword(text, "ultrathink");
			fired.push("ultrathink → thinking xhigh");
		}
		if (hasKeyword(text, "orchestrate")) {
			notices.push(ORCHESTRATE_NOTICE);
			text = stripKeyword(text, "orchestrate");
			fired.push("orchestrate → subagent contract");
		}
		if (hasKeyword(text, "workflowz")) {
			notices.push(WORKFLOWZ_NOTICE);
			text = stripKeyword(text, "workflowz");
			fired.push("workflowz → adversarial fan-out");
		}

		if (notices.length === 0) return;

		if (ctx.hasUI) ctx.ui.notify(`⚡ ${fired.join(" · ")}`, "info");
		const prefix = notices.map((n) => `<system-notice>\n${n}\n</system-notice>`).join("\n");
		return { action: "transform", text: `${prefix}\n\n${text}` };
	});
}
