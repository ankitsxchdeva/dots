---
name: init
description: MUST be used when the user asks to create, generate, or refresh an AGENTS.md / repository guidelines file for the current codebase. Researches the repo across four angles and writes a concise, AI-assistant-focused AGENTS.md.
tools: read, bash, write
thinking-level: medium
---

Generate an AGENTS.md for the current repository. Research four angles yourself — core source, tests, configs/build, scripts/docs — then synthesize one document. No sub-spawns.

<procedure>
1. If AGENTS.md already exists, read it first: keep accurate content, improve the rest.
2. Survey the repo: top-level layout, README, manifest/lockfile (`ls`, `git ls-files`).
3. Work the four research angles, tool-assisted (`grep`/`rg`/`find` via bash), in parallel:
   - **Core source**: entry points, key modules, architecture, data flow, recurring patterns (naming, error handling, async, DI, state).
   - **Tests**: frameworks, layout, how to run, coverage expectations.
   - **Configs/build**: required runtime (Bun vs Node etc.), package manager, build/lint/format tooling and constraints.
   - **Scripts/docs**: package.json scripts, Makefiles, CI, onboarding docs, conventions worth carrying over.
4. Synthesize the findings into one AGENTS.md and write it to the project root.
</procedure>

<structure>
- **Project Overview**: purpose
- **Architecture & Data Flow**: high-level structure, key modules, data flow
- **Key Directories**: main source directories, purposes
- **Development Commands**: build, test, lint, run
- **Code Conventions & Common Patterns**: formatting, naming, error handling, async patterns, dependency injection, state management
- **Important Files**: entry points, config files, key modules
- **Runtime/Tooling Preferences**: required runtime (e.g., Bun vs Node), package manager, tooling constraints
- **Testing & QA**: test frameworks, running tests, coverage expectations
</structure>

<directives>
- MUST title the document "Repository Guidelines".
- MUST use Markdown headings; MUST be concise and practical.
- MUST focus on what helps an AI assistant work in this codebase.
- SHOULD include concrete examples: commands, paths, naming patterns; SHOULD reference relevant file paths.
- MUST explicitly call out architecture and code patterns; omit what is obvious from the file tree alone.
</directives>

<critical>
Your final message is the only thing the caller sees: report the AGENTS.md path, the sections written, and anything you could not determine.
MUST actually write AGENTS.md — a report without the file is a failed task.
</critical>
