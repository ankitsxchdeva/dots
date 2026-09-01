/**
 * safety — port of gstack's /careful, /freeze, /guard, /unfreeze power tools.
 *
 *   /careful          toggle: confirm before destructive bash commands
 *   /freeze [dir]     block edit/write outside <dir> (default: cwd)
 *   /unfreeze         clear the freeze boundary
 *   /guard            careful + freeze to cwd in one step
 *
 * Re-ported from upstream HEAD e76f65a8 (2026-09-01). Three careful tiers per
 * careful/bin/check-careful.sh: HIGH hard-deny (recursive delete of exactly
 * /, ~, or $HOME; force-push to the default branch — simple commands only,
 * --force-with-lease exempt), a warn tier (destructive families + shell-
 * obfuscation tripwires), and an anchored safe-exception so one standalone
 * rm of build artifacts stays silent. User patterns are additive-only:
 * ~/.gstack/careful-patterns.txt and ~/.gstack/projects/<slug>/careful-
 * patterns.txt can ADD warn rules, never suppress a baseline one. Freeze
 * semantics from freeze/bin/check-freeze.sh (edit/write only, exact-or-
 * trailing-separator match, symlinks resolved through the final component,
 * fail-closed on unreadable target paths).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

/** MEDIUM tier — destructive families that warn (overridable). */
const DESTRUCTIVE: Array<[RegExp, string]> = [
	[/\brm\s+(-[a-zA-Z]*[rR]|--recursive)/, "recursive delete"],
	[/\bDROP\s+(?:TABLE|DATABASE)\b/i, "SQL DROP — data loss"],
	[/\bTRUNCATE\s+/i, "SQL TRUNCATE — data loss"],
	[/\bgit\s+push\b[^|&;]*(?:\s-f(?:\s|$)|--force(?:\s|$|=)|\s\+\S)/, "force push — rewrites history (use --force-with-lease)"],
	[/\bgit\s+reset\s+--hard\b/, "git reset --hard — loses uncommitted work"],
	[/\bgit\s+(?:checkout|restore)\s+\.(?:\s|$)/, "discards all uncommitted changes"],
	[/\bkubectl\s+delete\b/, "kubectl delete — production impact"],
	[/\bdocker\s+(?:rm\s+-f|system\s+prune)/, "docker destructive cleanup"],
];

/** Warn tier: shell obfuscation — ${IFS} word-splitting defeats every string
 *  pattern below, and decode-to-shell assembles a command we never see. */
const OBFUSCATION = /\$\{IFS\}|\$IFS|\$\(echo[^)]*base64[^)]*\)|base64\s+(-d|--decode)[^|]*\|\s*(sh|bash)/;

/** Safe exception: ONE standalone rm of ONLY build-artifact targets never
 *  warns. Anchored to the whole single-line command — shell syntax or
 *  substitution in a target (`rm -rf $(…)/node_modules`) can't ride it. */
const SAFE_RM = /^\s*rm\s+(-[a-zA-Z]*[rR][a-zA-Z]*\s+|--recursive\s+)(([^\s;&|#(`]*\/)?(?:node_modules|\.next|dist|__pycache__|\.cache|build|\.turbo|coverage)\s*)+$/;

/** HIGH tier: recursive delete aimed at exactly these targets (plus no other)
 *  is denied outright, not asked. */
const ROOT_TARGETS = new Set(["/", "~", "~/", "$HOME", "$HOME/", "${HOME}", "${HOME}/", "/*", "//"]);

type Verdict = { tier: "deny" | "ask"; why: string } | null;

/** Simple command = no sequencing/piping: compound shapes fall through to the
 *  overridable warn tier (conservative failure = ask, never guess). */
function isSimple(cmd: string): boolean {
	return !/[;|\n]/.test(cmd) && !cmd.includes("&&");
}

/** Strip one layer of surrounding quotes: `rm -rf "/"` is still rm -rf /. */
function unquote(tok: string): string {
	return tok.replace(/^["']/, "").replace(/["']$/, "").replace(/^["']/, "").replace(/["']$/, "");
}

function isRootRm(cmd: string): boolean {
	if (!/^\s*(sudo\s+)?rm\s/.test(cmd)) return false;
	if (!/(^|\s)(-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)(\s|$)/.test(cmd)) return false;
	let root = false;
	for (const raw of cmd.trim().split(/\s+/)) {
		const tok = unquote(raw);
		if (tok === "sudo" || tok === "rm" || tok === "&" || tok.startsWith("-")) continue;
		if (/^\d*>/.test(tok) || tok.startsWith(">") || tok.startsWith("<")) continue; // redirections, backgrounding
		if (!ROOT_TARGETS.has(tok)) return false; // any other target → not the root shape
		root = true;
	}
	return root;
}

/** The repo's default branch: origin/HEAD when set, else the conventional
 *  main/master probe (Conductor worktrees lack the symbolic ref). */
function defaultBranch(cwd: string): string | null {
	try {
		const ref = execSync("git symbolic-ref refs/remotes/origin/HEAD", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
		const m = /^refs\/remotes\/origin\/(.+)$/.exec(ref);
		if (m) return m[1];
	} catch { /* fall through to the conventional defaults */ }
	for (const branch of ["main", "master"]) {
		try {
			execSync(`git show-ref --verify -q refs/remotes/origin/${branch}`, { cwd, stdio: "ignore" });
			return branch;
		} catch { /* try next */ }
	}
	return null;
}

/** Force-push to the repo's default branch, or null if not that shape. Force
 *  is carried by -f/--force OR the plus-refspec syntax (+main) which needs no
 *  flag; --force-with-lease is never matched. Fixed-string token comparison —
 *  a branch name is never regex-interpolated, quoted refs are stripped. */
function forcePushDefaultBranch(cmd: string, cwd: string): string | null {
	if (!/^\s*git\s+push(\s|$)/.test(cmd)) return null;
	if (!/(^|\s)(-f|--force)(\s|$)/.test(cmd) && !/(^|\s)\+\S/.test(cmd)) return null;
	const branch = defaultBranch(cwd);
	if (!branch) return null;
	for (const raw of cmd.trim().split(/\s+/)) {
		const tok = unquote(raw);
		if (tok === "git" || tok === "push" || tok === "sudo" || tok.startsWith("-")) continue;
		if (tok.replace(/^\+/, "").replace(/.*:/, "") === branch) return branch;
	}
	// Bare `git push --force` (no remote/ref) targets the current branch's
	// upstream — the default branch only when ON it.
	if (/^\s*git\s+push(\s+(-f|--force))*\s*$/.test(cmd)) {
		try {
			const current = execSync("git branch --show-current", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
			if (current === branch) return branch;
		} catch { /* outside a repo — nothing to protect */ }
	}
	return null;
}

const slugCache = new Map<string, string | null>();

/** Project slug: basename of the git toplevel (lite stand-in for gstack-slug). */
function repoSlug(cwd: string): string | null {
	const cached = slugCache.get(cwd);
	if (cached !== undefined) return cached;
	let slug: string | null = null;
	try {
		const top = execSync("git rev-parse --show-toplevel", { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
		if (top) slug = path.basename(top);
	} catch { /* not a repo */ }
	slugCache.set(cwd, slug);
	return slug;
}

/** Additive user patterns — warn rules only. Consulted AFTER the built-in
 *  families, so config can ADD rules, never suppress a baseline warning.
 *  One pattern per line, `#` comments OK, invalid regex lines skipped. */
function userPatterns(cwd: string): Array<{ line: string; re: RegExp }> {
	const home = process.env.GSTACK_HOME || path.join(os.homedir(), ".gstack");
	const files = [path.join(home, "careful-patterns.txt")];
	const projects = path.join(home, "projects");
	try {
		// Slug resolution costs a git spawn — only pay it when some per-project
		// pattern file actually exists anywhere.
		if (fs.readdirSync(projects).some((e) => fs.existsSync(path.join(projects, e, "careful-patterns.txt")))) {
			const slug = repoSlug(cwd);
			if (slug) files.push(path.join(projects, slug, "careful-patterns.txt"));
		}
	} catch { /* no projects dir */ }
	const patterns: Array<{ line: string; re: RegExp }> = [];
	for (const file of files) {
		let text: string;
		try {
			text = fs.readFileSync(file, "utf8");
		} catch { continue; }
		for (const raw of text.split("\n")) {
			const line = raw.trim();
			if (!line || line.startsWith("#")) continue;
			try {
				patterns.push({ line, re: new RegExp(line) });
			} catch { continue; } // invalid regex — skip the line
		}
	}
	return patterns;
}

/** null = allow silently; "deny" = hard block; "ask" = confirmable warning. */
function assessCommand(cmd: string, cwd: string): Verdict {
	if (OBFUSCATION.test(cmd)) {
		return { tier: "ask", why: "shell obfuscation detected (${IFS} splitting or decode-to-shell) — read the command carefully before approving" };
	}
	if (isSimple(cmd)) {
		if (isRootRm(cmd)) {
			return { tier: "deny", why: "recursive delete of / or the whole home directory — hard-denied while /careful is active; end /careful if you truly mean it" };
		}
		const branch = forcePushDefaultBranch(cmd, cwd);
		if (branch) {
			return { tier: "deny", why: `force-push to the default branch (${branch}) — hard-denied while /careful is active; use --force-with-lease or end /careful if you truly mean it` };
		}
	}
	// Safe exception (single-line commands only): build-artifact cleanup.
	if (!cmd.includes("\n") && SAFE_RM.test(cmd)) return null;
	for (const [re, why] of DESTRUCTIVE) {
		if (re.test(cmd)) return { tier: "ask", why };
	}
	const rule = userPatterns(cwd).find(({ re }) => re.test(cmd));
	if (rule) return { tier: "ask", why: `project rule matched: ${rule.line}` };
	return null;
}

/** Resolve symlinks through the FINAL path component (upstream freeze
 *  semantics): an in-boundary symlink pointing outside is checked against its
 *  target. A not-yet-existing final component (new file) falls back to its
 *  resolved parent; anything unresolvable stays lexical — never throws. */
function realpathFinal(p: string): string {
	try {
		return fs.realpathSync(p);
	} catch {
		try {
			return path.join(fs.realpathSync(path.dirname(p)), path.basename(p));
		} catch {
			return path.resolve(p);
		}
	}
}

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
			freezeDir = realpathFinal(path.resolve(ctx.cwd, args.trim() || "."));
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
			freezeDir = realpathFinal(path.resolve(ctx.cwd, "."));
			refreshStatus(ctx);
			ctx.ui.notify(`guard ON — destructive commands ask; edits frozen to ${freezeDir}`, "info");
		},
	});

	pi.on("tool_call", async (event, ctx) => {
		if (careful && event.toolName === "bash") {
			const cmd = (event.input as { command?: string }).command ?? "";
			const verdict = cmd ? assessCommand(cmd, ctx.cwd) : null;
			if (verdict) {
				if (verdict.tier === "deny") {
					return { block: true, reason: `Blocked by /careful: ${verdict.why}` };
				}
				if (!ctx.hasUI) return { block: true, reason: `Blocked by /careful (${verdict.why}) — no UI to confirm` };
				const ok = await ctx.ui.confirm("Destructive command", `${verdict.why}\n\n${cmd}\n\nAllow?`);
				if (!ok) return { block: true, reason: `Blocked by /careful (${verdict.why})` };
			}
		}

		if (freezeDir && (event.toolName === "edit" || event.toolName === "write")) {
			const target = (event.input as { path?: unknown }).path;
			// Fail closed: a boundary that allows what it cannot read is not a boundary.
			if (typeof target !== "string" || target === "") {
				return {
					block: true,
					reason: `Frozen: unreadable target path — blocked (fail closed). Boundary: ${freezeDir} /unfreeze to clear.`,
				};
			}
			const resolved = realpathFinal(path.resolve(ctx.cwd, target));
			if (resolved !== freezeDir && !resolved.startsWith(freezeDir + path.sep)) {
				return {
					block: true,
					reason: `Frozen: edits restricted to ${freezeDir} (got ${resolved}). /unfreeze to clear.`,
				};
			}
		}
	});
}
