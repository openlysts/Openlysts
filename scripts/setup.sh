#!/bin/bash
# Openlysts - One-command project setup
# Usage: bash scripts/setup.sh

set -euo pipefail

echo "🚀 Openlysts Project Setup"
echo "=========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "   Install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js version must be 20+ (found: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check PostgreSQL (optional)
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL client found${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL client not found (using Neon cloud)${NC}"
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Setup environment
echo "🔐 Setting up environment..."
if [ ! -f .env.local ]; then
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo -e "${YELLOW}⚠️  Created .env.local from .env.example${NC}"
        echo "   Please edit .env.local with your configuration"
    else
        echo -e "${YELLOW}⚠️  No .env.example found, creating minimal .env.local${NC}"
        cat > .env.local << 'EOF'
# Openlysts Environment Configuration
# Edit these values for your local setup

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Session (generate random strings)
SESSION_SECRET=change-me-to-random-string
SESSION_PASSWORD=change-me-to-random-string

# Turnstile (Cloudflare)
TURNSTILE_SECRET_KEY=
VITE_TURNSTILE_SITE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EOF
    fi
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi
echo ""

# Setup git hooks
echo "🪝 Setting up git hooks..."
if [ -d .husky ]; then
    chmod +x .husky/pre-commit .husky/pre-push 2>/dev/null || true
    echo -e "${GREEN}✅ Git hooks configured${NC}"
else
    echo -e "${YELLOW}⚠️  No .husky directory found${NC}"
fi
echo ""

# Build frontend
echo "🔨 Building frontend..."
npm run build 2>/dev/null || echo -e "${YELLOW}⚠️  Build failed (configure .env.local first)${NC}"
echo ""

# Database setup hint
echo "🗄️  Database Setup"
echo "   If using local PostgreSQL:"
echo "   1. Create database: createdb openlysts"
echo "   2. Run schema: psql -d openlysts -f server/db/schema.sql"
echo "   3. Or use Neon cloud (recommended)"
echo ""

# Done
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Edit .env.local with your configuration"
echo "   2. Start development: npm run dev"
echo "   3. Open http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - README.md: Project overview"
echo "   - ARCHITECTURE.md: Technical architecture"
echo "   - CONTRIBUTING.md: How to contribute"
echo ""
echo "🧪 Quality checks:"
echo "   - npm run lint: Check code style"
echo "   - npm run typecheck: Check types"
echo "   - npm run test: Run all tests"
echo "   - npm run audit: Run full audit"
