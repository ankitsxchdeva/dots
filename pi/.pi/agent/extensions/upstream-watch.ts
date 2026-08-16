/**
 * upstream-watch — surface upstream updates at session start.
 *
 * Reads ~/.pi/agent/upstream-status.json (written daily by the
 * local.pi-upstream-watch launchd agent running check-updates.sh) and shows
 * one notice when the reference clones we port from — or pi itself — are
 * behind. Read-only; never pulls. Companion skill: upstream-watch.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const STATUS_FILE = path.join(os.homedir(), ".pi", "agent", "upstream-status.json");
const STALE_DAYS = 3;

interface RepoStatus {
	behind?: number;
	latest?: string;
	error?: string;
}

interface Status {
	checked?: string;
	repos?: Record<string, RepoStatus>;
	piHomebrew?: { outdated?: boolean; info?: string };
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (event, ctx) => {
		if (event.reason !== "startup" || !ctx.hasUI) return;

		let status: Status;
		try {
			status = JSON.parse(fs.readFileSync(STATUS_FILE, "utf8")) as Status;
		} catch {
			return; // no status file yet — the launchd job hasn't run
		}

		// If the status file is old, the daily job probably isn't running.
		if (status.checked) {
			const ageDays = (Date.now() - Date.parse(status.checked)) / 86_400_000;
			if (ageDays > STALE_DAYS) {
				ctx.ui.notify(
					`upstream-watch: status is ${Math.floor(ageDays)}d old — is the launchd job loaded? (launchctl list | grep upstream-watch)`,
					"warning",
				);
				return;
			}
		}

		const behind: string[] = [];
		for (const [name, info] of Object.entries(status.repos ?? {})) {
			if (info.behind && info.behind > 0) behind.push(`${name} +${info.behind}`);
		}
		if (status.piHomebrew?.outdated) behind.push("pi itself (brew upgrade pi-coding-agent)");

		if (behind.length > 0) {
			ctx.ui.notify(
				`Upstream updates: ${behind.join(", ")} — /skill:upstream-watch to review, ~/.dots/sync-upstreams.sh to pull`,
				"warning",
			);
		}
	});
}
