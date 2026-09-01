#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# POST-CHANGE TRIGGER
# Runs after every major project change (git commit, merge, deploy)
# Determines which audits to run based on what files changed
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CHANGED_FILES="${1:-}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  POST-CHANGE AUDIT TRIGGER${NC}"
echo -e "${BLUE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ─── Detect Changed Files ────────────────────────────────────────

if [ -z "$CHANGED_FILES" ]; then
  # Get changed files from git
  CHANGED_FILES=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only 2>/dev/null || echo "")
fi

if [ -z "$CHANGED_FILES" ]; then
  echo -e "${YELLOW}No changed files detected — running critical audits only${NC}"
  CHANGED_FILES="package.json"
fi

echo "Changed files:"
echo "$CHANGED_FILES" | head -20
echo ""

# ─── Determine Which Audits to Run ───────────────────────────────

RUN_SECURITY=false
RUN_PERFORMANCE=false
RUN_CODE_QUALITY=false
RUN_DATABASE=false
RUN_DEPENDENCY=false
RUN_DOCUMENTATION=false
RUN_TESTS=false

for file in $CHANGED_FILES; do
  case "$file" in
    server/auth/*|server/api/*)
      RUN_SECURITY=true
      RUN_CODE_QUALITY=true
      RUN_TESTS=true
      ;;
    server/db/*)
      RUN_DATABASE=true
      RUN_CODE_QUALITY=true
      RUN_TESTS=true
      ;;
    src/*)
      RUN_CODE_QUALITY=true
      RUN_PERFORMANCE=true
      RUN_TESTS=true
      ;;
    package.json|package-lock.json)
      RUN_DEPENDENCY=true
      RUN_SECURITY=true
      RUN_PERFORMANCE=true
      ;;
    *.md|.agents/*)
      RUN_DOCUMENTATION=true
      ;;
    vite.config.*|rollup.config.*)
      RUN_PERFORMANCE=true
      ;;
    *)
      RUN_CODE_QUALITY=true
      ;;
  esac
done

# Always run these
RUN_SECURITY=true
RUN_CODE_QUALITY=true

echo -e "${BLUE}Audits to run:${NC}"
$RUN_SECURITY && echo "  ✓ Security"
$RUN_PERFORMANCE && echo "  ✓ Performance"
$RUN_CODE_QUALITY && echo "  ✓ Code Quality"
$RUN_DATABASE && echo "  ✓ Database"
$RUN_DEPENDENCY && echo "  ✓ Dependencies"
$RUN_DOCUMENTATION && echo "  ✓ Documentation"
$RUN_TESTS && echo "  ✓ E2E Tests"
echo ""

# ─── Run Selected Audits ─────────────────────────────────────────

TOTAL_FAILURES=0

run_if_needed() {
  local should_run=$1
  local name=$2
  local script=$3

  if [ "$should_run" = true ]; then
    echo -e "${BLUE}Running $name audit...${NC}"
    if [ -f "$script" ]; then
      set +e
      bash "$script"
      EXIT_CODE=$?
      set -e
      if [ "$EXIT_CODE" -ne 0 ]; then
        TOTAL_FAILURES=$((TOTAL_FAILURES + EXIT_CODE))
      fi
    fi
    echo ""
  fi
}

run_if_needed "$RUN_CODE_QUALITY" "Code Quality" "$SCRIPT_DIR/code-quality-audit.sh"
run_if_needed "$RUN_SECURITY" "Security" "$SCRIPT_DIR/security-audit.sh"
run_if_needed "$RUN_PERFORMANCE" "Performance" "$SCRIPT_DIR/performance-audit.sh"
run_if_needed "$RUN_DATABASE" "Database" "$SCRIPT_DIR/database-audit.sh"
run_if_needed "$RUN_DEPENDENCY" "Dependencies" "$SCRIPT_DIR/dependency-audit.sh"
run_if_needed "$RUN_DOCUMENTATION" "Documentation" "$SCRIPT_DIR/documentation-audit.sh"

# ─── Run Tests If Triggered ──────────────────────────────────────

if [ "$RUN_TESTS" = true ]; then
  echo -e "${BLUE}Running E2E tests...${NC}"
  set +e
  npx playwright test --reporter=line 2>/dev/null
  TEST_EXIT=$?
  set -e
  if [ "$TEST_EXIT" -ne 0 ]; then
    TOTAL_FAILURES=$((TOTAL_FAILURES + TEST_EXIT))
  fi
  echo ""
fi

# ─── Summary ─────────────────────────────────────────────────────

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
if [ "$TOTAL_FAILURES" -eq 0 ]; then
  echo -e "${GREEN}  POST-CHANGE AUDIT: ALL PASSED${NC}"
else
  echo -e "${RED}  POST-CHANGE AUDIT: $TOTAL_FAILURES FAILURE(S)${NC}"
fi
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

exit $TOTAL_FAILURES
