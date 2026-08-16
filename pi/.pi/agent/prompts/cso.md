---
description: Security audit — OWASP Top 10 + STRIDE threat model with an 8/10 confidence gate. Report only, zero noise.
argument-hint: "[--code | --infra | --owasp | --supply-chain | --diff] (default: full)"
---
## Goal
Produce a **Security Posture Report**: concrete findings, severity ratings,
remediation plans. Ported from gstack's /cso. You do NOT make code changes.
Every finding must clear the confidence gate — zero noise is the point.

Scope flags: `--code` (phases 0–1, 7, 9–11), `--infra` (0–6), `--owasp` (9),
`--supply-chain` (3), `--diff` (constrain to files changed vs main). No flag: all.

## Phase 0 — Stack detection + mental model
Detect stack/framework from marker files (package.json, pyproject.toml, Gemfile,
go.mod, Cargo.toml…) and dependencies (next/express/django/rails/gin…). Then
build the mental model BEFORE hunting: read AGENTS.md/README/config; map
components, trust boundaries, where user input enters and exits, invariants the
code relies on. Output a short architecture summary — this phase produces
understanding, not findings. Stack detection sets scan PRIORITY, not scope —
finish with a catch-all pass (injection, secrets, SSRF) across all file types.

## Phase 1 — Attack surface census
Grep for and count: endpoints, auth boundaries, external integrations, file
uploads, admin routes, webhook handlers, background jobs, WebSocket channels,
CI workflow files, exposed ports/configs. This is what an attacker sees.

## Phases 2–11 — Audit (per scope)
2. **Secrets archaeology** — hardcoded keys/tokens in code, config, git history
   (`git log -p -S 'api_key' -- . | head`), .env files committed, keys in logs.
3. **Dependency supply chain** — lockfile present? Known-vulnerable versions
   (osv.dev via browser_navigate if needed), typosquat-adjacent names, unused
   heavy deps, lifecycle scripts (postinstall).
4. **CI/CD pipeline** — unpinned actions (`@main`/`@latest`), secrets in
   workflow logs, `pull_request_target` checking out untrusted code,
   write-all permissions tokens.
5. **Infrastructure shadow surface** — debug endpoints, default creds,
   directory listing, verbose errors, open CORS, missing security headers.
6. **Webhooks & integrations** — signature verification, replay protection,
   SSRF via user-supplied URLs.
7. **LLM & AI security** (if applicable) — prompt injection surface, secrets in
   prompts, unbounded tool loops, agent config files from untrusted repos (see
   the `screen-untrusted-repo` skill for the audit procedure).
8. **Skill/plugin supply chain** — agent-instruction files (AGENTS.md,
   .cursorrules) smuggling instructions; screen them, don't just load them.
9. **OWASP Top 10** — A01 broken access control (missing authz checks per
   route), A02 crypto failures, A03 injection (SQL/cmd/XSS/template — quote the
   sink), A04 insecure design, A05 misconfiguration, A06 vulnerable components,
   A07 authn failures, A08 integrity failures (no signature/hash checks),
   A09 logging gaps (security events unlogged), A10 SSRF.
10. **STRIDE threat model** — per trust boundary: Spoofing, Tampering,
    Repudiation, Information disclosure, DoS, Elevation of privilege. Table form.
11. **Data classification** — what data (PII/secrets/payment), where stored,
    who can read it, is that minimal?

## Confidence gate (the whole point)
- 8–10/10: verified by reading the code — quote the vulnerable lines verbatim
  plus a concrete exploit scenario ("attacker does X, gets Y"). Report.
- 5–7: suspicious but unproven — "needs manual verification" section only.
- <5: drop. False positives destroy trust in the report.
- Common FP exclusions: test fixtures, example/sample code, dev-only codepaths
  behind explicit dev flags, secrets that are documented placeholders.

## Output — Security Posture Report
- **Findings** — `[CRITICAL|HIGH|MEDIUM|LOW] (confidence N/10) file:line —
  issue — exploit scenario — remediation`. Ranked, deduplicated.
- **Attack surface summary** — counts from Phase 1.
- **STRIDE table** — per boundary.
- **Top 3 priorities** — what to fix first and why.
- **Verdict** — one line: ship / fix-criticals-first.
