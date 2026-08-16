/**
 * magic-keywords — port of omp's prompt controls (docs/magic-keywords.md).
 * Three standalone lowercase words opt a turn into specialized behavior:
 *
 *   ultrathink  — bump thinking level to xhigh for deep reasoning
 *   orchestrate — run substantial work through parallel `task` subagents
 *   workflowz   — deterministic multi-subagent fan-out with adversarial verify
 *
 * Keywords trigger only in prose — never inside code spans or fenced blocks —
 * and are stripped from the prompt before it reaches the model.
 *
 * Source: ~/src/oh-my-pi/packages/coding-agent/src/prompts/system/
 *   {ultrathink,orchestrate,workflow}-notice.md (adapted: mustache conditionals
 *   resolved, fork-only tools removed). Re-check upstream with omp-sync.sh.
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
3. Parallelize maximally; never launch a one-off task. Disjoint-scope edits MUST be parallel task calls in one message. Serialize only when a produced contract — types, schema, shared module — is consumed next; state the dependency.
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
</workflow>`;

const WORKFLOWZ_NOTICE = `Deterministic multi-subagent workflow request. Fan out with the \`task\` tool when it improves thoroughness: parallel decomposition/coverage, independent or adversarial pre-commit checks, or work beyond one context (audits, migrations, broad sweeps). Overrides doing work inline when fan-out is more thorough.

- Explore inline FIRST — list files, scope the diff, find call sites — to discover the work-list; know its shape before fan-out, not at task start.
- Decompose into independent, self-contained task assignments; run all independent tasks in parallel in one message.
- Verify adversarially: spawn independent skeptic subagents prompted to REFUTE each key finding (default refuted when unsure); retain only survivors.
- For judgment calls, use a judge panel: N angle-diverse attempts, then parallel judges scoring and a synthesis pass.
- You own correctness: read every result, gate, and verify before acting. Subagents do legwork, not the final word.
- Continue until closed; returned fan-out is a step, not an endpoint.`;

const CODE_SEGMENT = /(```[\s\S]*?```|`[^`\n]*`)/g;

/** Apply fn only to prose segments, leaving code spans/fences untouched. */
function mapProse(text: string, fn: (s: string) => string): string {
	return text
		.split(CODE_SEGMENT)
		.map((seg, i) => (i % 2 === 1 ? seg : fn(seg)))
		.join("");
}

function hasKeyword(text: string, kw: string): boolean {
	return mapProse(text, (s) => (new RegExp(`\\b${kw}\\b`).test(s) ? "" : s)).includes("");
}

function stripKeyword(text: string, kw: string): string {
	return mapProse(text, (s) => s.replace(new RegExp(`\\s*\\b${kw}\\b`, "g"), ""))
		.replace(/\n{3,}/g, "\n\n")
		.trim();
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
