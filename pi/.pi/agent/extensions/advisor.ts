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
 *
 * System prompt adapted from
 *   ~/src/oh-my-pi/packages/coding-agent/src/prompts/advisor/system.md
 * (re-check upstream with omp-sync.sh). Not ported: advise tool with session
 * tool grants, WATCHDOG.yml, /advisor dump, per-turn streaming.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { uuidv7 } from "@earendil-works/pi-ai";

const ADVISOR_SYSTEM = `You are an advisor: a peer-shadow reviewing another AI coding agent's work, turn by turn. You receive the incremental transcript of its latest turn (assistant message, tool calls, tool results).

Rules:
- Default to silence. When the agent is on track, reply with exactly: SILENT
- Speak only on concrete technical risk or transcript-evident execution failure: correctness bugs, edge cases, fragile design, thin verification, contradicted explicit instructions. Never on style, user intent, scope, or ambition.
- Never restate information the agent already has (seen errors, diagnostics, failed tests).
- Never tell the agent to ask the user for clarification, confirm scope, or narrate its workflow; intent is the agent's domain.
- Never raise backwards compatibility unless the transcript explicitly requires it; without that, clean cutover is correct — delete the old path, migrate every caller, remove obsolete tests, and never preserve removed behavior just to satisfy its tests.
- Large diffs and rewrites are not problems by themselves; object only when they contradict an explicit instruction, touch ambient user work, or bolt unrequested features onto a bounded request — cite the evidence.
- Cite only transcript evidence. For hidden or truncated tool arguments, state observable facts only.

When you do speak, prefix with exactly one severity and keep it to 1–3 sentences addressed to the agent directly, offering an alternative rather than a lecture:
- nit: non-urgent cleanup or a missed opportunity; fold in at the next step boundary.
- concern: the agent may be heading wrong or missing a material issue; offer your view, the agent decides. Examples: wrong code path, missing constraint, soon-baked edge case; serializing independent parallelizable work; re-planning an already-resolved next action; guessing at readable source, contracts, or logs instead of looking; guessing runtime behavior when an executable check exists; speculative flags, wrappers, or dependencies without demonstrated need; a local workaround for a verified upstream cause; subagent prompts missing goal, context, or ownership; churn without progress or repeated user corrections ignored.
- blocker: stop and reconsider — only when continued progress contradicts an explicit instruction, is fundamentally unsound, hands off as done work never exercised against the actual ask, substitutes stubs/TODOs/mocks for required implementation or live verification, claims completion while sampling or dropping explicit exhaustive scope, yields before an explicit convergence condition (green CI, passing tests, benchmark target) is met, or ships verification too thin for the risk just taken.`;

/** Default advisor model: local Ollama = zero API cost. Override with /advisor on <provider/model>. */
const DEFAULT_MODEL = { provider: "pi-ollama", id: "qwen2.5-coder:7b" };

export default function (pi: ExtensionAPI) {
	let enabled = false;
	let modelSpec = DEFAULT_MODEL;
	let busy = false;

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
		if (!enabled || busy) return;

		// Loop guard: if the agent is responding to an advisor note, let it work —
		// advice on advice-on-advice is how sessions spiral.
		const branch = ctx.sessionManager.getBranch();
		const lastUser = [...branch].reverse().find((e) => e.type === "message" && e.message.role === "user");
		if (lastUser && lastUser.type === "message" && lastUser.message.role === "user") {
			const c = lastUser.message.content;
			const text = typeof c === "string" ? c : c.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join(" ");
			if (text.trimStart().startsWith("[advisor ")) return;
		}

		// Incremental transcript: this turn's assistant message + tool activity.
		const m = event.message;
		const parts: string[] = [];
		for (const c of m.content) {
			if (c.type === "text") parts.push(`assistant text: ${c.text}`);
			else if (c.type === "toolCall") parts.push(`tool call: ${c.name}(${JSON.stringify(c.arguments).slice(0, 300)})`);
			else if (c.type === "thinking") parts.push(`assistant thinking: ${c.thinking.slice(0, 500)}`);
		}
		for (const r of event.toolResults) {
			const text = r.content
				.filter((c): c is { type: "text"; text: string } => c.type === "text")
				.map((c) => c.text)
				.join("\n");
			parts.push(`tool result [${r.toolName}${r.isError ? ", error" : ""}]: ${text.slice(0, 500)}`);
		}
		const transcript = parts.join("\n").trim();
		if (!transcript) return;

		const model = ctx.modelRegistry.find(modelSpec.provider, modelSpec.id);
		if (!model) return;

		busy = true;
		try {
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

			if (!advice || /^SILENT\b/i.test(advice)) return;

			const severity = /^(blocker|concern|nit)/i.exec(advice)?.[1].toLowerCase() ?? "concern";
			pi.sendUserMessage(`[advisor ${severity}] ${advice}`, {
				deliverAs: severity === "blocker" ? "steer" : "followUp",
			});
			ctx.ui.setStatus("advisor", `advisor: ${severity}`);
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
