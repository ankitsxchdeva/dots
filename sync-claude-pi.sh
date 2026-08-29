#!/bin/bash
#
# sync-claude-pi.sh — regenerate the claude/ mirrors from their canonical pi/
# sources. Edit the pi/ copies only; claude/ copies are generated (they carry a
# GENERATED marker) and CI fails if they drift.
#
#   ./sync-claude-pi.sh           regenerate claude/ files in place
#   ./sync-claude-pi.sh --check   diff instead of writing (CI drift guard)
#
# Canonical → generated:
#   pi/.pi/agent/prompts/{commit,pr,review}.md → claude/.claude/commands/
#   pi/.pi/agent/skills/screen-untrusted-repo/ → claude/.claude/skills/screen-untrusted-repo/
#
# Transforms applied to prompts: insert `allowed-tools:` into the frontmatter,
# turn "## Context" bullet commands into claude's !`cmd` inline-exec form, and
# apply per-file line swaps where the platforms genuinely differ (claude's
# Co-Authored-By convention, the "Generated with Claude Code" PR footer).

set -euo pipefail
cd "$(dirname "$0")"

MODE="write"
[ "${1:-}" = "--check" ] && MODE="check"

fail() { printf 'sync-claude-pi: %s\n' "$*" >&2; exit 1; }

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

# Literal find-and-replace that must match exactly once — a silent no-op here
# would mean the canonical text drifted away from what the transform expects.
replace_literal() {
    local file="$1"
    FROM="$2" TO="$3" perl -0777 -ne '
        my $n = () = $_ =~ /\Q$ENV{FROM}\E/g;
        die "pattern occurs $n times, want exactly 1\n" if $n != 1;
        s/\Q$ENV{FROM}\E/$ENV{TO}/;
        print;
    ' "$file" > "$file.tmp" || fail "$file: expected text not found: <<$2>>"
    mv "$file.tmp" "$file"
}

# gen_prompt <name> <allowed-tools>
gen_prompt() {
    local name="$1" allowed="$2"
    local src="pi/.pi/agent/prompts/$name.md" dst="$OUT/claude/.claude/commands/$name.md"
    mkdir -p "$(dirname "$dst")"
    grep -q '^argument-hint:' "$src" || fail "$src: no argument-hint line to anchor allowed-tools on"

    awk -v allowed="$allowed" \
        -v marker="<!-- GENERATED from pi/.pi/agent/prompts/$name.md by sync-claude-pi.sh — do not edit directly -->" '
        /^---$/ { fences++; print; if (fences == 2) print marker; next }
        /^argument-hint:/ { print; print "allowed-tools: " allowed; next }
        /^## Context$/ { inctx = 1; print; next }
        inctx && /^Run these first/ { next }
        /^## / { inctx = 0 }
        inctx && /^- / {
            if (!sub(/: `/, ": !`")) {
                printf "sync-claude-pi: unlabeled context bullet (want \"- Label: `cmd`\"): %s\n", $0 > "/dev/stderr"
                exit 1
            }
        }
        { print }
    ' "$src" > "$dst"
}

gen_prompt commit "Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*), Bash(git log:*), Bash(git rev-parse:*), Bash(git branch:*)"
replace_literal "$OUT/claude/.claude/commands/commit.md" \
    "   running as." \
    "   running as, per this environment's convention."

gen_prompt pr "Bash(git:*), Bash(gh:*)"
replace_literal "$OUT/claude/.claude/commands/pr.md" \
    '7. No "Generated with" footer unless I ask for one.' \
    '7. End the body with the "🤖 Generated with Claude Code" footer.'

gen_prompt review "Bash(git:*)"

# ── screen-untrusted-repo skill ─────────────────────────────────────────
SKILL_SRC="pi/.pi/agent/skills/screen-untrusted-repo"
SKILL_DST="$OUT/claude/.claude/skills/screen-untrusted-repo"
mkdir -p "$SKILL_DST/scripts"

# screen.sh: byte copy + generated marker after the shebang
{
    head -1 "$SKILL_SRC/scripts/screen.sh"
    echo "# GENERATED from $SKILL_SRC/scripts/screen.sh by sync-claude-pi.sh — do not edit directly"
    tail -n +2 "$SKILL_SRC/scripts/screen.sh"
} > "$SKILL_DST/scripts/screen.sh"
chmod +x "$SKILL_DST/scripts/screen.sh"

# SKILL.md: marker + claude's absolute-path invocation (it has no
# skill-relative script resolution, unlike pi)
awk -v marker="<!-- GENERATED from $SKILL_SRC/SKILL.md by sync-claude-pi.sh — do not edit directly -->" '
    /^---$/ { fences++; print; if (fences == 2) print marker; next }
    { print }
' "$SKILL_SRC/SKILL.md" > "$SKILL_DST/SKILL.md"
replace_literal "$SKILL_DST/SKILL.md" \
    "bash scripts/screen.sh <path-to-repo>" \
    "bash ~/.claude/skills/screen-untrusted-repo/scripts/screen.sh <path-to-repo>"
replace_literal "$SKILL_DST/SKILL.md" \
    "   (\`scripts/screen.sh\`, resolved relative to this skill's directory.)"$'\n' \
    ""

# ── write or check ──────────────────────────────────────────────────────
MANAGED=(
    commands/commit.md
    commands/pr.md
    commands/review.md
    skills/screen-untrusted-repo/SKILL.md
    skills/screen-untrusted-repo/scripts/screen.sh
)

status=0
for rel in "${MANAGED[@]}"; do
    gen="$OUT/claude/.claude/$rel"
    cur="claude/.claude/$rel"
    if ! diff -q "$gen" "$cur" >/dev/null 2>&1; then
        if [ "$MODE" = check ]; then
            printf 'OUT OF SYNC: %s (run ./sync-claude-pi.sh and commit the result)\n' "$cur"
            status=1
        else
            cp "$gen" "$cur"
            printf 'updated %s\n' "$cur"
        fi
    fi
done

if [ "$MODE" = check ]; then
    if [ "$status" -eq 0 ]; then
        echo "claude/ mirrors are in sync with their pi/ sources."
    else
        fail "drift detected"
    fi
else
    [ "$status" -eq 0 ] && echo "claude/ mirrors already up to date."
fi
