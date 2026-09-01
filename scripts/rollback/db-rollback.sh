#!/bin/bash
# Openlysts - Database Migration Rollback Script
# Usage: bash scripts/rollback/db-rollback.sh [--confirm]

set -euo pipefail

echo "🔄 Database Migration Rollback"
echo "=============================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ "${1:-}" != "--confirm" ]; then
  echo -e "${RED}⚠️  WARNING: This will ROLLBACK the last database migration!${NC}"
  echo ""
  echo "This is DESTRUCTIVE and may cause data loss."
  echo ""
  echo "Usage: bash scripts/rollback/db-rollback.sh --confirm"
  exit 1
fi

if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  exit 1
fi

echo "📊 Database: ${DATABASE_URL%%@*}@***"
echo ""

# Show recent migrations
echo "📋 Recent migrations:"
ls -t server/db/migrations/ 2>/dev/null | head -5 | sed 's/^/     /' || echo "     No migration files found"
echo ""

read -p "Are you sure you want to rollback? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo ""
echo "🔄 Rolling back..."
echo "   ⚠️  Manual intervention required for complex rollbacks"
echo "   Check server/db/migrations/ for rollback scripts"
echo ""
echo -e "${GREEN}✅ Rollback instructions provided${NC}"
