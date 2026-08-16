/**
 * tab-title — drive the terminal tab title from the pi session so multiple
 * threads are easy to tell apart at a glance. Port of the Claude Code
 * ghostty-tab-title hook; in-process, so no tty-walking is needed.
 *
 *   Title format:  <status> <project> · <prompt context>
 *   example:       ▸ dots · fix backspace in ghostty
 *
 * - status: ▸ while the agent runs, ✓ when it fully settles
 * - project: basename of the git repo (or cwd), leading dot stripped
 * - prompt context: locked to the session's FIRST prompt so follow-ups
 *   ("commit this", "now fix the test") don't relabel the thread
 */

import { execSync } from "node:child_process";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

function projectName(cwd: string): string {
	let root = cwd;
	try {
		const out = execSync("git rev-parse --show-toplevel", {
			cwd,
			stdio: ["ignore", "pipe", "ignore"],
		})
			.toString()
			.trim();
		if (out) root = out;
	} catch {
		// not a git repo — fall back to cwd
	}
	let proj = path.basename(root);
	if (proj.startsWith(".")) proj = proj.slice(1);
	return proj.slice(0, 16);
}

export default function (pi: ExtensionAPI) {
	let proj: string | null = null;
	let task = ""; // locked to the session's first prompt

	function title(ctx: ExtensionContext, glyph: string): string {
		if (proj === null) proj = projectName(ctx.cwd);
		let t = proj ? `${glyph} ${proj}` : glyph;
		if (task) t += proj ? ` · ${task}` : ` ${task}`;
		return t;
	}

	pi.on("before_agent_start", async (event, ctx) => {
		if (!ctx.hasUI) return;
		if (!task) {
			task = event.prompt
				.replace(/[\x00-\x1f]+/g, " ")
				.trim()
				.replace(/ +/g, " ")
				.slice(0, 40);
		}
		ctx.ui.setTitle(title(ctx, "▸"));
	});

	pi.on("agent_settled", async (_event, ctx) => {
		if (!ctx.hasUI) return;
		ctx.ui.setTitle(title(ctx, "✓"));
	});
}
