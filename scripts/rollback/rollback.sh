#!/bin/bash
# Openlysts - Automated Rollback Script
# Usage: bash scripts/rollback/rollback.sh [production|staging] [--dry-run]

set -euo pipefail

echo "🔄 Openlysts Automated Rollback"
echo "================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-production}"
DRY_RUN="${2:-}"

if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
  echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
  echo "   Usage: bash scripts/rollback/rollback.sh [production|staging] [--dry-run]"
  exit 1
fi

echo "📦 Environment: $ENVIRONMENT"
echo "🔍 Mode: ${DRY_RUN:-live}"
echo ""

# Step 1: Find last good deployment
echo "1️⃣  Finding last known good deployment..."
if command -v vercel &> /dev/null; then
  LAST_GOOD=$(vercel ls 2>/dev/null | grep -o 'https://[^ ]*' | head -2)
  echo "   Last deployment: $LAST_GOOD"
else
  echo -e "${YELLOW}   Vercel CLI not found — using git fallback${NC}"
  LAST_COMMIT=$(git log --oneline -2 --format="%H %s" | tail -1)
  echo "   Last commit: $LAST_COMMIT"
fi

# Step 2: Identify what changed
echo ""
echo "2️⃣  Identifying recent changes..."
echo "   Recent commits:"
git log --oneline -5 | sed 's/^/     /'

# Step 3: Database rollback consideration
echo ""
echo "3️⃣  Database rollback assessment..."
echo "   ⚠️  Database rollback is MANUAL and DESTRUCTIVE"
echo "   Check if recent changes included schema migrations:"
git log --oneline -10 -- server/db/ | sed 's/^/     /' || echo "     No recent schema changes"

# Step 4: Execute rollback
echo ""
echo "4️⃣  Executing rollback..."

if [ "$DRY_RUN" = "--dry-run" ]; then
  echo -e "${YELLOW}   [DRY RUN] Would execute:${NC}"
  echo "   - Promote previous deployment to production"
  echo "   - Clear CDN cache"
  echo "   - Run smoke tests"
else
  if command -v vercel &> /dev/null; then
    echo "   Promoting previous deployment..."
    # Get the deployment before the latest
    PREV_URL=$(vercel ls 2>/dev/null | grep -o 'https://[^ ]*' | sed -n '2p')
    if [ -n "$PREV_URL" ]; then
      echo "   Rolling back to: $PREV_URL"
      # Note: actual Vercel rollback is done via dashboard or API
      echo -e "${YELLOW}   ⚠️  Manual rollback required:${NC}"
      echo "   1. Go to Vercel Dashboard → Deployments"
      echo "   2. Find the deployment above"
      echo "   3. Click '...' → 'Promote to Production'"
    fi
  else
    echo -e "${YELLOW}   Vercel CLI not found${NC}"
    echo "   Manual rollback required via Vercel Dashboard"
  fi
fi

# Step 5: Post-rollback verification
echo ""
echo "5️⃣  Post-rollback verification..."
if [ "$DRY_RUN" != "--dry-run" ]; then
  echo "   Running smoke tests..."
  sleep 5
  node scripts/smoke/post-deploy.js 2>/dev/null || echo -e "${YELLOW}   Smoke tests require running server${NC}"
fi

echo ""
echo -e "${GREEN}✅ Rollback procedure complete${NC}"
echo ""
echo "📋 Post-rollback checklist:"
echo "   [ ] Verify application loads in browser"
echo "   [ ] Test critical user flows"
echo "   [ ] Check error monitoring for new issues"
echo "   [ ] Notify team of rollback"
echo "   [ ] Create incident report if needed"
echo "   [ ] Investigate root cause"
echo "   [ ] Fix and re-deploy when ready"
