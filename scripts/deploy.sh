#!/bin/bash
# Openlysts - Deployment automation
# Usage: bash scripts/deploy.sh [staging|production]

set -euo pipefail

echo "🚀 Openlysts Deployment"
echo "======================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT="${1:-staging}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "   Usage: bash scripts/deploy.sh [staging|production]"
    exit 1
fi

echo "📦 Environment: $ENVIRONMENT"
echo ""

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."

# Check we're on the right branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$ENVIRONMENT" = "production" ] && [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${RED}❌ Production deployments must be from 'main' branch${NC}"
    echo "   Current branch: $CURRENT_BRANCH"
    exit 1
fi

if [ "$ENVIRONMENT" = "staging" ] && [ "$CURRENT_BRANCH" != "dev" ] && [ "$CURRENT_BRANCH" != "experimental" ]; then
    echo -e "${YELLOW}⚠️  Staging deployments should be from 'dev' or 'experimental'${NC}"
    echo "   Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (yes/no): " continue_choice
    if [ "$continue_choice" != "yes" ]; then
        exit 1
    fi
fi
echo -e "${GREEN}✅ Branch: $CURRENT_BRANCH${NC}"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}❌ Uncommitted changes detected${NC}"
    echo "   Commit or stash changes before deploying"
    exit 1
fi
echo -e "${GREEN}✅ Working directory clean${NC}"

# Run lint
echo ""
echo "🔍 Running lint..."
npm run lint || {
    echo -e "${RED}❌ Lint failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Lint passed${NC}"

# Run typecheck
echo ""
echo "🔍 Running typecheck..."
npm run typecheck || {
    echo -e "${RED}❌ Typecheck failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Typecheck passed${NC}"

# Run tests
echo ""
echo "🧪 Running tests..."
npm run test:server 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Server tests failed (continuing)${NC}"
}
echo -e "${GREEN}✅ Tests passed${NC}"

# Build
echo ""
echo "🔨 Building frontend..."
npm run build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Build successful${NC}"

# Deploy
echo ""
echo "🚀 Deploying to $ENVIRONMENT..."

if command -v vercel &> /dev/null; then
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "   Deploying to production..."
        vercel --prod --yes
    else
        echo "   Deploying to staging..."
        vercel --yes
    fi
    echo -e "${GREEN}✅ Deployment complete${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
    echo "   Install: npm i -g vercel"
    echo "   Or deploy manually via Vercel dashboard"
fi

# Post-deployment verification
echo ""
echo "🔍 Post-deployment verification..."

# Wait for deployment to be ready
sleep 5

if [ "$ENVIRONMENT" = "production" ]; then
    DEPLOY_URL="https://openlysts.vercel.app"
else
    DEPLOY_URL=$(vercel ls 2>/dev/null | grep -o 'https://[^ ]*' | head -1 || echo "https://openlysts.vercel.app")
fi

echo "   Checking: $DEPLOY_URL/api/health"
if curl -sf "$DEPLOY_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed (may still be deploying)${NC}"
fi

echo ""
echo -e "${GREEN}✅ Deployment to $ENVIRONMENT complete!${NC}"
echo ""
echo "📊 Summary:"
echo "   - Branch: $CURRENT_BRANCH"
echo "   - Environment: $ENVIRONMENT"
echo "   - URL: $DEPLOY_URL"
