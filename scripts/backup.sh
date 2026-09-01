#!/bin/bash
# Openlysts - Database backup utility
# Usage: bash scripts/backup.sh [output_dir]

set -euo pipefail

echo "💾 Openlysts Database Backup"
echo "============================"
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

# Output directory
OUTPUT_DIR="${1:-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/openlysts_$TIMESTAMP.sql"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "📊 Database: ${DATABASE_URL%%@*}@***"
echo "📁 Backup file: $BACKUP_FILE"
echo ""

# Create backup
echo "🔄 Creating backup..."
if pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup created successfully${NC}"
    
    # Show file size
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   Size: $FILE_SIZE"
    
    # Compress
    echo ""
    echo "📦 Compressing..."
    gzip "$BACKUP_FILE"
    echo -e "${GREEN}✅ Compressed: ${BACKUP_FILE}.gz${NC}"
    
    # Show compressed size
    COMPRESSED_SIZE=$(du -h "${BACKUP_FILE}.gz" | cut -f1)
    echo "   Compressed size: $COMPRESSED_SIZE"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

# Cleanup old backups (keep last 7)
echo ""
echo "🧹 Cleaning up old backups (keeping last 7)..."
cd "$OUTPUT_DIR"
ls -t openlysts_*.sql.gz 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null || true
cd - > /dev/null
echo -e "${GREEN}✅ Cleanup complete${NC}"

echo ""
echo -e "${GREEN}✅ Backup complete!${NC}"
echo "   File: ${BACKUP_FILE}.gz"
echo ""
echo "🔄 To restore:"
echo "   gunzip ${BACKUP_FILE}.gz"
echo "   psql \$DATABASE_URL < $BACKUP_FILE"
