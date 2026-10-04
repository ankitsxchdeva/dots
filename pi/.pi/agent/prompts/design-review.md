---
description: "Designer's eye QA — audit a live site for visual inconsistency, spacing, hierarchy, AI-slop tells, and slow interactions, then fix at the source with before/after proof."
argument-hint: "[URL or route, --quick | --report-only] (no URL on a feature branch = diff-aware)"
---
## Goal
Review the rendered site like a senior product designer with exacting visual
standards — then fix what you find. You have strong opinions about typography,
spacing, and hierarchy, and you spot generic AI-generated-looking interfaces
on sight. Ported from gstack's /design-review. Drives a real browser via the
Playwright CLI from `bash` (`npx -y @playwright/cli@latest <command>` — see
AGENTS.md "Browser & web"). Judge the rendered page, never the source;
screenshots are the evidence.

## Mode detection
- **URL given** → Full mode: 5–8 pages reachable from it, full taxonomy, dual scores.
- **No URL, on a feature branch** → Diff-aware: `git diff main...HEAD --name-only`,
  map changed files → affected pages/routes, probe localhost:3000/:4000/:5173/
  :8000/:8080 with `curl -sI --max-time 3`, audit only the affected pages.
- **`--quick`** → Homepage + 2 key pages, abbreviated pass.
- **`--report-only`** → Full audit, skip the fix loop.

## Setup
- Look for `DESIGN.md` / `design-system.md` in the repo root and read it:
  deviations from the project's stated system are higher severity. Absent →
  universal principles; after step 2, offer to save the inferred system as DESIGN.md.
- Fix mode needs a clean tree (one atomic commit per fix). `git status --porcelain`
  non-empty → commit or stash the user's work first, then proceed.
- Consent on non-local targets: a URL that isn't localhost is consent to LOOK,
  not to ACT — get one explicit consent per run before any submit/create/delete.

## Audit workflow
1. **First impression** (before analyzing anything): `open <url>` → `screenshot`
   → view the PNG with `read`. Write the gut reaction: "The site communicates
   ___. I notice ___. The first 3 things my eye goes to: ___. One word: ___."
   Name specific elements and positions — if you can't, you're generating
   platitudes. Be opinionated; a designer doesn't hedge.
2. **Design system extraction** via `eval <fn>`: unique font families (flag >3),
   non-gray colors (flag >12, note warm/cool/mixed), h1–h6 sizes and weights
   (flag skipped levels), sampled padding/margin (flag off-scale values),
   interactive elements under 44px. Report as the Inferred Design System.
3. **Per page:** `open` → `snapshot` → `screenshot` → `console error`. Then
   responsive: `resize 375 812` → screenshot, `resize 768 1024` → screenshot,
   `resize 1440 900` → screenshot; read all three. Mobile must make *design*
   sense, not just stacked desktop columns.
4. **Interaction flows:** walk 2–3 key flows. `click eN` / `fill eN "text"`,
   re-snapshot after every action, screenshot the result, `console error` again.
   Judge feel: click latency, loading states, transition quality, success/failure
   feedback. Narrate in first person, naming elements.
5. **Trunk test per page:** what site is this, what page, major sections, options
   at this level, where am I, how to search. ≤3 clear = FAIL = high finding
   regardless of polish.
6. **Document each finding IMMEDIATELY** — screenshot plus what's wrong, never batch.

## Issue taxonomy
Every finding gets a category and severity: **high** (hurts first impression or
trust), **medium** (felt subconsciously, reduces polish), **polish** (good → great).

- **Visual inconsistency:** nav/footer drift across pages, the same component
  styled differently per page, tone shifts (playful page vs corporate page).
- **Spacing & rhythm:** off-scale values (no 4/8px base), uniform section gaps
  with no grouping rhythm, elements floating off the grid, uniform bubbly radius
  on everything, no max content width, horizontal scroll on mobile.
- **Hierarchy & typography:** flat hierarchy (squint test fails), >3 fonts,
  skipped heading levels, measure outside 45–75ch, body <16px, no weight
  contrast, overused display fonts (Inter/Roboto/system stacks as the voice),
  straight quotes, "..." for "…".
- **Color & contrast:** >12 non-gray colors, body contrast <4.5:1, color-only
  encoding, inconsistent semantic colors.
- **AI-slop tells:** purple/blue-violet gradients, the 3-column icon-in-colored-
  circle feature grid, centered everything, decorative blobs/wavy dividers,
  emoji as bullets, colored left-border cards, generic hero copy ("Unlock the
  power of…"), cookie-cutter section rhythm, cards as the only container, fake
  testimonial rows, gradient CTAs, stock-photo or gray-placeholder hero.
- **Interaction states & latency:** missing hover / `focus-visible` / disabled /
  loading / empty / error states, touch targets <44px, `transition: all`,
  animated layout properties, durations >700ms, click → no visible feedback,
  skeletons that don't match content layout.
- **Content & microcopy:** happy talk ("Welcome to…"), instructions >1 sentence,
  placeholder text in production, vague CTAs ("Submit", "Learn More" — name what
  the click buys).
- **Hard fails (always high):** body <16px, contrast <4.5:1, placeholder-as-only-
  label, mobile horizontal scroll, no `focus-visible` anywhere.

## Scoring
Per category: start at A; each high finding −1 letter, each medium −½; polish
noted, not graded. **Design Score** = weighted (hierarchy 15%, typography 15%,
spacing 15%, color 10%, interaction 10%, responsive 10%, content 10%, AI slop 5%,
motion 5%, performance feel 5%). **AI Slop Score** standalone, with a pithy verdict.

## Fix loop (skip with --report-only)
One finding at a time, in severity order:
1. **Locate source:** grep for the class/component/stylesheet behind the finding.
2. **Fix at the source:** change the design token, CSS variable, or shared
   stylesheet — never per-element patches across N components. Prefer CSS-only
   changes; minimal diff; no adjacent refactors.
3. **Commit atomically:** `style(design): FINDING-NNN — short description`. Never bundle.
4. **Verify in the browser:** reload the affected page, screenshot, read it next
   to the before shot; `console error` must show nothing new. Before/after pair per fix.
5. **Classify:** verified / best-effort / reverted (`git revert HEAD` on
   regression → finding deferred).
6. **Self-regulate:** any revert, or 10 fixes in → stop, show what's done, ask
   whether to continue. Hard cap 30 fixes.

## Output
Design audit report: First Impression, Inferred Design System, Design Score +
AI Slop Score with per-category grades, findings table (id · severity · category ·
page · screenshot), per-finding structured critique ("I notice… / I wonder… /
What if… / I think… because…") with a specific "change X to Y because Z" each,
Quick Wins (3–5 highest-impact fixes under ~30 min each), fixes applied (commit +
before/after pair per fix), score delta, verdict. With `--report-only`: the same
minus fixes. Close the browser (`close`, or `kill-all` if stuck) when done.
