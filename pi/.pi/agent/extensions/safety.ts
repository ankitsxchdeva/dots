/**
 * safety — port of gstack's /careful, /freeze, /guard, /unfreeze power tools.
 *
 *   /careful          toggle: confirm before destructive bash commands
 *   /freeze [dir]     block edit/write outside <dir> (default: cwd)
 *   /unfreeze         clear the freeze boundary
 *   /guard            careful + freeze to cwd in one step
 *
 * careful warns (overridable), freeze hard-blocks. Patterns and safe
 * exceptions from ~/src/gstack/careful/SKILL.md; freeze semantics from
 * ~/src/gstack/freeze/SKILL.md (trailing-separator match, edit/write only).
 */

import os from "node:os";
import path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

const DESTRUCTIVE: Array<[RegExp, string]> = [
	[/\brm\s+(?:-\w*r\w*|--recursive)/, "recursive delete"],
	[/\bDROP\s+(?:TABLE|DATABASE)\b/i, "SQL DROP — data loss"],
	[/\bTRUNCATE\s+/i, "SQL TRUNCATE — data loss"],
	[/\bgit\s+push\b[^|&;]*(?:\s-f(?:\s|$)|--force(?:\s|$|=))/, "force push — rewrites history (use --force-with-lease)"],
	[/\bgit\s+reset\s+--hard\b/, "git reset --hard — loses uncommitted work"],
	[/\bgit\s+(?:checkout|restore)\s+\.(?:\s|$)/, "discards all uncommitted changes"],
	[/\bkubectl\s+delete\b/, "kubectl delete — production impact"],
	[/\bdocker\s+(?:rm\s+-f|system\s+prune)/, "docker destructive cleanup"],
];

/** rm -rf of build artifacts is fine — these never warn. */
const SAFE_TARGET = /(?:^|[/\s])(node_modules|\.next|dist|__pycache__|\.cache|build|\.turbo|coverage)(?:[/\s]|$)/;
/** ...but not if the same command also reaches outside them. */
const UNSAFE_PATH = /(?:~|\.\.|\s\/(?:[^\s/]|$))/;

export default function (pi: ExtensionAPI) {
	let careful = false;
	let freezeDir: string | null = null;

	/** Footer status so the rails are glanceable, not just set-and-forget. */
	function refreshStatus(ctx: ExtensionContext): void {
		if (!ctx.hasUI) return;
		const parts: string[] = [];
		if (careful) parts.push("⚠ careful");
		if (freezeDir) parts.push(`❄ ${freezeDir.replace(os.homedir(), "~")}`);
		ctx.ui.setStatus("safety", parts.length > 0 ? parts.join(" · ") : undefined);
	}

	pi.registerCommand("careful", {
		description: "Toggle confirmation before destructive commands (rm -rf, DROP TABLE, force-push, …)",
		handler: async (_args, ctx) => {
			careful = !careful;
			refreshStatus(ctx);
			ctx.ui.notify(`careful ${careful ? "ON — destructive commands will ask first" : "off"}`, "info");
		},
	});

	pi.registerCommand("freeze", {
		description: "Restrict edit/write to a directory: /freeze [dir] (default: current directory)",
		handler: async (args, ctx) => {
			const dir = path.resolve(ctx.cwd, args.trim() || ".");
			freezeDir = dir.endsWith(path.sep) ? dir : dir + path.sep;
			refreshStatus(ctx);
			ctx.ui.notify(`Edits frozen to ${freezeDir} — /unfreeze to clear`, "info");
		},
	});

	pi.registerCommand("unfreeze", {
		description: "Clear the freeze boundary",
		handler: async (_args, ctx) => {
			freezeDir = null;
			refreshStatus(ctx);
			ctx.ui.notify("Freeze cleared — edits unrestricted", "info");
		},
	});

	pi.registerCommand("guard", {
		description: "careful + freeze to current directory in one step",
		handler: async (_args, ctx) => {
			careful = true;
			freezeDir = ctx.cwd.endsWith(path.sep) ? ctx.cwd : ctx.cwd + path.sep;
			refreshStatus(ctx);
			ctx.ui.notify(`guard ON — destructive commands ask; edits frozen to ${freezeDir}`, "info");
		},
	});

	pi.on("tool_call", async (event, ctx) => {
		if (careful && event.toolName === "bash") {
			const cmd = (event.input as { command?: string }).command ?? "";
			for (const [re, why] of DESTRUCTIVE) {
				if (!re.test(cmd)) continue;
				if (SAFE_TARGET.test(cmd) && !UNSAFE_PATH.test(cmd)) continue; // build-artifact cleanup
				if (!ctx.hasUI) return { block: true, reason: `Blocked by /careful (${why}) — no UI to confirm` };
				const ok = await ctx.ui.confirm("Destructive command", `${why}\n\n${cmd}\n\nAllow?`);
				if (!ok) return { block: true, reason: `Blocked by /careful (${why})` };
				break; // user approved this command
			}
		}

		if (freezeDir && (event.toolName === "edit" || event.toolName === "write")) {
			const target = (event.input as { path?: string }).path ?? "";
			const resolved = path.resolve(ctx.cwd, target);
			if (!resolved.startsWith(freezeDir)) {
				return {
					block: true,
					reason: `Frozen: edits restricted to ${freezeDir} (got ${resolved}). /unfreeze to clear.`,
				};
			}
		}
	});
}
