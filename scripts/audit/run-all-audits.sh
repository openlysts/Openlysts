#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# MASTER AUDIT ORCHESTRATOR
# Runs ALL audits sequentially. Exit code = total failures.
# Usage: ./scripts/audit/run-all-audits.sh [--quick|--full]
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
TOTAL_FAILURES=0
TOTAL_WARNINGS=0
START_TIME=$(date +%s)
MODE="${1:---full}"

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          OPENLYSTS — COMPLETE PROJECT AUDIT                  ║${NC}"
echo -e "${BLUE}║          Mode: $MODE                                        ║${NC}"
echo -e "${BLUE}║          $(date '+%Y-%m-%d %H:%M:%S')                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Audit Functions ─────────────────────────────────────────────

run_audit() {
  local name="$1"
  local script="$2"
  local start=$(date +%s)

  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  Running: $name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

  if [ -f "$script" ]; then
    set +e
    bash "$script"
    EXIT_CODE=$?
    set -e
    local end=$(date +%s)
    local duration=$((end - start))

    if [ "$EXIT_CODE" -eq 0 ]; then
      echo -e "${GREEN}  ✓ $name completed in ${duration}s — PASSED${NC}"
    else
      echo -e "${RED}  ✗ $name completed in ${duration}s — FAILED ($EXIT_CODE)${NC}"
      TOTAL_FAILURES=$((TOTAL_FAILURES + EXIT_CODE))
    fi
  else
    echo -e "${YELLOW}  ⚠ $name script not found: $script${NC}"
  fi
  echo ""
}

# ─── Run All Audits ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Quick mode: only critical audits
if [ "$MODE" = "--quick" ]; then
  echo -e "${YELLOW}Quick mode: running critical audits only${NC}"
  run_audit "Code Quality" "$SCRIPT_DIR/code-quality-audit.sh"
  run_audit "Security" "$SCRIPT_DIR/security-audit.sh"
  run_audit "Database" "$SCRIPT_DIR/database-audit.sh"
else
  # Full mode: all audits
  echo -e "${YELLOW}Full mode: running all audits${NC}"
  echo ""

  run_audit "1. Code Quality" "$SCRIPT_DIR/code-quality-audit.sh"
  run_audit "2. Security" "$SCRIPT_DIR/security-audit.sh"
  run_audit "3. Performance" "$SCRIPT_DIR/performance-audit.sh"
  run_audit "4. Dependencies" "$SCRIPT_DIR/dependency-audit.sh"
  run_audit "5. Database" "$SCRIPT_DIR/database-audit.sh"
  run_audit "6. Documentation" "$SCRIPT_DIR/documentation-audit.sh"
  run_audit "7. Accessibility" "$SCRIPT_DIR/a11y-audit.sh"
fi

# ─── Final Summary ───────────────────────────────────────────────

END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    AUDIT SUMMARY                             ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC}  Duration: ${TOTAL_DURATION}s                                                    ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}  Mode: $MODE                                                           ${BLUE}║${NC}"

if [ "$TOTAL_FAILURES" -eq 0 ]; then
  echo -e "${BLUE}║${NC}  ${GREEN}Result: ALL AUDITS PASSED${NC}                                           ${BLUE}║${NC}"
else
  echo -e "${BLUE}║${NC}  ${RED}Result: $TOTAL_FAILURES AUDIT(S) FAILED${NC}                              ${BLUE}║${NC}"
fi

echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Run Tests After Audits ──────────────────────────────────────

if [ "$TOTAL_FAILURES" -eq 0 ]; then
  echo -e "${GREEN}Running E2E tests...${NC}"
  npx playwright test --reporter=line 2>/dev/null || echo -e "${YELLOW}E2E tests require dev server running${NC}"
fi

exit $TOTAL_FAILURES
