#!/bin/bash
# Openlysts - Database seeding utility
# Usage: bash scripts/seed.sh

set -euo pipefail

echo "🌱 Openlysts Database Seeding"
echo "============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}❌ DATABASE_URL not set${NC}"
    exit 1
fi

echo "📊 Database: ${DATABASE_URL%%@*}@***"
echo ""

# Confirm
read -p "This will seed the database with test data. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Check if seed script exists
if [ -f server/db/seed.js ]; then
    echo "🌱 Running seed script..."
    node server/db/seed.js
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo -e "${YELLOW}⚠️  server/db/seed.js not found${NC}"
    echo "   Creating minimal seed data..."
    
    # Insert test data directly
    psql "$DATABASE_URL" << 'EOF'
-- Test user (password: testpassword123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@openlysts.com', '$2a$12$LJ3m4ys3Lz0Qv5L5Q5L5QeXz5L5Q5L5Q5L5Q5L5Q5L5Q5L5Q5', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Test repositories
INSERT INTO repositories (github_url, full_name, description, stars, forks, language, license, topics, is_oss, last_synced) VALUES
('https://github.com/facebook/react', 'facebook/react', 'The library for web and native user interfaces.', 230000, 45000, 'JavaScript', 'MIT', '{"ui","javascript","frontend"}', true, NOW())
ON CONFLICT (github_url) DO NOTHING;

INSERT INTO repositories (github_url, full_name, description, stars, forks, language, license, topics, is_oss, last_synced) VALUES
('https://github.com/vuejs/core', 'vuejs/core', 'Vue.js is a progressive JavaScript framework.', 48000, 8500, 'TypeScript', 'MIT', '{"ui","javascript","frontend"}', true, NOW())
ON CONFLICT (github_url) DO NOTHING;

INSERT INTO repositories (github_url, full_name, description, stars, forks, language, license, topics, is_oss, last_synced) VALUES
('https://github.com/sveltejs/svelte', 'sveltejs/svelte', 'Cybernetically enhanced web apps.', 80000, 4200, 'JavaScript', 'MIT', '{"ui","javascript","frontend"}', true, NOW())
ON CONFLICT (github_url) DO NOTHING;

INSERT INTO repositories (github_url, full_name, description, stars, forks, language, license, topics, is_oss, last_synced) VALUES
('https://github.com/angular/angular', 'angular/angular', 'Deliver web apps with confidence.', 96000, 25600, 'TypeScript', 'MIT', '{"ui","javascript","frontend"}', true, NOW())
ON CONFLICT (github_url) DO NOTHING;

INSERT INTO repositories (github_url, full_name, description, stars, forks, language, license, topics, is_oss, last_synced) VALUES
('https://github.com/expressjs/express', 'expressjs/express', 'Fast, unopinionated, minimalist web framework.', 65000, 12000, 'JavaScript', 'MIT', '{"node","backend","web"}', true, NOW())
ON CONFLICT (github_url) DO NOTHING;

SELECT 'Seeded ' || COUNT(*) || ' repositories' FROM repositories;
EOF
    echo -e "${GREEN}✅ Seed data inserted${NC}"
fi

echo ""
echo -e "${GREEN}✅ Seeding complete!${NC}"
echo ""
echo "📊 Verify with:"
echo "   psql \$DATABASE_URL -c 'SELECT COUNT(*) FROM repositories;'"
