---
description: QA the app in a real browser — find bugs with screenshot evidence, fix them (or report only), verify, regression-test.
argument-hint: "[URL | --quick | --report-only] (no URL on a feature branch = diff-aware)"
---
## Goal
Test the app like a QA lead with a real browser: find bugs, prove them with
evidence, and (unless `--report-only`) fix them with regression tests. Ported
from gstack's /qa. Drives a real browser via the Playwright CLI from `bash`
(`npx -y @playwright/cli@latest <command>` — see AGENTS.md "Browser & web").
Never judge from HTML alone.

## Mode detection
- **URL given** → Full mode: systematic exploration, 5–10 well-evidenced
  issues, health score.
- **No URL, on a feature branch** → Diff-aware (primary mode):
  1. `git diff main...HEAD --name-only` and `git log main..HEAD --oneline`.
  2. Map changed files → affected pages/routes (controllers → paths, views →
     pages, models → pages using them, API files → direct endpoints).
  3. Find the running app: try localhost:3000, :4000, :5173, :8000, :8080 with
     `open`. Nothing? Ask for the URL.
  4. Test each affected page + adjacent regressions, cross-referencing commit
     messages for *intent* — verify the change does what it claims.
  5. No obvious routes from the diff → don't skip the browser; smoke-test
     homepage + top 5 nav targets.
- **`--quick`** → 30-second smoke: homepage + top 5 nav, console errors, broken
  links, health score.

## Workflow
1. **Orient:** `open <url>` → `snapshot` (read the page as a
   user sees it) → `console error`. Map navigation via
   snapshot links/buttons. Detect framework (Next/Rails/SPA…) for the report.
2. **Authenticate (if needed):** fill the login form via snapshot refs. Never
   put real passwords in the report. 2FA/CAPTCHA → ask the user to complete it.
3. **Explore per page,** deeper on core flows (signup, checkout, dashboard,
   search) than secondary pages:
   - Visual scan — `screenshot` for layout issues (saves a PNG under
     `.playwright-cli/`; view it with the `read` tool).
   - Interactive elements — click buttons/links; do they work?
   - Forms — submit empty, invalid, edge-case input.
   - Navigation — paths in and out; dead links.
   - States — empty, loading, error, overflow (47-char names!).
   - Console — new JS errors after each interaction.
   - Responsiveness — `resize 375 812`, screenshot, back to 1280x720.
4. **Document each issue IMMEDIATELY when found** (never batch):
   - Interactive bug: screenshot before → action → screenshot result →
     `snapshot` after. Repro steps referencing evidence.
   - Static bug: single screenshot + what's wrong.
   Severity: critical (data loss/security/broken core flow), high (feature
   broken, workaround exists), medium (degraded UX), low (cosmetic).
5. **Fix loop** (skip with `--report-only`): one bug at a time, atomic commit
   per fix, **regression test for every fix** (fails without, passes with),
   re-verify in the browser. Fix at the source; don't patch symptoms.
6. **Wrap up:** health score (console 15%, broken links 15%, forms/flows 25%,
   visual/UX 20%, states/edge cases 15%, mobile 10% — 0 errors=100, 1–3=70,
   4–10=40, 10+=10 per category, weighted), Top 3 Things to Fix, console health
   summary, metadata (date, duration, pages visited, framework).

## Output
QA report: health score, issues table (id · severity · category · page ·
evidence), per-issue repro with screenshots, fixes applied (commit + test
per fix), Top 3, verdict. With `--report-only`: the same minus fixes.
Close the browser (`close`, or `kill-all` if stuck) when done.
