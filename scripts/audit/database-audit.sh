#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# DATABASE AUDIT — Runs after every major project change
# Checks: schema integrity, query patterns, indexes, connections
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
echo "  DATABASE AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. Parameterized Queries ────────────────────────────────────
echo ""
echo "1. Parameterized Query Compliance"
CONCAT_QUERIES=$(grep -rn "query(\`" server/ 2>/dev/null | grep -v "node_modules" | grep -v "test" | grep "\$" | wc -l)
SAFE_QUERIES=$(grep -rn 'query(' server/ 2>/dev/null | grep -v "node_modules" | grep -v "test" | grep '\$1\|\$2\|\$3' | wc -l)

if [ "$CONCAT_QUERIES" -eq 0 ]; then
  pass "No template literal SQL queries (all parameterized)"
else
  fail "$CONCAT_QUERIES queries use template literals (SQL injection risk)"
fi

# ─── 2. Table Name Quoting ───────────────────────────────────────
echo ""
echo "2. Table Name Quoting"
UNQUOTED_TABLES=$(grep -rn "FROM\s\+[A-Z][a-zA-Z]*\b" server/ 2>/dev/null | grep -v "node_modules" | grep -v '"' | grep -v "test" | head -5)
if [ -z "$UNQUOTED_TABLES" ]; then
  pass "All table names appear to be properly quoted"
else
  warn "Potential unquoted table names:"
  echo "$UNQUOTED_TABLES" | head -3
fi

# ─── 3. Connection Pool Configuration ────────────────────────────
echo ""
echo "3. Connection Pool Configuration"
POOL_MAX=$(grep -rn "max:" server/db/ 2>/dev/null | grep -v "node_modules" | head -1)
if echo "$POOL_MAX" | grep -q "max:"; then
  MAX_VALUE=$(echo "$POOL_MAX" | grep -o "max:\s*[0-9]*" | grep -o "[0-9]*")
  if [ "$MAX_VALUE" -le 5 ]; then
    pass "Connection pool max: $MAX_VALUE (≤ 5 for serverless)"
  else
    warn "Connection pool max: $MAX_VALUE (> 5 — may hit Neon limits)"
  fi
else
  warn "Could not detect connection pool configuration"
fi

# ─── 4. Idempotent Migrations ────────────────────────────────────
echo ""
echo "4. Migration Idempotency"
NON_IDEMPOTENT=$(grep -rn "ALTER TABLE.*ADD COLUMN [^I]" server/ 2>/dev/null | grep -v "IF NOT EXISTS" | grep -v "node_modules" | wc -l)
if [ "$NON_IDEMPOTENT" -eq 0 ]; then
  pass "All ALTER TABLE migrations use IF NOT EXISTS"
else
  fail "$NON_IDEMPOTENT non-idempotent migrations found"
fi

# ─── 5. Foreign Key Cascade ──────────────────────────────────────
echo ""
echo "5. Foreign Key Cascade"
CASCADE_COUNT=$(grep -rn "ON DELETE CASCADE" server/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$CASCADE_COUNT" -gt 0 ]; then
  pass "ON DELETE CASCADE found in $CASCADE_COUNT places"
else
  warn "No ON DELETE CASCADE found — verify referential integrity"
fi

# ─── 6. Index Creation ───────────────────────────────────────────
echo ""
echo "6. Index Creation"
INDEX_COUNT=$(grep -rn "CREATE INDEX" server/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$INDEX_COUNT" -gt 5 ]; then
  pass "$INDEX_COUNT indexes defined"
else
  warn "Only $INDEX_COUNT indexes defined (consider adding more)"
fi

# ─── 7. Query Timeout ────────────────────────────────────────────
echo ""
echo "7. Query Timeout"
TIMEOUT_SET=$(grep -rn "statement_timeout\|query_timeout" server/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$TIMEOUT_SET" -gt 0 ]; then
  pass "Query timeouts configured"
else
  warn "No query timeouts configured"
fi

# ─── 8. Error Handling in DB Code ────────────────────────────────
echo ""
echo "8. Database Error Handling"
DB_CATCH=$(grep -rn "catch" server/db/ server/api/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$DB_CATCH" -gt 5 ]; then
  pass "Error handling present in database code ($DB_CATCH catch blocks)"
else
  warn "Limited error handling in database code"
fi

# ─── 9. N+1 Query Detection ──────────────────────────────────────
echo ""
echo "9. N+1 Query Detection"
LOOP_QUERIES=$(grep -rn "for.*{" server/ 2>/dev/null | grep -v "node_modules" | while read line; do
  FILE=$(echo "$line" | cut -d: -f1)
  LINE_NUM=$(echo "$line" | cut -d: -f2)
  NEXT_LINES=$(sed -n "$((LINE_NUM+1)),$((LINE_NUM+5))p" "$FILE" 2>/dev/null)
  if echo "$NEXT_LINES" | grep -q "db.query\|pool.query"; then
    echo "$FILE:$LINE_NUM"
  fi
done | head -5)

if [ -z "$LOOP_QUERIES" ]; then
  pass "No obvious N+1 query patterns detected"
else
  warn "Potential N+1 queries in loops:"
  echo "$LOOP_QUERIES"
fi

# ─── 10. Database Schema File ────────────────────────────────────
echo ""
echo "10. Schema File Integrity"
if [ -f "server/db/schema.js" ]; then
  TABLE_COUNT=$(grep -c "CREATE TABLE" server/db/schema.js 2>/dev/null || echo 0)
  INDEX_COUNT=$(grep -c "CREATE INDEX" server/db/schema.js 2>/dev/null || echo 0)
  pass "Schema file: $TABLE_COUNT tables, $INDEX_COUNT indexes"
else
  fail "server/db/schema.js not found"
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "  ${GREEN}DATABASE AUDIT: PASSED${NC}"
elif [ "$FAILURES" -eq 0 ]; then
  echo -e "  ${YELLOW}DATABASE AUDIT: PASSED WITH WARNINGS${NC} ($WARNINGS warnings)"
else
  echo -e "  ${RED}DATABASE AUDIT: FAILED${NC} ($FAILURES failures, $WARNINGS warnings)"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
