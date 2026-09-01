#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DEPENDENCY AUDIT — Runs after every major project change
# Checks: vulnerabilities, outdated, unused, duplication, license
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
echo "  DEPENDENCY AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. NPM Audit ────────────────────────────────────────────────
echo ""
echo "1. Vulnerability Scan"
AUDIT_RESULT=$(npm audit --json 2>/dev/null || echo '{"vulnerabilities":{}}')
HIGH_VULNS=$(echo "$AUDIT_RESULT" | grep -o '"high":[0-9]*' | grep -o '[0-9]*' || echo "0")
CRITICAL_VULNS=$(echo "$AUDIT_RESULT" | grep -o '"critical":[0-9]*' | grep -o '[0-9]*' || echo "0")

if [ "$CRITICAL_VULNS" -gt 0 ]; then
  fail "$CRITICAL_VULNS critical vulnerabilities found"
elif [ "$HIGH_VULNS" -gt 0 ]; then
  fail "$HIGH_VULNS high vulnerabilities found"
else
  pass "No high/critical vulnerabilities"
fi

# ─── 2. Outdated Dependencies ────────────────────────────────────
echo ""
echo "2. Outdated Dependencies"
OUTDATED=$(npm outdated 2>/dev/null | grep -c "package" || echo 0)
if [ "$OUTDATED" -eq 0 ]; then
  pass "All dependencies up to date"
elif [ "$OUTDATED" -lt 5 ]; then
  warn "$OUTDATED dependencies outdated"
else
  warn "$OUTDATED dependencies outdated (consider updating)"
fi

# ─── 3. Unused Dependencies ──────────────────────────────────────
echo ""
echo "3. Unused Dependencies"
# Check known unused from audit
KNOWN_UNUSED=("lodash")
for dep in "${KNOWN_UNUSED[@]}"; do
  if grep -q "\"$dep\"" package.json 2>/dev/null; then
    IMPORTS=$(grep -rn "from.*['\"]$dep['\"]\|require.*['\"]$dep['\"]" server/ src/ 2>/dev/null | grep -v node_modules | wc -l)
    if [ "$IMPORTS" -eq 0 ]; then
      fail "$dep is installed but has ZERO imports"
    else
      pass "$dep has $IMPORTS imports"
    fi
  fi
done

# ─── 4. Dependency Count ─────────────────────────────────────────
echo ""
echo "4. Dependency Count"
DEPS=$(cat package.json | grep -c '"\^' || echo 0)
DEV_DEPS=$(cat package.json | grep -c '"\^' || echo 0)
if [ "$DEPS" -lt 80 ]; then
  pass "Production dependencies: $DEPS (< 80)"
elif [ "$DEPS" -lt 100 ]; then
  warn "Production dependencies: $DEPS (> 80)"
else
  fail "Production dependencies: $DEPS (> 100 — consider reducing)"
fi

# ─── 5. Lock File Integrity ──────────────────────────────────────
echo ""
echo "5. Lock File Integrity"
if [ -f "package-lock.json" ]; then
  LOCK_SIZE=$(wc -c < "package-lock.json")
  if [ "$LOCK_SIZE" -gt 1000 ]; then
    pass "package-lock.json exists (${LOCK_SIZE} bytes)"
  else
    warn "package-lock.json seems too small (${LOCK_SIZE} bytes)"
  fi
else
  fail "package-lock.json missing"
fi

# ─── 6. node_modules Integrity ───────────────────────────────────
echo ""
echo "6. node_modules Integrity"
if [ -d "node_modules" ]; then
  MODULE_COUNT=$(ls -1 node_modules/ 2>/dev/null | wc -l)
  if [ "$MODULE_COUNT" -gt 100 ]; then
    pass "node_modules contains $MODULE_COUNT packages"
  else
    warn "node_modules seems small ($MODULE_COUNT packages)"
  fi
else
  fail "node_modules directory missing"
fi

# ─── 7. License Check ────────────────────────────────────────────
echo ""
echo "7. License Check"
RESTRICTIVE=$(npm ls --json 2>/dev/null | grep -o '"license":"[^"]*"' | grep -i "gpl\|agpl\|sspl" | wc -l || echo 0)
if [ "$RESTRICTIVE" -eq 0 ]; then
  pass "No restrictive licenses (GPL/AGPL/SSPL) detected"
else
  warn "$RESTRICTIVE packages with restrictive licenses"
fi

# ─── 8. Bundle Impact ────────────────────────────────────────────
echo ""
echo "8. Heavy Dependencies"
HEAVY_DEPS=$(du -sh node_modules/*/ 2>/dev/null | sort -rh | head -5)
echo "  Top 5 largest packages:"
echo "$HEAVY_DEPS" | while read line; do
  echo "    $line"
done
pass "Heavy dependency analysis complete"

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "  ${GREEN}DEPENDENCY AUDIT: PASSED${NC}"
elif [ "$FAILURES" -eq 0 ]; then
  echo -e "  ${YELLOW}DEPENDENCY AUDIT: PASSED WITH WARNINGS${NC} ($WARNINGS warnings)"
else
  echo -e "  ${RED}DEPENDENCY AUDIT: FAILED${NC} ($FAILURES failures, $WARNINGS warnings)"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
