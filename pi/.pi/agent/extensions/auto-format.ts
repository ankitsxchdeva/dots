/**
 * auto-format — run the right formatter on a file right after pi edits it.
 * Port of the Claude Code PostToolUse(Edit|Write) hook. Best-effort: if the
 * formatter isn't installed, skip silently. Never blocks or fails the tool.
 *
 * Opinionated formatters (prettier, black, clang-format, shfmt) only run when
 * the repo opts in with a config file — a whole-file reformat in a project
 * that doesn't use them just makes noisy diffs. gofmt/rustfmt are their
 * languages' standards, so they always run.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** First of `names` found in `dir` or an ancestor, else null. */
function findUp(dir: string, names: string[]): string | null {
	let d = dir;
	for (;;) {
		for (const n of names) {
			const p = path.join(d, n);
			if (fs.existsSync(p)) return p;
		}
		const parent = path.dirname(d);
		if (parent === d) return null;
		d = parent;
	}
}

function has(cmd: string): boolean {
	try {
		execFileSync("which", [cmd], { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

function run(cmd: string, args: string[]): void {
	try {
		execFileSync(cmd, args, { stdio: "ignore" });
	} catch {
		// formatter failed — leave the file as written
	}
}

const PRETTIER_CONFIGS = [
	".prettierrc",
	".prettierrc.json",
	".prettierrc.yml",
	".prettierrc.yaml",
	".prettierrc.js",
	".prettierrc.cjs",
	".prettierrc.toml",
	"prettier.config.js",
	"prettier.config.cjs",
];

function format(file: string): void {
	if (!fs.existsSync(file)) return;
	const dir = path.dirname(path.resolve(file));

	switch (path.extname(file)) {
		case ".go":
			if (has("gofmt")) run("gofmt", ["-w", file]);
			break;
		case ".rs":
			if (has("rustfmt")) run("rustfmt", [file]);
			break;
		case ".py": {
			const cfg = findUp(dir, ["pyproject.toml"]);
			if (
				cfg &&
				/^\[tool\.black\]/m.test(fs.readFileSync(cfg, "utf8")) &&
				has("black")
			)
				run("black", ["-q", file]);
			break;
		}
		case ".sh":
			// shfmt reads .editorconfig
			if (findUp(dir, [".editorconfig"]) && has("shfmt")) run("shfmt", ["-w", file]);
			break;
		case ".c":
		case ".h":
		case ".cpp":
		case ".hpp":
		case ".cc":
			if (findUp(dir, [".clang-format", "_clang-format"]) && has("clang-format"))
				run("clang-format", ["-i", file]);
			break;
		case ".js":
		case ".ts":
		case ".tsx":
		case ".jsx":
		case ".json":
		case ".css":
		case ".html":
		case ".md": {
			let optedIn = !!findUp(dir, PRETTIER_CONFIGS);
			if (!optedIn) {
				const pkg = findUp(dir, ["package.json"]);
				if (pkg) {
					try {
						optedIn = fs.readFileSync(pkg, "utf8").includes('"prettier"');
					} catch {
						// unreadable package.json — not opted in
					}
				}
			}
			if (optedIn && has("prettier")) run("prettier", ["-w", file]);
			break;
		}
	}
}

export default function (pi: ExtensionAPI) {
	pi.on("tool_result", async (event) => {
		if (event.isError) return;
		if (event.toolName !== "edit" && event.toolName !== "write") return;
		const file = (event.input as { path?: string }).path;
		if (file) format(file);
	});
}
