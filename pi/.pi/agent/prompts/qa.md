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
  3. Find the running app: probe localhost:3000, :4000, :5173, :8000, :8080
     with `curl -sI --max-time 3`, then `open` the one that answers. Nothing?
     Ask for the URL.
  4. Test each affected page + adjacent regressions, cross-referencing commit
     messages for *intent* — verify the change does what it claims.
  5. No obvious routes from the diff → don't skip the browser; smoke-test
     homepage + top 5 nav targets.
- **Target has no browser surface** (diff/target is an API, CLI, job,
  worker, or webhook) → Functional mode: probe with the repo's own
  documented commands/clients (README examples, `--help`, Makefile targets)
  instead of forcing the browser. Contract checklist: success + durable
  effect, invalid input, auth, exit code/stdout/stderr checked separately,
  state transitions, retry/idempotency, partial-failure recovery. Report
  pass/fail/blocked per contract — never a health score.
- **`--quick`** → 30-second smoke: homepage + top 5 nav, console errors, broken
  links, health score.

## Test framework
Before running any test command, read AGENTS.md, CLAUDE.md, and TESTING.md
first — if one documents a test command, that's the answer: no detection, use
it. Otherwise gather markers. Markers (config files, lockfiles, declared test
scripts, test deps) are EVIDENCE for the question you ask — never a command to
run blind. NEVER probe-run a guessed command: a probe on a project that never
had that runner fails loudly and teaches nothing, and installing a second
framework beside a working one is worse. Map markers to the command to OFFER:

| Marker | Candidate command |
|--------|-------------------|
| `manage.py` | `python manage.py test` (`pytest` if pytest-django is in deps) |
| `pytest.ini` / pytest in `pyproject.toml` | `pytest` |
| `go.mod` | `go test ./...` |
| `Cargo.toml` | `cargo test` |
| `pom.xml` / `build.gradle` | `mvn test` / `./gradlew test` |
| `Gemfile` / `.rspec` | `bundle exec rspec`, `bin/rails test`, or `rake test` |
| `package.json` with a test script | that script, via the lockfile's package manager |
| `Makefile` with a `test:` target | `make test` |

Any existing-test evidence (a marker above, or test files in the repo) means
the project already has tests — don't bootstrap. Get the command from the docs
or ask, offering the candidates above, and persist the chosen command (an
AGENTS.md/CLAUDE.md `## Testing` section) so it's never asked again. Absent
config files are NOT "no tests": Django keeps tests in `<app>/tests.py`, Go in
`*_test.go` beside the source, Rust in `#[test]` blocks inside `src/`. No test
evidence at all → say so and ask before installing anything.

## Workflow
1. **Orient:** `open <url>` → `snapshot` (read the page as a
   user sees it) → `console error`. Map navigation via
   snapshot links/buttons. Detect framework (Next/Rails/SPA…) for the report.
2. **Authenticate (if needed):** fill the login form via snapshot refs. Never
   put real passwords in the report. 2FA/CAPTCHA → ask the user to complete it.
3. **Explore per page,** deeper on core flows (signup, checkout, dashboard,
   search) than secondary pages. Establish the success baseline first — the
   expected result/state of the happy path, not just "page loaded" — before
   challenging inputs:
   - Visual scan — `screenshot` for layout issues (saves a PNG under
     `.playwright-cli/`; view it with the `read` tool).
   - Interactive elements — click buttons/links; do they work?
   - Forms — submit empty, invalid, edge-case input.
   - Navigation — paths in and out; dead links.
   - States — empty, loading, error, overflow (47-char names!).
   - Console — new JS errors after each interaction.
   - Consent on non-local targets: if the URL isn't localhost, invocation is
     consent to LOOK, not to ACT — get one explicit consent per run before the
     first submit/create/delete/purchase/settings change. Localhost is not
     automatically safe either: dev servers proxy and forward — confirm where
     writes actually land before the first mutating action.
   - Responsiveness — `resize 375 812`, screenshot, back to 1280x720.
4. **Document each issue IMMEDIATELY when found** (never batch):
   - Interactive bug: screenshot before → action → screenshot result →
     `snapshot` after. Repro steps referencing evidence.
   - Static bug: single screenshot + what's wrong.
   Severity: critical (data loss/security/broken core flow), high (feature
   broken, workaround exists), medium (degraded UX), low (cosmetic).
5. **Fix loop** (skip with `--report-only`): one bug at a time.
   - Test FIRST: before editing source, write the regression test and run it
     — prove the defect (not a bad fixture or import) caused the failure.
     Match 2–3 nearby tests' naming/imports/assertions. Prefer a row in an
     existing table-driven test over a near-duplicate; never add a production
     seam (export/flag/wrapper) that only the test needs. Ask why existing
     coverage didn't catch this — if it should have, extend that test.
   - Make the minimal fix at the source; don't patch symptoms.
   - Verify: regression test red → green, original failing probe passes, one
     adjacent happy path still works, and re-verify in the browser (after
     screenshot vs. the before evidence).
   - One atomic commit per fix containing BOTH fix and regression test.
   Never delete a valid red test; if a fix regresses something, revert only
   that fix (keep the test) and mark the issue deferred. STOP and ask after
   two reverts or any edit to a file unrelated to the bug; hard stop at 50
   fixes regardless.
6. **Wrap up:** health score (console 15%, broken links 15%, forms/flows 25%,
   visual/UX 20%, states/edge cases 15%, mobile 10% — 0 errors=100, 1–3=70,
   4–10=40, 10+=10 per category, weighted), Top 3 Things to Fix, console health
   summary, metadata (date, duration, pages visited, framework). Scoring
   discipline: dedupe issues by root cause across pages; one primary category
   per issue, no double deductions; exclude untested categories and label the
   score "provisional" with the coverage note ("not scored" if none — compare
   only identical coverage); console errors deduped by message+source,
   warnings excluded; expected auth redirects and resource/API requests don't
   count as broken links. Final gate: after all fixes, re-run each affected
   page once and recompute the health score; if the final score is worse
   than the baseline, warn prominently — a fix regressed something.

## Output
QA report: health score, issues table (id · severity · category · page ·
evidence), per-issue repro with screenshots, fixes applied (commit + test
per fix), Top 3, verdict. With `--report-only`: the same minus fixes.
Close the browser (`close`, or `kill-all` if stuck) when done.
