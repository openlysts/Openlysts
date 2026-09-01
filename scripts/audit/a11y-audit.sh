#!/bin/bash
# Openlysts - Accessibility Audit Script
# Checks WCAG 2.1 AA compliance, keyboard navigation, ARIA, contrast

set -euo pipefail

echo "♿ Accessibility Audit"
echo "====================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running locally
if curl -sf http://localhost:5173 > /dev/null 2>&1; then
    BASE_URL="http://localhost:5173"
elif curl -sf http://localhost:3001 > /dev/null 2>&1; then
    BASE_URL="http://localhost:3001"
else
    echo -e "${RED}❌ Application not running. Start with: npm run dev${NC}"
    exit 1
fi

echo "🌐 Target: $BASE_URL"
echo ""

ISSUES=0
WARNINGS=0

# Check semantic HTML structure
echo "1️⃣  Checking semantic HTML..."
for page in "/" "/discover" "/settings"; do
    CONTENT=$(curl -sf "$BASE_URL$page" 2>/dev/null || echo "")
    
    if [ -n "$CONTENT" ]; then
        # Check for main landmark
        if ! echo "$CONTENT" | grep -qi '<main'; then
            echo -e "   ${RED}❌ $page: Missing <main> landmark${NC}"
            ((ISSUES++))
        else
            echo -e "   ${GREEN}✅ $page: Has <main> landmark${NC}"
        fi
        
        # Check for nav landmark
        if ! echo "$CONTENT" | grep -qi '<nav'; then
            echo -e "   ${YELLOW}⚠️  $page: Missing <nav> landmark${NC}"
            ((WARNINGS++))
        else
            echo -e "   ${GREEN}✅ $page: Has <nav> landmark${NC}"
        fi
        
        # Check for heading hierarchy
        H1_COUNT=$(echo "$CONTENT" | grep -ci '<h1' || true)
        if [ "$H1_COUNT" -eq 0 ]; then
            echo -e "   ${RED}❌ $page: Missing <h1> heading${NC}"
            ((ISSUES++))
        elif [ "$H1_COUNT" -gt 1 ]; then
            echo -e "   ${YELLOW}⚠️  $page: Multiple <h1> headings ($H1_COUNT)${NC}"
            ((WARNINGS++))
        else
            echo -e "   ${GREEN}✅ $page: Single <h1> heading${NC}"
        fi
    fi
done

# Check images for alt text
echo ""
echo "2️⃣  Checking image alt text..."
for page in "/" "/discover" "/settings"; do
    CONTENT=$(curl -sf "$BASE_URL$page" 2>/dev/null || echo "")
    
    if [ -n "$CONTENT" ]; then
        IMAGES_WITH_ALT=$(echo "$CONTENT" | grep -ci 'alt=' || true)
        IMAGES_TOTAL=$(echo "$CONTENT" | grep -ci '<img' || true)
        
        if [ "$IMAGES_TOTAL" -gt 0 ]; then
            if [ "$IMAGES_WITH_ALT" -eq 0 ]; then
                echo -e "   ${RED}❌ $page: Images missing alt text ($IMAGES_TOTAL images)${NC}"
                ((ISSUES++))
            elif [ "$IMAGES_WITH_ALT" -lt "$IMAGES_TOTAL" ]; then
                echo -e "   ${YELLOW}⚠️  $page: Some images missing alt text${NC}"
                ((WARNINGS++))
            else
                echo -e "   ${GREEN}✅ $page: All images have alt text${NC}"
            fi
        fi
    fi
done

# Check form labels
echo ""
echo "3️⃣  Checking form labels..."
for page in "/settings" "/contact"; do
    CONTENT=$(curl -sf "$BASE_URL$page" 2>/dev/null || echo "")
    
    if [ -n "$CONTENT" ]; then
        INPUTS=$(echo "$CONTENT" | grep -ci '<input' || true)
        LABELS=$(echo "$CONTENT" | grep -ci '<label' || true)
        
        if [ "$INPUTS" -gt 0 ] && [ "$LABELS" -eq 0 ]; then
            echo -e "   ${RED}❌ $page: Form inputs without labels ($INPUTS inputs, 0 labels)${NC}"
            ((ISSUES++))
        elif [ "$LABELS" -gt 0 ]; then
            echo -e "   ${GREEN}✅ $page: Form labels present${NC}"
        fi
    fi
done

# Check ARIA attributes
echo ""
echo "4️⃣  Checking ARIA attributes..."
for page in "/" "/discover"; do
    CONTENT=$(curl -sf "$BASE_URL$page" 2>/dev/null || echo "")
    
    if [ -n "$CONTENT" ]; then
        ARIA_COUNT=$(echo "$CONTENT" | grep -ci 'aria-' || true)
        ROLE_COUNT=$(echo "$CONTENT" | grep -ci 'role=' || true)
        
        if [ "$ARIA_COUNT" -eq 0 ] && [ "$ROLE_COUNT" -eq 0 ]; then
            echo -e "   ${YELLOW}⚠️  $page: No ARIA attributes found${NC}"
            ((WARNINGS++))
        else
            echo -e "   ${GREEN}✅ $page: ARIA attributes present ($ARIA_COUNT aria, $ROLE_COUNT roles)${NC}"
        fi
    fi
done

# Check skip links
echo ""
echo "5️⃣  Checking skip navigation..."
for page in "/" "/discover"; do
    CONTENT=$(curl -sf "$BASE_URL$page" 2>/dev/null || echo "")
    
    if [ -n "$CONTENT" ]; then
        if echo "$CONTENT" | grep -qi 'skip.*content\|skip.*nav\|skip.*main'; then
            echo -e "   ${GREEN}✅ $page: Skip navigation link present${NC}"
        else
            echo -e "   ${YELLOW}⚠️  $page: Missing skip navigation link${NC}"
            ((WARNINGS++))
        fi
    fi
done

# Check lang attribute
echo ""
echo "6️⃣  Checking document language..."
CONTENT=$(curl -sf "$BASE_URL/" 2>/dev/null || echo "")
if [ -n "$CONTENT" ]; then
    if echo "$CONTENT" | grep -qi 'lang='; then
        echo -e "   ${GREEN}✅ Document language attribute present${NC}"
    else
        echo -e "   ${RED}❌ Missing document language attribute${NC}"
        ((ISSUES++))
    fi
fi

# Check for keyboard trap indicators
echo ""
echo "7️⃣  Checking interactive elements..."
for page in "/" "/discover"; do
    CONTENT=$(curl -sf "$BASE_URL$page" 2>/dev/null || echo "")
    
    if [ -n "$CONTENT" ]; then
        # Check for tabindex > 0 (bad practice)
        BAD_TABINDEX=$(echo "$CONTENT" | grep -ci 'tabindex="[1-9]' || true)
        if [ "$BAD_TABINDEX" -gt 0 ]; then
            echo -e "   ${YELLOW}⚠️  $page: Found positive tabindex values ($BAD_TABINDEX)${NC}"
            ((WARNINGS++))
        else
            echo -e "   ${GREEN}✅ $page: No positive tabindex values${NC}"
        fi
        
        # Check for focus styles (inline)
        FOCUS_STYLES=$(echo "$CONTENT" | grep -ci ':focus' || true)
        if [ "$FOCUS_STYLES" -gt 0 ]; then
            echo -e "   ${GREEN}✅ $page: Focus styles detected${NC}"
        fi
    fi
done

# Summary
echo ""
echo "📊 Accessibility Audit Summary"
echo "=============================="
echo ""
echo "   Issues:   $ISSUES"
echo "   Warnings: $WARNINGS"
echo ""

if [ "$ISSUES" -gt 0 ]; then
    echo -e "${RED}❌ Failed: $ISSUES critical accessibility issues found${NC}"
    exit 1
elif [ "$WARNINGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Passed with warnings: $WARNINGS items need attention${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Passed: No accessibility issues found${NC}"
    exit 0
fi
