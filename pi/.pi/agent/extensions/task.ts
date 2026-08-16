/**
 * task — subagent fan-out, lite port of omp's `task` tool (feature 05).
 *
 * Spawns a fresh `pi -p` subprocess per assignment and returns its final text.
 * Subagents get full tools (read/edit/write/bash) except `task` itself
 * (recursion guard) and run with --no-session so they don't clutter /resume.
 *
 * Fan out by issuing several task calls in one message — pi executes sibling
 * tool calls concurrently.
 *
 * Worker directives below are from
 *   ~/src/oh-my-pi/packages/coding-agent/src/prompts/agents/task.md
 * (re-check upstream with omp-sync.sh). Not ported: worktree isolation,
 * typed/schema results, Agent Hub, irc coordination.
 */

import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const WORKER_DIRECTIVES = `Worker agent: delegated tasks.

Tools: FULL access (edit, write, bash, grep, read, etc.); MUST use as needed to complete task.
MUST hyperfocus assigned task; NEVER deviate.

- MUST finish assigned work only; return minimum useful result; do not repeat filesystem writes.
- SHOULD edit files, run commands, create files when task requires.
- MUST be concise; NEVER filler, repetition, tool transcripts. The caller cannot see your tools; your final message is notes for the caller, not a summary for a human.
- SHOULD prefer narrow lookups (grep/glob), then read needed ranges only; ignore beyond current scope.
- AVOID full-file reads unless necessary.
- SHOULD prefer editing existing files over creating new files.
- NEVER create documentation files (*.md) unless explicitly requested.
- Skip verification gates, linters, and formatters unless the assignment explicitly asks for them; the caller verifies centrally.`;

function runPi(args: string[], signal: AbortSignal | undefined): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn("pi", args, { stdio: ["ignore", "pipe", "pipe"] });
		let out = "";
		let err = "";
		child.stdout.on("data", (d) => (out += d));
		child.stderr.on("data", (d) => (err += d));
		const onAbort = () => child.kill("SIGTERM");
		signal?.addEventListener("abort", onAbort, { once: true });
		child.on("error", (e) => {
			signal?.removeEventListener("abort", onAbort);
			reject(e);
		});
		child.on("close", (code) => {
			signal?.removeEventListener("abort", onAbort);
			if (code === 0) resolve(out.trim() || "(subagent produced no output)");
			else reject(new Error(`subagent exited ${code}: ${err.trim().slice(0, 500)}`));
		});
	});
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "task",
		label: "Subagent",
		description:
			"Run a self-contained assignment in a fresh subagent (separate pi session with read/edit/write/bash tools). " +
			"Returns only the subagent's final report. Subagents share no context with you or each other — every prompt " +
			"must be fully self-contained: goal, explicit target paths, constraints, acceptance criteria. " +
			"Use for substantial or parallelizable work; fan out multiple task calls in one message to run in parallel. " +
			"Make trivial edits inline instead.",
		parameters: Type.Object({
			prompt: Type.String({
				description: "Complete self-contained assignment for the subagent.",
			}),
			model: Type.Optional(
				Type.String({
					description: "Model override for the subagent (e.g. 'k3'). Default: the configured default model.",
				}),
			),
		}),
		async execute(_toolCallId, params, signal) {
			const args = [
				"-p",
				"--no-session",
				"--exclude-tools",
				"task,remember",
				"--append-system-prompt",
				WORKER_DIRECTIVES,
			];
			if (params.model) args.push("--model", params.model);
			args.push(params.prompt);
			const text = await runPi(args, signal);
			return { content: [{ type: "text", text }], details: {} };
		},
	});
}
