---
description: "Design finalization: turn a locked design direction into production-quality HTML/CSS — semantic, token-driven, responsive, accessible, verified in a real browser."
argument-hint: "[design spec, mockup PNG, or direction file]"
---
## Goal
Translate a chosen design direction (approved mockup, design spec, or plan
notes) into production markup. Text reflows, heights fit content, layouts
adapt — no CSS guesswork. Ported from gstack's /design-html, generalized from
its Pretext-native stack to whatever frontend the project already uses.
One page per invocation; multi-page designs run once per page.

## Step 0 — Inputs & stack detection
1. **Locate the direction.** In order: the argument path (spec/mockup/direction
   file) → an approved mockup PNG from a prior design step → plan or review
   notes in the repo → nothing (freeform: ask the user for purpose, audience,
   visual feel, content structure, reference sites). A mockup that was
   explicitly approved is locked: pixel-match it, don't redesign it.
2. **Prior output?** If a finalized HTML file from a previous run exists, ask:
   evolve it (surgical edits on top, preserving hand edits) or start fresh.
3. **Detect the stack.** Read package.json and existing CSS: framework
   (React/Svelte/Vue/vanilla), styling approach (Tailwind, CSS modules,
   design-token files, DESIGN.md). Output matches the detected stack —
   framework-native component if the project has one. No framework →
   dependency-free semantic HTML + modern CSS in a single self-contained
   file. Don't install new styling dependencies for a preview.
4. **Tokens win.** DESIGN.md / existing token files override anything
   extracted from a mockup for fonts, brand colors, spacing scale.
Report a 5-line context summary: mode, visual reference, token source,
stack, screen name.

## Step 1 — Design analysis
Build an implementation spec before writing markup:
- **From a mockup:** read the PNG with the `read` tool; extract layout
  structure, colors (hex), typography (family, weights, scale), spacing
  rhythm, component inventory.
- **From a spec/plan:** extract the same from prose — UI requirements, user
  flows, visual feel (dark/light, dense/spacious), content sections.
Output the spec: colors, fonts + weights, spacing scale, component list,
layout type. This is the contract; Step 3 must match it.

## UX doctrine (governs every layout decision)
- **Don't make me think.** Self-evident pages; no puzzles. Omit half the
  words, then half again. Happy talk and instructions die first.
- **Users scan, satisfice, muddle through.** Design billboards, not
  brochures: hierarchy by prominence, scannable headings/lists, the right
  choice is the most visible choice.
- **Conventions over cleverness.** Logo top-left, predictable nav, obvious
  clickability without hover (mobile has none). Clarity trumps consistency.
- **Wayfinding.** Persistent nav answers: what site, what page, what
  sections, where am I. Pass the trunk test.
- **Goodwill reservoir.** Never hide pricing/contact, punish input formats,
  or gate content behind splash/interstitials.
- **Mobile = same rules, higher stakes.** 44px touch targets, visible
  affordances, ruthless prioritization.

## Step 2 — Generate the markup
Write one file. Vanilla output goes to a self-contained `.html`; framework
output to a component in the project's conventions. Always:
- Semantic HTML5 landmarks: `<header> <nav> <main> <section> <footer>`,
  correct heading hierarchy, ARIA where semantics fall short.
- Design tokens as CSS custom properties (`--color-*`, `--space-*`,
  `--font-*`) at `:root`, used everywhere — no hardcoded values scattered
  through rules.
- Typographic fidelity to the spec: real families via `<link>` or the
  project's font setup, correct weights, line-height, measure (~45–75ch).
- Responsive behavior at 375 / 768 / 1024 / 1440 — fluid type and layout
  (clamp(), grid, container queries), not a desktop layout with breakpoints
  bolted on.
- Accessibility baseline: contrast ≥ 4.5:1 body / 3:1 large text,
  `:focus-visible` styles, `prefers-reduced-motion` respected,
  `prefers-color-scheme` dark mode when the spec implies one, alt text.
- Real content from the mockup/spec/project — never lorem ipsum, "Your text
  here", or gray placeholder boxes.
**Slop blacklist** (unless the locked direction or DESIGN.md explicitly
contains it — then say the tradeoff once): purple/blue default gradients,
gradient text, generic 3-col feature grids, identical nested cards,
center-everything layouts, kickers above headings, hero metric rows,
decorative blobs/waves, pulsing dots, stock-photo placeholder divs,
"Get Started"/"Learn More" CTAs, rounded-shadow cards as the default
component, emoji as visual elements, cookie-cutter split heroes.

## Step 3 — Verify in a real browser
Never declare done from code alone. Drive the Playwright CLI from `bash`
(`npx -y @playwright/cli@latest <command>` — AGENTS.md "Browser & web"):
1. `open file://<path>` (or the dev-server URL for framework output).
2. `console error` — JS errors are bugs; fix before continuing.
3. `screenshot` at desktop (saves PNG under `.playwright-cli/`), view with
   the `read` tool; compare against the mockup/spec. `resize 375 812`,
   screenshot again; also check 768.
4. Look for: text overflow, layout collapse/overlap, responsive breakage,
   contrast failures, missing focus states, spec mismatches.
5. Fix at the source, re-screenshot, repeat until all viewports are clean.
`close` the browser when done (`kill-all` if stuck).

## Step 4 — Refinement loop
Present the verified page (live URL or file path) and iterate on feedback:
- Surgical `edit` changes only — never regenerate the whole file; the user
  may have made hand edits.
- One change set per round; re-run the Step 3 verification after each.
- Max ~10 rounds, then ask whether to continue or call it done.

## Important rules
- **Source-of-truth fidelity over code elegance.** An approved mockup means
  pixel-match — `width: 312px` is correct if that's what it shows. In
  spec/freeform mode, user feedback in the loop is the source of truth.
- Simplest output that serves the project: match its stack, add nothing new
  unless asked.
- Report at the end: file path, verification evidence (screenshots viewed,
  viewports checked), what's left. DONE means browser-verified, not "should
  look right".
