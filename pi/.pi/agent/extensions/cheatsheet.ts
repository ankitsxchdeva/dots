/**
 * cheatsheet — /cheatsheet prints the platform map: every custom command,
 * tool, keyword, and the sprint workflow order. Zero LLM cost, always current
 * with what's actually loaded. The discoverability answer for a config with
 * 10 extensions and 10 templates.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const CHEATSHEET = `PLATFORM CHEATSHEET
═══════════════════════════════════════════════════════════
Sprint workflow (use the one matching your stage):
  /office-hours      rethink the product before code → design doc
  /plan-ceo-review   CEO-grade plan review (scope modes)
  /plan-eng-review   eng-manager review (arch, tests, failure modes)
  /investigate       root-cause debugging (Iron Law: investigate first)
  /review            diff review — report only
  /qa [url]          real-browser QA with screenshot evidence
  /cso               OWASP + STRIDE security audit
  /commit · /pr      clean conventional commit · open PR
  /retro [window]    engineering retro from git data

Tools (the model calls these):
  task               subagent fan-out — self-contained prompts, parallel
  remember           store durable project fact (auto-loads next session)
  playwright-cli     real browser via bash: npx @playwright/cli —
                     open, snapshot, click, fill, screenshot, console

Keywords (in prose):
  ultrathink         deep reasoning (thinking → xhigh)
  orchestrate        parallel subagent execution contract
  workflowz          deterministic fan-out + adversarial verify

Commands:
  /advisor on [model]  second model reviews each turn (default: local ollama)
  /careful             confirm before destructive commands
  /freeze [dir]        block edits outside dir · /unfreeze clears
  /guard               careful + freeze in one step
  /memory              show this project's memory file
  /cheatsheet          this map

Updates: launchd polls GitHub daily (oh-my-pi, gstack, pi itself);
  a session-start notice appears when behind — /skill:upstream-watch
  to review, ~/.dots/sync-upstreams.sh to pull.

Footer statuses: ⚠ careful · ❄ freeze dir · 👁 advisor model
Tab title: ▸ working · ✓ done — locked to first prompt
═══════════════════════════════════════════════════════════`;

export default function (pi: ExtensionAPI) {
	pi.registerCommand("cheatsheet", {
		description: "Print the platform map — every custom command, tool, keyword, and the workflow order",
		handler: async (_args, ctx) => {
			if (ctx.hasUI) ctx.ui.notify(CHEATSHEET, "info");
			else process.stdout.write(`${CHEATSHEET}\n`);
		},
	});
}
