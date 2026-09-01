#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DOCUMENTATION AUDIT — Runs after every major project change
# Checks: README accuracy, .env.example, script consistency, skills
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
FAILURES=0
WARNINGS=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILURES=$((FAILURES + 1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

echo "═══════════════════════════════════════════════════════════════"
echo "  DOCUMENTATION AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. README Exists ────────────────────────────────────────────
echo ""
echo "1. README.md"
if [ -f "README.md" ]; then
  LINE_COUNT=$(wc -l < "README.md")
  if [ "$LINE_COUNT" -gt 20 ]; then
    pass "README.md exists ($LINE_COUNT lines)"
  else
    warn "README.md seems short ($LINE_COUNT lines)"
  fi
else
  fail "README.md missing"
fi

# ─── 2. ARCHITECTURE.md ──────────────────────────────────────────
echo ""
echo "2. ARCHITECTURE.md"
if [ -f "ARCHITECTURE.md" ]; then
  pass "ARCHITECTURE.md exists"
else
  warn "ARCHITECTURE.md missing"
fi

# ─── 3. .env.example ─────────────────────────────────────────────
echo ""
echo "3. .env.example"
if [ -f ".env.example" ]; then
  # Check if it has actual secrets
  HAS_SECRETS=$(grep -i "password\|secret\|token\|key" .env.example 2>/dev/null | grep -v "^#" | grep -v "your_" | grep -v "xxx" | wc -l)
  if [ "$HAS_SECRETS" -eq 0 ]; then
    pass ".env.example exists with no real secrets"
  else
    fail ".env.example may contain real secrets"
  fi
else
  warn ".env.example missing"
fi

# ─── 4. Script Consistency ───────────────────────────────────────
echo ""
echo "4. Package.json Scripts"
if [ -f "package.json" ]; then
  # Check if scripts reference existing files
  node -e "
    const pkg = require('./package.json');
    const fs = require('fs');
    let missing = 0;
    for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
      const match = cmd.match(/node\s+([^\s]+)/);
      if (match && !fs.existsSync(match[1])) {
        console.log('MISSING: ' + name + ' → ' + match[1]);
        missing++;
      }
    }
    if (missing > 0) process.exit(1);
  " 2>/dev/null && pass "All script targets exist" || warn "Some script targets may be missing"
else
  fail "package.json not found"
fi

# ─── 5. Skill Files ──────────────────────────────────────────────
echo ""
echo "5. Skill Files"
SKILL_COUNT=$(ls -1 .agents/skills/*/SKILL.md 2>/dev/null | wc -l)
if [ "$SKILL_COUNT" -gt 20 ]; then
  pass "$SKILL_COUNT skill files present"
elif [ "$SKILL_COUNT" -gt 0 ]; then
  warn "Only $SKILL_COUNT skill files (expected 30+)"
else
  fail "No skill files found"
fi

# ─── 6. Rule Files ───────────────────────────────────────────────
echo ""
echo "6. Rule Files"
RULE_COUNT=$(ls -1 .agents/rules/*.md 2>/dev/null | wc -l)
if [ "$RULE_COUNT" -gt 8 ]; then
  pass "$RULE_COUNT rule files present"
elif [ "$RULE_COUNT" -gt 0 ]; then
  warn "Only $RULE_COUNT rule files (expected 10+)"
else
  fail "No rule files found"
fi

# ─── 7. QA Audit File ────────────────────────────────────────────
echo ""
echo "7. QA Audit Documentation"
if [ -f "QA_Audit/QA_Audit_V4.md" ]; then
  pass "QA_Audit_V4.md exists"
else
  warn "QA_Audit_V4.md missing"
fi

# ─── 8. Internal Links ───────────────────────────────────────────
echo ""
echo "8. Internal Documentation Links"
BROKEN_REFS=0
for md in *.md .agents/skills/*/SKILL.md .agents/rules/*.md; do
  if [ -f "$md" ]; then
    # Check for broken file references
    grep -oP '\[.*?\]\(\./[^)]+\)' "$md" 2>/dev/null | while read ref; do
      FILE=$(echo "$ref" | grep -oP '\(\./[^)]+\)' | tr -d '()' | sed 's/^\.\///')
      if [ -n "$FILE" ] && [ ! -f "$FILE" ]; then
        echo "BROKEN: $md → $FILE"
        BROKEN_REFS=$((BROKEN_REFS + 1))
      fi
    done
  fi
done
if [ "$BROKEN_REFS" -eq 0 ]; then
  pass "No broken internal documentation links"
else
  warn "$BROKEN_REFS broken internal links"
fi

# ─── 9. AGENTS.md ────────────────────────────────────────────────
echo ""
echo "9. AGENTS.md"
if [ -f "AGENTS.md" ]; then
  pass "AGENTS.md exists"
else
  fail "AGENTS.md missing"
fi

# ─── 10. skills-lock.json ────────────────────────────────────────
echo ""
echo "10. skills-lock.json"
if [ -f "skills-lock.json" ]; then
  pass "skills-lock.json exists"
else
  warn "skills-lock.json missing"
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "  ${GREEN}DOCUMENTATION AUDIT: PASSED${NC}"
elif [ "$FAILURES" -eq 0 ]; then
  echo -e "  ${YELLOW}DOCUMENTATION AUDIT: PASSED WITH WARNINGS${NC} ($WARNINGS warnings)"
else
  echo -e "  ${RED}DOCUMENTATION AUDIT: FAILED${NC} ($FAILURES failures, $WARNINGS warnings)"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
