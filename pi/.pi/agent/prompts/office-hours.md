---
description: YC-style product interrogation — six forcing questions that reframe the product before any code. Writes a design doc.
argument-hint: "[what you're building]"
---
## Goal
Rethink the product BEFORE writing code. Push back on the framing, challenge
premises, generate alternatives, and leave with a design doc in `docs/designs/`
that downstream reviews (/plan-ceo-review, /plan-eng-review) read.

Ported from gstack's /office-hours. No code changes in this session — thinking only.

## Phase 1 — Context
1. Read AGENTS.md/CLAUDE.md, TODOS.md if they exist.
2. Run `git log --oneline -30` to understand recent direction.
3. Map the codebase areas relevant to the request.
4. Ask: **"What's your goal with this?"** — a real question, not a formality:
   - startup / intrapreneurship → **Startup mode** (Phase 2A)
   - hackathon, open source, research, learning, fun → **Builder mode** (Phase 2B)
   Ask one question at a time and STOP until answered. Smart-skip anything the
   user already told you.
5. Startup mode only: assess stage — pre-product / has users / has paying customers.

## Phase 2A — Startup mode: YC product diagnostic
Operating principles (non-negotiable):
- **Specificity is the only currency.** "Enterprises in healthcare" is not a
  customer. Name, role, company, reason.
- **Interest is not demand.** Waitlists don't count. Behavior counts. Money
  counts. Panic-when-it-breaks counts.
- **The user's words beat the founder's pitch.** If best customers describe the
  value differently than the marketing copy, the copy is wrong.
- **Watch, don't demo.** Guided walkthroughs teach nothing; watching someone
  struggle teaches everything.
- **The status quo is the real competitor.** If "nothing" is the current
  solution, the problem may not hurt enough.
- **Narrow beats wide, early.** The smallest version someone pays for this week
  beats the platform vision.

Posture: direct to the point of discomfort. Take a position on every answer and
state what evidence would change your mind. Push twice — the first answer is the
polished version. Name failure patterns when you see them ("solution in search
of a problem", "hypothetical users"). NEVER say "that's interesting", "you might
consider", "that could work" — say what WILL work and what evidence is missing.
End with ONE concrete assignment, not a strategy.

## Phase 2B — Builder mode: design partner
Delight is the currency. Ship something you can show people. Explore before you
optimize. Riff — surface the most exciting version, not the most strategically
optimized one ("what if you also…", each a 30-minute unlock). Generative
questions, ONE AT A TIME, skip answered ones:
- What's the coolest version of this? Who would you show it to — what makes
  them say "whoa"?
- Fastest path to something usable or shareable?
- What existing thing is closest, and how is yours different?
- What would you add with unlimited time?

## Phase 3 — Premise challenge (both modes, mandatory)
1. Is this the right problem? Could different framing yield a simpler solution?
2. What happens if we do nothing? Real pain or hypothetical?
3. What existing code already partially solves this?
4. If the deliverable is a new artifact (binary, package, app): how do users
   get it? Code without distribution is code nobody uses.
5. Startup mode: does the Phase 2A evidence support this direction?

Output:
```
PREMISES:
1. [statement] — agree/disagree?
2. [statement] — agree/disagree?
```
STOP until the user confirms. Disagreement → revise and loop.

## Phase 4 — Alternatives (mandatory, 2–3)
```
APPROACH A: [name] — summary · effort S/M/L/XL · risk · pros · cons · reuses
APPROACH B: [name] — …
APPROACH C: (optional, creative/lateral)
```
One must be **minimal viable** (fewest files, ships fastest), one **ideal
architecture**, optionally one creative/lateral. End with
`RECOMMENDATION: [X] because [one line mapped to the user's stated goal]`.
STOP — the user picks the approach.

Escape hatches: "just do it" / impatience → fast-track to Phase 4. Fully formed
plan with real evidence → skip Phase 2, still run Phases 3–4.

## Phase 5 — Design doc
Write `docs/designs/YYYY-MM-DD-<slug>-design.md`: problem statement, evidence,
premises, chosen approach + why, rejected alternatives, distribution plan.
Tell the user: "Next: /plan-ceo-review, then /plan-eng-review."
