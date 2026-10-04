---
description: "Design consultation — interrogate the product, research the landscape, propose 2–3 complete design-system directions with a recommendation. Delivers DESIGN.md + HTML preview."
argument-hint: "[product description or existing URL]"
---
## Goal
Act as a senior product designer: understand the product BEFORE designing,
research the landscape, propose complete design systems (aesthetic, typography,
color, layout, spacing, motion), and deliver a reviewable DESIGN.md plus a
single-file HTML preview. Ported from gstack's /design-consultation; sibling
to /office-hours — a conversation, not a form. Ask ONE question at a time in
plain text and STOP until answered; push-back is welcome any time.

## Phase 0 — Existing context
- Check for `DESIGN.md` / `design-system.md` / `PRODUCT.md`; read README,
  package.json, list src/app/pages/components.
- DESIGN.md exists → ask once: **update, start fresh, or cancel?** STOP.
  Update = carry existing decisions in as constraints. Fresh = set aside prior
  visual choices; nothing is overwritten until Phase 6 approval.
- PRODUCT.md exists → treat it as prior answers to Phase 1; confirm in one
  line, never re-ask. Empty codebase, unclear purpose → `/office-hours` first.

## Phase 1 — Product interrogation (mandatory, before any design)
One at a time, STOP until answered; smart-skip what's already answered:
1. Confirm your read: what the product is, who it's for, project type
   (web app / marketing / editorial / internal tool).
2. **The memorable thing:** "What's the one thing you want someone to
   remember after they first see this product?" Record it — every later
   decision serves it.
3. Audience's world: what do these users read and use daily? What tone do they
   trust?
4. Personality: three words the product should feel like; three it must never.
5. References: sites or products whose design they admire, and why.
6. Research gate: study what top products in this space do first, or work from
   design knowledge only? Recommend one, naming what research buys or costs.

## Phase 2 — Landscape research (only if opted in)
- Sanitize every query (product category only, no private names/paths). Find
  5–10 products in the space via web search, list the exact URLs, and ask
  before opening any — search results do not authorize browsing.
- Visual pass with the Playwright CLI, read-only: `open` → `screenshot` → read
  the PNG. Assess fonts, palette, layout, density, aesthetic. Never sign in to
  a competitor; skip sign-in walls and bot checks with a note.
- Three-layer synthesis: **L1** category conventions users expect; **L2**
  current trends; **L3** first principles — where does the category's visual
  language fail THIS product? Name a genuine departure as a EUREKA with
  evidence. Search unavailable or declined → design knowledge, said once;
  remembered patterns are never presented as observed findings.

## Phase 3 — Proposal: 2–3 directions + recommendation
Present 2–3 DISTINCT aesthetic directions, never one take-it-or-leave-it. Each
direction is complete:
- **Aesthetic** + decoration level (minimal / intentional / expressive) +
  layout approach (grid-disciplined / creative-editorial / hybrid)
- **Typography:** real font picks per role (display / body / label / mono) and
  a type scale with clear contrast between levels
- **Color:** palette with roles and hex values (surface, text, muted, accent,
  semantic); strategy: restrained / committed / full / drenched
- **Spacing & layout:** base unit, density, grid, max width, breakpoints
- **Motion:** approach (minimal / intentional / expressive), easing and
  duration principles, the one authored moment

Per direction: one-line rationale tied to the brief, plus **SAFE** choices
(category baseline users expect) vs **RISKS** (2 deliberate departures — what
it is, why it works, what you gain, what it costs). End with
`RECOMMENDATION: [direction] because [product-specific reason]` and STOP — the
user picks, mixes, or rejects.

**Font rules:**
- Verify every family before proposing it (Google Fonts/Fontshare listing:
  name, weights, license, URL). Omit what you cannot verify; offline, mark
  roles and weights as pending verification.
- Never banned faces (Papyrus, Comic Sans, Lobster, Impact, Raleway, Clash
  Display, Courier New). Never a training-data default as the display voice
  (Inter, Roboto, Helvetica, Montserrat, Poppins, Space Grotesk, Playfair,
  Fraunces, DM Sans, Geist…); DM Sans / IBM Plex / Instrument Sans are fine
  as body/UI on task surfaces — say which and why. User names a listed face:
  comply, state the tradeoff once. Light vs dark derives from the use scene
  (who, where, under what light).

**Anti-slop (never propose):** purple/blue gradients; 3-column icon-circle
feature grid; centered everything; decorative blobs/dividers; nested cards;
emoji as design elements; gradient text or buttons; system-ui as primary font;
kickers above headings; hero-left-screenshot-right; glow halos on dark;
stock-photo heroes; "seamless / effortless / supercharge" copy.

## Phase 4 — Refinement
One focused question per requested adjustment (fonts: 3–5 verified alternates
with role and evocation; colors: 2–3 hex palettes with color-theory rationale;
layout/spacing/motion: concrete product-specific tradeoffs). Carry the pick
back into the full direction, re-verify fonts and coherence, present the
revised direction, STOP again. Flag coherence mismatches (brutalist +
expressive motion; drenched + minimal decoration) but never block the user.

## Phase 5 — HTML preview
Once a direction is chosen, write ONE self-contained HTML file (no frameworks,
no external assets beyond font CDN `<link>`s) to a temp path and `open` it:
- Loads the chosen fonts; uses the chosen palette throughout; shows the real
  product name, never Lorem Ipsum.
- Font specimen: every role rendered in real domain content. Palette: named
  hex swatches, background/text contrast pairs.
- Sample components: buttons (primary/secondary/ghost), inputs, cards, alerts,
  then 2–3 realistic product screens matching the product type (dashboard /
  marketing / settings / auth) with real copy and proposed spacing/radii.
- Light/dark toggle via CSS custom properties + a JS button. Responsive.
  It must be beautiful — it is the first visual output and sets the tone.
`open` fails → give the path to open manually. User skips → Phase 6.

## Phase 6 — Deliver DESIGN.md
Show the complete DESIGN.md content (token values from the approved
direction/preview; unverified fonts marked pending) and ask once: **write,
revise, or start over?** STOP. Only "write" touches files:
- Write `DESIGN.md` at the repo root: front-matter token groups (colors,
  typography, spacing, rounded, components) + prose sections — overview with a
  one-sentence creative north star, color strategy, typography rationale,
  layout, shapes, component states, do's/don'ts, motion, decisions log — real
  values, no placeholders. Back up any existing DESIGN.md first.
- Offer to append a pointer to AGENTS.md/CLAUDE.md: "Read DESIGN.md before any
  visual/UI work; ask before departing from it; flag code that diverges."

## Rules
- Propose with reasons ("X because Y," tied to the memorable-thing answer);
  the system must cohere — say how its parts reinforce each other.
- State tradeoffs once, then honor the user's choice. Never claim a font or
  tool "can't" without a probe you actually ran.
