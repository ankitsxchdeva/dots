/**
 * playwright-mcp — bridge the official Playwright MCP server into pi as
 * native `browser_*` tools, giving the agent real eyes: navigate, read the
 * accessibility tree, click, type, screenshot — instead of guessing from HTML.
 *
 * Spawns `npx -y @playwright/mcp@latest --headless --isolated` lazily on the
 * first browser tool call (nothing runs at session start). The browser is
 * headless Chromium with an in-memory profile. First-ever use downloads the
 * package and the Chromium binary — expect a slow first call.
 *
 * Tool loop taught to the model: navigate → snapshot (a11y tree with refs)
 * → act (click/type/fill with a ref) → re-snapshot. Screenshot when layout
 * matters.
 *
 * Registered tools are a static, curated subset of the upstream tool list.
 * On first connect the bridge diffs registered names against the server's
 * `tools/list` and warns on drift (sync-upstreams.sh covers the repo side).
 */

import { spawn, type ChildProcess } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Type, type TSchema } from "typebox";

// ---------------------------------------------------------------------------
// Minimal MCP stdio client (newline-delimited JSON-RPC 2.0)
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;

interface McpToolResult {
	content?: Array<{ type: string; text?: string; data?: string; mimeType?: string }>;
	isError?: boolean;
}

class McpClient {
	private child: ChildProcess | null = null;
	private buf = "";
	private nextId = 1;
	private pending = new Map<number, { resolve: (v: Json) => void; reject: (e: Error) => void }>();
	private stderrTail = "";

	async connect(): Promise<string[]> {
		this.child = spawn(
			"npx",
			["-y", "@playwright/mcp@latest", "--headless", "--isolated"],
			{ stdio: ["pipe", "pipe", "pipe"] },
		);
		this.child.stdout!.setEncoding("utf8");
		this.child.stdout!.on("data", (d: string) => this.onData(d));
		this.child.stderr!.setEncoding("utf8");
		this.child.stderr!.on("data", (d: string) => {
			this.stderrTail = (this.stderrTail + d).slice(-1000);
		});
		this.child.on("exit", () => this.failAll(new Error(`playwright-mcp exited. ${this.stderrTail}`)));

		await this.request("initialize", {
			protocolVersion: "2024-11-05",
			capabilities: {},
			clientInfo: { name: "pi-playwright-bridge", version: "0.1.0" },
		});
		this.notify("notifications/initialized", {});
		const list = (await this.request("tools/list", {})) as { tools?: Array<{ name: string }> };
		return (list.tools ?? []).map((t) => t.name);
	}

	private onData(d: string): void {
		this.buf += d;
		for (;;) {
			const idx = this.buf.indexOf("\n");
			if (idx < 0) return;
			const line = this.buf.slice(0, idx).trim();
			this.buf = this.buf.slice(idx + 1);
			if (!line) continue;
			let msg: Json;
			try {
				msg = JSON.parse(line) as Json;
			} catch {
				continue;
			}
			const id = msg.id as number | undefined;
			if (id != null && this.pending.has(id)) {
				const p = this.pending.get(id)!;
				this.pending.delete(id);
				const err = msg.error as { message?: string } | undefined;
				if (err) p.reject(new Error(err.message ?? JSON.stringify(err)));
				else p.resolve((msg.result ?? {}) as Json);
			}
		}
	}

	private send(obj: Json): void {
		this.child?.stdin?.write(`${JSON.stringify(obj)}\n`);
	}

	private request(method: string, params: Json): Promise<Json> {
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.send({ jsonrpc: "2.0", id, method, params });
		});
	}

	private notify(method: string, params: Json): void {
		this.send({ jsonrpc: "2.0", method, params });
	}

	callTool(name: string, args: Json): Promise<McpToolResult> {
		return this.request("tools/call", { name, arguments: args }) as Promise<McpToolResult>;
	}

	private failAll(e: Error): void {
		for (const p of this.pending.values()) p.reject(e);
		this.pending.clear();
	}

	dispose(): void {
		try {
			this.child?.kill();
		} catch {
			// already gone
		}
		this.child = null;
		this.failAll(new Error("playwright-mcp disposed"));
	}
}

// ---------------------------------------------------------------------------
// Static tool definitions (subset of @playwright/mcp tools)
// ---------------------------------------------------------------------------

const EL = {
	element: Type.String({ description: "Human-readable element description used for the permission check and error messages, e.g. 'Login button'" }),
	ref: Type.String({ description: "Exact element ref from the latest browser_snapshot, e.g. 'e5'" }),
};

interface ToolDef {
	description: string;
	parameters: TSchema;
}

const TOOLS: Record<string, ToolDef> = {
	browser_navigate: {
		description: "Navigate the browser to a URL. Always follow with browser_snapshot to read the page.",
		parameters: Type.Object({ url: Type.String({ description: "Absolute URL to navigate to" }) }),
	},
	browser_navigate_back: {
		description: "Go back to the previous page.",
		parameters: Type.Object({}),
	},
	browser_snapshot: {
		description:
			"Read the page as an accessibility tree (text). This is the primary way to SEE the page: it lists every " +
			"interactive element with a ref (e.g. 'e5') that you pass to browser_click/browser_type/browser_fill_form. " +
			"Take a fresh snapshot after every action — refs go stale.",
		parameters: Type.Object({}),
	},
	browser_take_screenshot: {
		description:
			"Take a screenshot of the current page (returns an image). Use when layout, design, or visual state matters — " +
			"the snapshot tells you structure, the screenshot tells you what it looks like.",
		parameters: Type.Object({
			fullPage: Type.Optional(Type.Boolean({ description: "Capture the full scrollable page (default false)" })),
			element: Type.Optional(Type.String({ description: "Element description (with ref) to capture only that element" })),
			ref: Type.Optional(Type.String({ description: "Ref of the element to capture" })),
		}),
	},
	browser_click: {
		description: "Click an element. Get element + ref from a fresh browser_snapshot.",
		parameters: Type.Object({
			...EL,
			doubleClick: Type.Optional(Type.Boolean({ description: "Double-click instead of single click" })),
			button: Type.Optional(Type.Union([Type.Literal("left"), Type.Literal("right"), Type.Literal("middle")])),
		}),
	},
	browser_type: {
		description: "Type text into an editable element. For forms with several fields prefer browser_fill_form.",
		parameters: Type.Object({
			...EL,
			text: Type.String({ description: "Text to type" }),
			submit: Type.Optional(Type.Boolean({ description: "Press Enter after typing" })),
		}),
	},
	browser_fill_form: {
		description: "Fill multiple form fields in one call, then snapshot before submitting.",
		parameters: Type.Object({
			fields: Type.Array(
				Type.Object({
					name: Type.String({ description: "Field label/description" }),
					ref: Type.String({ description: "Field ref from browser_snapshot" }),
					type: Type.Union([
						Type.Literal("textbox"),
						Type.Literal("checkbox"),
						Type.Literal("radio"),
						Type.Literal("combobox"),
						Type.Literal("slider"),
					]),
					value: Type.String({ description: "Value to set ('true'/'false' for checkbox)" }),
				}),
			),
		}),
	},
	browser_select_option: {
		description: "Select option(s) in a <select> dropdown.",
		parameters: Type.Object({ ...EL, values: Type.Array(Type.String(), { description: "Option values to select" }) }),
	},
	browser_hover: {
		description: "Hover over an element (reveals menus/tooltips).",
		parameters: Type.Object({ ...EL }),
	},
	browser_press_key: {
		description: "Press a keyboard key, e.g. 'Enter', 'Escape', 'Tab', 'ArrowDown', or 'a'.",
		parameters: Type.Object({ key: Type.String({ description: "Key name" }) }),
	},
	browser_evaluate: {
		description:
			"Run JavaScript on the page and return the result as JSON. Use for data extraction the snapshot can't give " +
			"(computed styles, scroll positions, API payloads).",
		parameters: Type.Object({
			function: Type.String({ description: "JS function body, e.g. '() => document.title'" }),
		}),
	},
	browser_console_messages: {
		description: "Get browser console messages. Check after page loads and interactions — JS errors are bugs.",
		parameters: Type.Object({
			level: Type.Optional(
				Type.Union([Type.Literal("error"), Type.Literal("warning"), Type.Literal("info"), Type.Literal("debug")], {
					description: "Minimum level to return (default: info)",
				}),
			),
		}),
	},
	browser_network_requests: {
		description: "Get network requests the page made (URL, method, status). Useful for debugging failed API calls.",
		parameters: Type.Object({
			includeStatic: Type.Optional(Type.Boolean({ description: "Include static assets (default false)" })),
		}),
	},
	browser_wait_for: {
		description: "Wait for text to appear/disappear or a fixed time — use after navigations and async actions.",
		parameters: Type.Object({
			text: Type.Optional(Type.String({ description: "Wait until this text appears" })),
			textGone: Type.Optional(Type.String({ description: "Wait until this text disappears" })),
			time: Type.Optional(Type.Number({ description: "Seconds to wait" })),
		}),
	},
	browser_resize: {
		description: "Resize the viewport, e.g. 375x812 to check mobile layout, 1280x720 for desktop.",
		parameters: Type.Object({
			width: Type.Number({ description: "Viewport width px" }),
			height: Type.Number({ description: "Viewport height px" }),
		}),
	},
	browser_tabs: {
		description: "List, open, close, or switch browser tabs.",
		parameters: Type.Object({
			action: Type.Union([Type.Literal("list"), Type.Literal("new"), Type.Literal("close"), Type.Literal("select")]),
			index: Type.Optional(Type.Number({ description: "Tab index for close/select (from action=list)" })),
		}),
	},
	browser_close: {
		description: "Close the browser page. Call when done browsing to free resources.",
		parameters: Type.Object({}),
	},
};

// ---------------------------------------------------------------------------
// Extension
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI) {
	let client: McpClient | null = null;
	let connecting: Promise<void> | null = null;

	function ensureConnected(ctx: ExtensionContext): Promise<void> {
		if (client) return Promise.resolve();
		connecting ??= (async () => {
			const c = new McpClient();
			const upstream = await c.connect();
			client = c;
			const missing = Object.keys(TOOLS).filter((n) => !upstream.includes(n));
			if (missing.length > 0 && ctx.hasUI) {
				ctx.ui.notify(`playwright-mcp: tools missing upstream: ${missing.join(", ")}`, "warning");
			}
		})();
		connecting.catch(() => {
			connecting = null; // allow retry on next call
		});
		return connecting;
	}

	pi.on("session_shutdown", async () => {
		client?.dispose();
		client = null;
		connecting = null;
	});

	for (const [name, def] of Object.entries(TOOLS)) {
		pi.registerTool({
			name,
			label: name.replace(/^browser_/, "browser: "),
			description: def.description,
			parameters: def.parameters,
			async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
				try {
					await ensureConnected(ctx);
				} catch (e) {
					const msg = e instanceof Error ? e.message : String(e);
					return {
						content: [
							{
								type: "text" as const,
								text:
									`Failed to start the Playwright MCP server: ${msg}\n` +
									"Requires node/npx. First run downloads @playwright/mcp and Chromium — retry can take minutes.",
							},
						],
						details: {},
						isError: true,
					};
				}
				try {
					const result = await client!.callTool(name, params as Json);
					const content = (result.content ?? [])
						.map((c) => {
							if (c.type === "text") return { type: "text" as const, text: c.text ?? "" };
							if (c.type === "image" && c.data && c.mimeType)
								return { type: "image" as const, data: c.data, mimeType: c.mimeType };
							return null;
						})
						.filter((c): c is NonNullable<typeof c> => c !== null);
					return {
						content: content.length > 0 ? content : [{ type: "text" as const, text: "(no output)" }],
						details: {},
						isError: result.isError ?? false,
					};
				} catch (e) {
					// Connection died mid-session — reset so the next call respawns.
					client?.dispose();
					client = null;
					connecting = null;
					const msg = e instanceof Error ? e.message : String(e);
					return {
						content: [{ type: "text" as const, text: `browser tool failed: ${msg}` }],
						details: {},
						isError: true,
					};
				}
			},
		});
	}
}
