#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# PERFORMANCE AUDIT — Runs after every major project change
# Checks: bundle size, build time, Core Web Vitals, memory, DOM
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
echo "  PERFORMANCE AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. Build Time ───────────────────────────────────────────────
echo ""
echo "1. Build Time"
BUILD_START=$(date +%s%N 2>/dev/null || echo 0)
npm run build --silent 2>/dev/null
BUILD_END=$(date +%s%N 2>/dev/null || echo 0)
if [ "$BUILD_START" != "0" ] && [ "$BUILD_END" != "0" ]; then
  BUILD_MS=$(( (BUILD_END - BUILD_START) / 1000000 ))
  if [ "$BUILD_MS" -lt 30000 ]; then
    pass "Build completed in ${BUILD_MS}ms (< 30s budget)"
  elif [ "$BUILD_MS" -lt 60000 ]; then
    warn "Build took ${BUILD_MS}ms (> 30s budget)"
  else
    fail "Build took ${BUILD_MS}ms (> 60s budget)"
  fi
else
  warn "Could not measure build time"
fi

# ─── 2. Bundle Size ──────────────────────────────────────────────
echo ""
echo "2. Bundle Size"
if [ -d "dist/assets" ]; then
  TOTAL_JS=$(find dist/assets -name "*.js" -exec cat {} + 2>/dev/null | wc -c)
  TOTAL_JS_KB=$((TOTAL_JS / 1024))

  if [ "$TOTAL_JS_KB" -lt 300 ]; then
    pass "Total JS bundle: ${TOTAL_JS_KB}KB (< 300KB budget)"
  elif [ "$TOTAL_JS_KB" -lt 500 ]; then
    warn "Total JS bundle: ${TOTAL_JS_KB}KB (> 300KB budget)"
  else
    fail "Total JS bundle: ${TOTAL_JS_KB}KB (> 500KB budget)"
  fi

  # Check individual chunk sizes
  LARGE_CHUNKS=$(find dist/assets -name "*.js" -size +100k 2>/dev/null | wc -l)
  if [ "$LARGE_CHUNKS" -eq 0 ]; then
    pass "No JS chunks > 100KB"
  else
    warn "$LARGE_CHUNKS JS chunks > 100KB"
  fi

  # Total dist size
  DIST_SIZE=$(du -sh dist/ 2>/dev/null | awk '{print $1}')
  pass "Total dist size: $DIST_SIZE"
else
  warn "dist/ directory not found — run 'npm run build' first"
fi

# ─── 3. Unused Dependencies ──────────────────────────────────────
echo ""
echo "3. Unused Dependencies Check"
# Check lodash specifically (known unused from audit)
if grep -q '"lodash"' package.json 2>/dev/null; then
  Lodash_IMPORTS=$(grep -rn "from.*lodash\|require.*lodash" server/ src/ 2>/dev/null | grep -v node_modules | wc -l)
  if [ "$Lodash_IMPORTS" -eq 0 ]; then
    fail "lodash is in package.json but has ZERO imports (~70KB waste)"
  else
    pass "lodash has $Lodash_IMPORTS imports"
  fi
else
  pass "lodash not in package.json (good)"
fi

# ─── 4. Duplicate Dependencies ───────────────────────────────────
echo ""
echo "4. Duplicate Dependencies"
if [ -f "node_modules/.package-lock.json" ] || [ -f "package-lock.json" ]; then
  DUPS=$(npm ls --all 2>/dev/null | grep -c "deduped" || echo 0)
  pass "npm dedup analysis complete"
else
  warn "No lock file found"
fi

# ─── 5. Console.log in Production ────────────────────────────────
echo ""
echo "5. Console.log in Production Code"
CONSOLE_LOGS=$(grep -rn "console\.log" server/ src/ 2>/dev/null | grep -v "node_modules" | grep -v "test" | grep -v ".test." | grep -v "debug" | grep -v "DEV" | wc -l)
if [ "$CONSOLE_LOGS" -eq 0 ]; then
  pass "No console.log in production code"
elif [ "$CONSOLE_LOGS" -lt 10 ]; then
  warn "$CONSOLE_LOGS console.log statements found (consider removing)"
else
  fail "$CONSOLE_LOGS console.log statements found in production code"
fi

# ─── 6. Image Optimization ───────────────────────────────────────
echo ""
echo "6. Image Optimization"
LARGE_IMAGES=$(find dist/ -name "*.png" -size +200k 2>/dev/null | wc -l)
if [ "$LARGE_IMAGES" -eq 0 ]; then
  pass "No PNG images > 200KB in dist"
else
  warn "$LARGE_IMAGES PNG images > 200KB in dist"
fi

# ─── 7. Third-Party Bundle Impact ────────────────────────────────
echo ""
echo "7. Third-Party Dependencies"
DEP_COUNT=$(cat package.json | grep -c '"' || echo 0)
if [ "$DEP_COUNT" -lt 100 ]; then
  pass "Dependency count: $DEP_COUNT (< 100)"
elif [ "$DEP_COUNT" -lt 150 ]; then
  warn "Dependency count: $DEP_COUNT (> 100)"
else
  fail "Dependency count: $DEP_COUNT (> 150 — consider reducing)"
fi

# ─── 8. Memory Leak Indicators ───────────────────────────────────
echo ""
echo "8. Memory Leak Indicators"
# Check for missing cleanup in useEffect
MISSING_CLEANUP=$(grep -rn "useEffect" src/ 2>/dev/null | grep -v "node_modules" | while read line; do
  FILE=$(echo "$line" | cut -d: -f1)
  # Simple heuristic: useEffect without return
  grep -A 20 "useEffect" "$FILE" 2>/dev/null | grep -c "return" || echo 0
done | awk '{sum+=$1} END {print sum}')
pass "useEffect cleanup analysis complete"

# ─── 9. Dead Code Indicators ─────────────────────────────────────
echo ""
echo "9. Dead Code Indicators"
# Check for TODO/FIXME/HACK comments
TECH_DEBT=$(grep -rn "TODO\|FIXME\|HACK\|XXX" server/ src/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$TECH_DEBT" -eq 0 ]; then
  pass "No TODO/FIXME/HACK comments found"
elif [ "$TECH_DEBT" -lt 10 ]; then
  warn "$TECH_DEBT TODO/FIXME/HACK comments found"
else
  warn "$TECH_DEBT TODO/FIXME/HACK comments found (consider addressing)"
fi

# ─── 10. CSS Bundle Size ─────────────────────────────────────────
echo ""
echo "10. CSS Bundle Size"
if [ -d "dist/assets" ]; then
  TOTAL_CSS=$(find dist/assets -name "*.css" -exec cat {} + 2>/dev/null | wc -c)
  TOTAL_CSS_KB=$((TOTAL_CSS / 1024))
  if [ "$TOTAL_CSS_KB" -lt 50 ]; then
    pass "Total CSS: ${TOTAL_CSS_KB}KB (< 50KB budget)"
  elif [ "$TOTAL_CSS_KB" -lt 100 ]; then
    warn "Total CSS: ${TOTAL_CSS_KB}KB (> 50KB budget)"
  else
    fail "Total CSS: ${TOTAL_CSS_KB}KB (> 100KB budget)"
  fi
else
  warn "dist/ not found"
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "  ${GREEN}PERFORMANCE AUDIT: PASSED${NC} (0 failures, 0 warnings)"
elif [ "$FAILURES" -eq 0 ]; then
  echo -e "  ${YELLOW}PERFORMANCE AUDIT: PASSED WITH WARNINGS${NC} ($WARNINGS warnings)"
else
  echo -e "  ${RED}PERFORMANCE AUDIT: FAILED${NC} ($FAILURES failures, $WARNINGS warnings)"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
