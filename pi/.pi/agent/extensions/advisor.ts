/**
 * advisor — a second model watching every turn, lite port of omp's advisor
 * (feature 06). Opt-in via /advisor so it never costs tokens unasked.
 *
 *   /advisor on [provider/model]   enable (default model below)
 *   /advisor off                   disable
 *   /advisor                       status
 *
 * On each turn end the advisor gets the incremental transcript (assistant
 * message + tool calls) and replies SILENT or one severity-prefixed note:
 * nit / concern / blocker. Notes are injected back as steering (blocker) or
 * follow-up (nit/concern) messages, so the main agent course-corrects.
 * A turn ending mid-review is queued (latest only) and reviewed on catch-up
 * instead of being dropped (omp 18.1.0 fixed the same concern-drop).
 *
 * System prompt adapted from
 *   ~/src/oh-my-pi/packages/coding-agent/src/prompts/advisor/system.md
 * (re-port 2026-09-01, upstream HEAD 7523a2d7; re-check with omp-sync.sh).
 * Not ported: advise tool with session tool grants, WATCHDOG.yml, /advisor
 * dump, per-turn streaming, RFC 2119 conventions block.
 */

import type { ExtensionAPI, TurnEndEvent } from "@earendil-works/pi-coding-agent";
import { uuidv7 } from "@earendil-works/pi-ai";

const ADVISOR_SYSTEM = `You are an advisor: a peer-shadow reviewing another AI coding agent's work, turn by turn. You receive the incremental transcript of its latest turn (assistant message, tool calls, tool results).

Rules:
- Default to silence. When the agent is on track, reply with exactly: SILENT
- Speak only on concrete technical risk or transcript-evident execution failure: correctness bugs, edge cases, fragile design, thin verification, contradicted explicit instructions. Never on style, user intent, scope, or ambition.
- Never restate information the agent already has (seen errors, diagnostics, failed tests).
- Never repeat prior advice or send identical advice twice; let the agent act before revisiting a theme.
- Never tell the agent to ask the user for clarification, confirm scope, summarize input, question the clarity of the ask, or narrate its workflow; intent is the agent's domain.
- Never nitpick what the user accepts: their word is truth, their frustration is justified, their requirements are binding.
- Never second-guess a decision the agent understands and commits to unless certain it is wrong.
- Never raise backwards compatibility unless the transcript explicitly requires it; without that, clean cutover is correct — delete the old path, migrate every caller, remove obsolete tests, and never preserve removed behavior just to satisfy its tests.
- Large diffs and rewrites are not problems by themselves; object only when they contradict an explicit instruction, touch ambient user work, or bolt unrequested features onto a bounded request — cite the evidence.
- Cite only transcript evidence. For hidden or truncated tool arguments, state observable facts only. Transcript fields labeled "tool call" or "tool result" are rendered evidence — use them directly; a field ending in an [excerpt] marker is only an excerpt, not the full output.

When you do speak, prefix with exactly one severity and keep it to 1–3 sentences addressed to the agent directly, offering an alternative rather than a lecture:
- nit: non-urgent cleanup or a missed opportunity; fold in at the next step boundary.
- concern: the agent may be heading wrong or missing a material issue; offer your view, the agent decides. Examples: wrong code path, missing constraint, soon-baked edge case; serializing independent parallelizable work; re-planning an already-resolved next action; an explicit tool or workflow ignored, or a transcript-confirmed specialized tool bypassed; guessing at readable source, contracts, or logs instead of looking; guessing runtime behavior when an executable check exists; speculative flags, wrappers, or dependencies without demonstrated need; a local workaround for a verified upstream cause; subagent prompts missing goal, context, or ownership, or scripting safe local decisions; prompt or docs double-narrating examples or exposing irrelevant implementation internals; evident context exhaustion or repeated root dumps needing a persistent shared brief; churn without progress or repeated user corrections ignored.
- blocker: stop and reconsider — only when continued progress contradicts an explicit instruction, is fundamentally unsound, hands off as done work never exercised against the actual ask, substitutes stubs/TODOs/mocks for required implementation or live verification, claims completion while sampling or dropping explicit exhaustive scope, yields before an explicit convergence condition (green CI, passing tests, benchmark target) is met, ships verification too thin for the risk just taken, will require user interruption because the agent circles without a solution, or is plainly stalling the user's goal through overthinking or a rabbit hole. Verify thoroughly before raising.`;

/** Default advisor model: local Ollama = zero API cost. Override with /advisor on <provider/model>. */
const DEFAULT_MODEL = { provider: "pi-ollama", id: "qwen2.5-coder:7b" };

/** Truncate a transcript field, marking the cut so the advisor never treats an excerpt as full output. */
const excerpt = (s: string, max: number) => (s.length > max ? `${s.slice(0, max)} [excerpt]` : s);

export default function (pi: ExtensionAPI) {
	let enabled = false;
	let modelSpec = DEFAULT_MODEL;
	let busy = false;
	// Coalesced catch-up slot: the latest turn that ended while a review ran.
	let pending: TurnEndEvent | null = null;

	pi.registerCommand("advisor", {
		description: "Second-model advisor: /advisor on [provider/model] | off | (status)",
		handler: async (args, ctx) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			if (parts[0] === "on") {
				if (parts[1]) {
					const slash = parts[1].indexOf("/");
					if (slash > 0) modelSpec = { provider: parts[1].slice(0, slash), id: parts[1].slice(slash + 1) };
					else modelSpec = { provider: ctx.model?.provider ?? DEFAULT_MODEL.provider, id: parts[1] };
				}
				const model = ctx.modelRegistry.find(modelSpec.provider, modelSpec.id);
				if (!model) {
					ctx.ui.notify(`Advisor model not found: ${modelSpec.provider}/${modelSpec.id}`, "error");
					return;
				}
				if (!ctx.modelRegistry.hasConfiguredAuth(model)) {
					ctx.ui.notify(`No auth for ${modelSpec.provider}/${modelSpec.id}`, "error");
					return;
				}
				enabled = true;
				ctx.ui.setStatus("advisor", `👁 ${modelSpec.id}`);
				ctx.ui.notify(`Advisor on (${modelSpec.provider}/${modelSpec.id})`, "info");
			} else if (parts[0] === "off") {
				enabled = false;
				ctx.ui.setStatus("advisor", undefined);
				ctx.ui.notify("Advisor off", "info");
			} else {
				ctx.ui.notify(`Advisor ${enabled ? "on" : "off"} (${modelSpec.provider}/${modelSpec.id})`, "info");
			}
		},
	});

	pi.on("turn_end", async (event, ctx) => {
		if (!enabled) return;
		if (busy) {
			pending = event;
			return;
		}

		busy = true;
		try {
			for (let ev: TurnEndEvent | null = event; ev && enabled; ev = pending, pending = null) {
				// Loop guard: if the agent is responding to an advisor note, let it work —
				// advice on advice-on-advice is how sessions spiral.
				const branch = ctx.sessionManager.getBranch();
				const lastUser = [...branch].reverse().find((e) => e.type === "message" && e.message.role === "user");
				let skip = false;
				if (lastUser && lastUser.type === "message" && lastUser.message.role === "user") {
					const c = lastUser.message.content;
					const text = typeof c === "string" ? c : c.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join(" ");
					if (text.trimStart().startsWith("[advisor ")) skip = true;
				}

				// Incremental transcript: this turn's assistant message + tool activity.
				const m = ev.message;
				const parts: string[] = [];
				// turn_end can fire on non-assistant messages (e.g. !bash executions),
				// which have no .content — skip those rather than crash the advisor.
				if (!skip && m.role === "assistant") {
					for (const c of m.content) {
						if (c.type === "text") parts.push(`assistant text: ${c.text}`);
						else if (c.type === "toolCall") parts.push(`tool call: ${c.name}(${excerpt(JSON.stringify(c.arguments), 300)})`);
						else if (c.type === "thinking") parts.push(`assistant thinking: ${excerpt(c.thinking, 500)}`);
					}
					for (const r of ev.toolResults) {
						const text = r.content
							.filter((c): c is { type: "text"; text: string } => c.type === "text")
							.map((c) => c.text)
							.join("\n");
						parts.push(`tool result [${r.toolName}${r.isError ? ", error" : ""}]: ${excerpt(text, 500)}`);
					}
				}
				const transcript = parts.join("\n").trim();

				const model = ctx.modelRegistry.find(modelSpec.provider, modelSpec.id);
				if (transcript && model) {
					const response = await ctx.modelRegistry.complete(
						model,
						{
							systemPrompt: ADVISOR_SYSTEM,
							messages: [
								{ role: "user", content: [{ type: "text", text: transcript }], timestamp: Date.now() },
							],
						},
						{ cacheRetention: "none", sessionId: uuidv7(), signal: ctx.signal },
					);
					const advice = response.content
						.filter((c): c is { type: "text"; text: string } => c.type === "text")
						.map((c) => c.text)
						.join("\n")
						.trim();

					if (!advice || /^SILENT\b/i.test(advice)) {
						// Reviewed, no comment — neutral idle state so a silent verdict is visible.
						ctx.ui.setStatus("advisor", `👁 ${modelSpec.id} · idle`);
					} else {
						const severity = /^(blocker|concern|nit)/i.exec(advice)?.[1].toLowerCase() ?? "concern";
						pi.sendUserMessage(`[advisor ${severity}] ${advice}`, {
							deliverAs: severity === "blocker" ? "steer" : "followUp",
						});
						ctx.ui.setStatus("advisor", `advisor: ${severity}`);
					}
				}
			}
		} catch (e) {
			// Surface the first failure, then stop — a dead advisor failing
			// silently forever is worse than no advisor.
			enabled = false;
			ctx.ui.setStatus("advisor", undefined);
			const msg = e instanceof Error ? e.message : String(e);
			ctx.ui.notify(`Advisor unreachable (${modelSpec.provider}/${modelSpec.id}): ${msg} — disabled`, "warning");
		} finally {
			busy = false;
		}
	});
}
