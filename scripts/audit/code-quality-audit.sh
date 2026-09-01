#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# CODE QUALITY AUDIT — Runs after every major project change
# Checks: ESLint, TypeScript, formatting, dead code, conventions
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
echo "  CODE QUALITY AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. ESLint ───────────────────────────────────────────────────
echo ""
echo "1. ESLint Check"
if npm run lint 2>/dev/null | grep -q "warning\|error"; then
  LINT_ERRORS=$(npm run lint 2>&1 | grep -c "error" || echo 0)
  if [ "$LINT_ERRORS" -gt 0 ]; then
    fail "ESLint found $LINT_ERRORS errors"
  else
    pass "ESLint passed (warnings only)"
  fi
else
  pass "ESLint passed cleanly"
fi

# ─── 2. TypeScript ───────────────────────────────────────────────
echo ""
echo "2. TypeScript Check"
if npm run typecheck 2>/dev/null; then
  pass "TypeScript check passed"
else
  fail "TypeScript check failed"
fi

# ─── 3. Build Success ────────────────────────────────────────────
echo ""
echo "3. Build Verification"
if npm run build 2>/dev/null; then
  pass "Build succeeded"
else
  fail "Build failed"
fi

# ─── 4. Unused Imports ───────────────────────────────────────────
echo ""
echo "4. Unused Imports"
UNUSED_IMPORTS=$(grep -rn "^import" server/ src/ 2>/dev/null | grep -v "node_modules" | while read line; do
  FILE=$(echo "$line" | cut -d: -f1)
  IMPORT=$(echo "$line" | grep -oP "import\s+\{?\s*\K[^}]+" | head -1)
  if [ -n "$IMPORT" ]; then
    IMPORT_NAME=$(echo "$IMPORT" | awk '{print $NF}' | tr -d ',')
    if ! grep -q "$IMPORT_NAME" "$FILE" 2>/dev/null; then
      echo "$FILE: $IMPORT_NAME"
    fi
  fi
done | head -10)

if [ -z "$UNUSED_IMPORTS" ]; then
  pass "No obvious unused imports detected"
else
  warn "Potential unused imports:"
  echo "$UNUSED_IMPORTS" | head -5
fi

# ─── 5. Dead Code (unused exports) ───────────────────────────────
echo ""
echo "5. Dead Code Indicators"
# Check for files that are never imported
UNUSED_FILES=0
for FILE in $(find server/ -name "*.js" -not -path "*/node_modules/*" -not -path "*/test*" 2>/dev/null | head -20); do
  BASENAME=$(basename "$FILE" .js)
  if [ "$BASENAME" != "index" ] && [ "$BASENAME" != "server" ]; then
    IMPORTS=$(grep -rl "$BASENAME" server/ src/ 2>/dev/null | grep -v "$FILE" | wc -l)
    if [ "$IMPORTS" -eq 0 ]; then
      warn "Potentially unused file: $FILE"
      UNUSED_FILES=$((UNUSED_FILES + 1))
    fi
  fi
done
if [ "$UNUSED_FILES" -eq 0 ]; then
  pass "No obviously unused files detected"
fi

# ─── 6. Naming Conventions ───────────────────────────────────────
echo ""
echo "6. Naming Conventions"
# Check for var usage (should use const/let)
VAR_USAGE=$(grep -rn "\bvar " server/ src/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$VAR_USAGE" -eq 0 ]; then
  pass "No 'var' usage detected (uses const/let)"
else
  warn "$VAR_USAGE 'var' declarations found (use const/let)"
fi

# Check for == / != (should use === / !==)
LOOSE_EQUALITY=$(grep -rn "[^!=]==[^=]" server/ src/ 2>/dev/null | grep -v "node_modules" | grep -v "test" | wc -l)
if [ "$LOOSE_EQUALITY" -eq 0 ]; then
  pass "No loose equality (==) detected"
else
  warn "$LOOSE_EQUALITY loose equality (==) usages found"
fi

# ─── 7. Error Handling ───────────────────────────────────────────
echo ""
echo "7. Error Handling"
# Check for empty catch blocks
EMPTY_CATCH=$(grep -rn "catch.*{" server/ src/ 2>/dev/null | grep -v "node_modules" | while read line; do
  FILE=$(echo "$line" | cut -d: -f1)
  LINE_NUM=$(echo "$line" | cut -d: -f2)
  NEXT_LINES=$(sed -n "$((LINE_NUM+1)),$((LINE_NUM+3))p" "$FILE" 2>/dev/null)
  if echo "$NEXT_LINES" | grep -q "^\\s*}\\s*$"; then
    echo "$FILE:$LINE_NUM"
  fi
done | head -5)

if [ -z "$EMPTY_CATCH" ]; then
  pass "No empty catch blocks detected"
else
  warn "Empty catch blocks found:"
  echo "$EMPTY_CATCH"
fi

# ─── 8. console.error Usage ──────────────────────────────────────
echo ""
echo "8. Error Logging"
CONSOLE_ERROR=$(grep -rn "console\.error" server/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$CONSOLE_ERROR" -gt 0 ]; then
  pass "Error logging present ($CONSOLE_ERROR console.error calls)"
else
  warn "No console.error found in server code"
fi

# ─── 9. Consistent Quote Style ───────────────────────────────────
echo ""
echo "9. Quote Style Consistency"
DOUBLE_QUOTES=$(grep -rn '"[^"]*"' server/ src/ 2>/dev/null | grep -v "node_modules" | grep -v "import" | wc -l)
SINGLE_QUOTES=$(grep -rn "'[^']*'" server/ src/ 2>/dev/null | grep -v "node_modules" | grep -v "import" | wc -l)
if [ "$SINGLE_QUOTES" -gt "$DOUBLE_QUOTES" ]; then
  pass "Single quotes predominant (project convention)"
else
  warn "Mixed quote styles detected"
fi

# ─── 10. File Size Check ─────────────────────────────────────────
echo ""
echo "10. File Size Check"
LARGE_FILES=$(find server/ src/ -name "*.js" -o -name "*.jsx" 2>/dev/null | grep -v node_modules | while read f; do
  LINES=$(wc -l < "$f" 2>/dev/null || echo 0)
  if [ "$LINES" -gt 500 ]; then
    echo "  $f ($LINES lines)"
  fi
done)

if [ -z "$LARGE_FILES" ]; then
  pass "No files > 500 lines"
else
  warn "Large files detected (> 500 lines):"
  echo "$LARGE_FILES"
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "  ${GREEN}CODE QUALITY AUDIT: PASSED${NC}"
elif [ "$FAILURES" -eq 0 ]; then
  echo -e "  ${YELLOW}CODE QUALITY AUDIT: PASSED WITH WARNINGS${NC} ($WARNINGS warnings)"
else
  echo -e "  ${RED}CODE QUALITY AUDIT: FAILED${NC} ($FAILURES failures, $WARNINGS warnings)"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
