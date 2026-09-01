#!/bin/bash
# Openlysts - Database reset utility
# Usage: bash scripts/db-reset.sh [--confirm]

set -euo pipefail

echo "🗄️  Openlysts Database Reset"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check for confirmation flag
if [ "${1:-}" != "--confirm" ]; then
    echo -e "${RED}⚠️  WARNING: This will DELETE ALL DATA in the database!${NC}"
    echo ""
    echo "This will:"
    echo "  1. Drop all tables"
    echo "  2. Re-create schema"
    echo "  3. Optionally seed with test data"
    echo ""
    echo "Usage: bash scripts/db-reset.sh --confirm"
    exit 1
fi

# Load environment
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    echo "   Set DATABASE_URL in .env.local"
    exit 1
fi

echo "📊 Database: ${DATABASE_URL%%@*}@***"
echo ""

# Confirm again
read -p "Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Drop and recreate schema
echo ""
echo "🔄 Dropping all tables..."

# Get table list
TABLES=$(psql "$DATABASE_URL" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null | tr -d ' ' | grep -v '^$' || true)

if [ -n "$TABLES" ]; then
    echo "   Found tables:"
    echo "$TABLES" | sed 's/^/     - /'
    echo ""
    
    # Drop each table with cascade
    for table in $TABLES; do
        psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS \"$table\" CASCADE;" 2>/dev/null || true
    done
    echo -e "${GREEN}✅ Tables dropped${NC}"
else
    echo -e "${YELLOW}⚠️  No tables found${NC}"
fi

# Recreate schema
echo ""
echo "🔄 Recreating schema..."
if [ -f server/db/schema.sql ]; then
    psql "$DATABASE_URL" -f server/db/schema.sql 2>/dev/null
    echo -e "${GREEN}✅ Schema recreated${NC}"
else
    echo -e "${YELLOW}⚠️  server/db/schema.sql not found${NC}"
    echo "   Run: node server/db/migrate.js"
fi

# Seed option
echo ""
read -p "Seed database with test data? (yes/no): " seed_choice
if [ "$seed_choice" = "yes" ]; then
    echo "🌱 Seeding database..."
    if [ -f server/db/seed.js ]; then
        node server/db/seed.js
        echo -e "${GREEN}✅ Database seeded${NC}"
    else
        echo -e "${YELLOW}⚠️  server/db/seed.js not found${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Database reset complete!${NC}"
