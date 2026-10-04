---
description: "Design shotgun — generate N genuinely-different HTML design variants, open a comparison board, collect structured feedback, iterate to a chosen direction."
argument-hint: "[page or component to explore variants of]"
---
## Goal
Visual brainstorming, not review: generate N distinct design directions as
self-contained HTML variants, present them side-by-side in the browser, collect
structured feedback, and iterate until one direction wins. Ported from gstack's
/design-shotgun.

## Step 0 — Lock the brief (before ANY variant)
Variants are only comparable when they answer the same brief. Gather:
1. **Who** — audience, expertise level.
2. **Job to be done** — what the user accomplishes on this screen.
3. **What exists** — components, pages, patterns already in the codebase.
4. **User flow** — how users arrive, where they go next.
5. **Edge cases** — long names, zero results, errors, mobile, first run.

Auto-gather first: `DESIGN.md`, `PRODUCT.md`, `ls src/ app/ pages/ components/`,
prior `approved.md` files under `.design-shotgun/`. DESIGN.md is the default
constraint — say so: "I'll follow DESIGN.md unless you want to go off the
reservation." For the "I don't like how THIS looks" case: ask for the URL
(never guess) and screenshot it (`open <url>` → `screenshot`) as the
evolve-from reference. Missing answers: ask ONE question at a time, two rounds
max, then proceed with stated assumptions.

## Design doctrine (governs every direction)
- Don't make me think: self-evident beats self-explanatory. Omit half the words, then half again.
- Users scan and satisfice: prominence = importance; make the right choice the most visible one.
- Use conventions (logo top-left, search = magnifier); innovate only when you know you have better.
- Clickable must look clickable — no hover-to-discover; 44px touch targets on mobile.
- Fix noise by removal, not addition. When clarity and consistency conflict, choose clarity.

## Step 1 — N distinct concepts, confirmed before building
Default 3 variants (up to 8 for important screens). Present a lettered list —
one line per direction — and confirm before writing any HTML; text is cheap to
change, markup isn't. Max 2 re-presents.

**Anti-convergence directive:** each concept is a separate creative direction,
not a shade of one idea. Vary layout concept, type, density, and mood. With a
DESIGN.md, keep its fonts and palette and vary layout and composition; without
one, vary font family, palette, and layout approach. Test: if the headline
could be swapped between two variants without anyone noticing, they're too
similar — rework the weaker one. Variants should feel like separate design
teams made them.

## Step 2 — Generate variants (parallel when possible)
Scratch dir: `.design-shotgun/<screen>-<YYYYMMDD>/`. Each variant is ONE
self-contained HTML file (inline CSS, no external assets, realistic copy — no
lorem ipsum): `variant-A.html`, `variant-B.html`, …

Fan out one `task` subagent per variant in a single message; each prompt carries
the locked brief, its concept, the doctrine above, the DESIGN.md constraints,
and the absolute output path. Without `task`, build them sequentially yourself.
Report per variant: DONE + path or FAILED + error — never skip silently.

Then screenshot every variant and eyeball it:
```
npx -y @playwright/cli@latest open file://<abs path>/variant-A.html
npx -y @playwright/cli@latest screenshot
```
PNGs land under `.playwright-cli/` in cwd — copy them into the scratch dir and
view each with the `read` tool. A variant that renders broken gets one rebuild.

## Step 3 — Comparison board
Write `index.html` in the scratch dir: one section per variant — concept name,
one-line description, screenshot (or an iframe of the variant HTML) linking to
the full file. Open it for the user: `open file://<abs path>/index.html`. Also
show the screenshots inline via `read`, so everything is visible without
leaving the terminal.

## Step 4 — Structured feedback (1–2 rounds)
Present the numbered variant list, then ask ONE question at a time:
1. Which direction wins?
2. What to keep from it, what to kill?
3. Anything to steal from the losers (remix: layout from A, colors from B)?

Apply the feedback to the winner, rebuild, re-screenshot, refresh the board,
ask again. Converge in 1–2 rounds. Still diverging after two? Stop, summarize
where taste is split, and let the user decide.

## Step 5 — Write up the winner
Before saving, confirm your understanding back: preferred variant, keep/kill
list, remix notes. Then write `approved.md` in the scratch dir: chosen
direction, why it fits the brief, feedback summary, keep/kill rationale.
Durable taste signal worth reusing (fonts, palette, density)? Store it with
`remember`. Offer next steps: iterate more / implement it / done.

## Rules
- Brief lock before generating; concept confirmation before building.
- DESIGN.md is the default constraint unless the user says otherwise.
- ONE question at a time; two rounds max for context and for feedback.
- Show variants inline, not just on the board.
- Confirm feedback before saving the decision.
