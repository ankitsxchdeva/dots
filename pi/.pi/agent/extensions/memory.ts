/**
 * memory — per-project memory the agent curates, lite port of omp's memory
 * tools (feature 13: retain/recall/reflect).
 *
 * Facts live in ~/.pi/agent/memory/<project-path-slug>.md (machine-local,
 * never committed) and are injected as context at the start of every turn.
 * The agent writes facts with the `remember` tool; the user can edit or
 * delete the file directly, or say "forget X" and the agent edits it.
 *
 * Not ported: consolidation/compression stages, Hindsight/Mnemopi backends,
 * recall/reflect semantic search. Keep facts few and the file stays useful.
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

/**
 * Memory is keyed by git repo root, not cwd — worktrees and subdirectories of
 * the same project share one memory file. Falls back to cwd outside repos.
 */
let cachedKey: string | null = null;

function memoryFile(cwd: string): string {
	if (cachedKey === null) {
		cachedKey = cwd;
		try {
			const root = execSync("git rev-parse --show-toplevel", {
				cwd,
				stdio: ["ignore", "pipe", "ignore"],
			})
				.toString()
				.trim();
			if (root) cachedKey = root;
		} catch {
			// not a git repo — key by cwd
		}
	}
	const slug = cachedKey.replace(/^\//, "").replaceAll("/", "-");
	return path.join(os.homedir(), ".pi", "agent", "memory", `${slug}.md`);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "remember",
		label: "Remember",
		description:
			"Store a durable fact about this project (keyed by git repo, shared across its worktrees) " +
			"for future sessions: conventions, architecture decisions, gotchas, user preferences stated aloud. " +
			"gotchas, user preferences stated aloud. Only facts that are NOT derivable by reading the code. " +
			"Never store secrets or ephemeral task state. To correct or forget a fact, edit the memory file directly.",
		parameters: Type.Object({
			fact: Type.String({ description: "One concise fact sentence." }),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const file = memoryFile(ctx.cwd);
			fs.mkdirSync(path.dirname(file), { recursive: true });
			fs.appendFileSync(file, `- ${params.fact.trim()}\n`);
			return {
				content: [{ type: "text", text: `Remembered. Memory file: ${file}` }],
				details: {},
			};
		},
	});

	pi.registerCommand("memory", {
		description: "Show this project's memory file path and contents",
		handler: async (_args, ctx) => {
			const file = memoryFile(ctx.cwd);
			let content = "(empty)";
			try {
				content = fs.readFileSync(file, "utf8").trim() || "(empty)";
			} catch {
				// no file yet
			}
			ctx.ui.notify(`${file}\n${content}`, "info");
		},
	});

	pi.on("before_agent_start", async (_event, ctx) => {
		let content = "";
		try {
			content = fs.readFileSync(memoryFile(ctx.cwd), "utf8").trim();
		} catch {
			return; // no memory yet
		}
		if (!content) return;
		return {
			message: {
				customType: "project-memory",
				content:
					"Durable memory about this project from previous sessions " +
					"(keep it accurate with the remember tool; correct or delete facts by editing the memory file):\n" +
					content,
				display: false,
			},
		};
	});
}
