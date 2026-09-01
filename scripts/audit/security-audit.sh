#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# SECURITY AUDIT — Runs after every major project change
# Checks: npm audit, secrets in code, security headers, auth patterns
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
FAILURES=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; FAILURES=$((FAILURES + 1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  SECURITY AUDIT"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. NPM Audit ────────────────────────────────────────────────
echo ""
echo "1. NPM Vulnerability Audit"
if npm audit --audit-level=high 2>/dev/null | grep -q "found 0 vulnerabilities"; then
  pass "No high/critical npm vulnerabilities"
elif npm audit --audit-level=high 2>&1 | grep -q "found"; then
  fail "npm vulnerabilities detected — run 'npm audit' for details"
else
  warn "npm audit could not complete (no lock file?)"
fi

# ─── 2. Secrets in Code ──────────────────────────────────────────
echo ""
echo "2. Hardcoded Secrets Scan"
SECRET_PATTERNS="ghp_[a-zA-Z0-9]{36}|sk-[a-zA-Z0-9]{32,}|password\s*=\s*['\"][^'\"]+|secret\s*=\s*['\"][^'\"]+|api_key\s*=\s*['\"][^'\"]+"
FOUND_SECRETS=$(grep -rn --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" -E "$SECRET_PATTERNS" server/ src/ 2>/dev/null | grep -v "process.env" | grep -v "import " | grep -v "export " | grep -v "interface " | grep -v "type " || true)

if [ -z "$FOUND_SECRETS" ]; then
  pass "No hardcoded secrets found in source code"
else
  fail "Hardcoded secrets detected:"
  echo "$FOUND_SECRETS" | head -5
fi

# ─── 3. Secrets in Config Files ──────────────────────────────────
echo ""
echo "3. Config File Secrets"
CONFIG_SECRETS=$(grep -rn --include="*.json" --include="*.env*" --include="*.yml" --include="*.yaml" -E "(ghp_|sk-|password|secret|token)" . 2>/dev/null | grep -v node_modules | grep -v ".git/" | grep -v "package-lock" || true)

if [ -z "$CONFIG_SECRETS" ]; then
  pass "No secrets in config files"
else
  warn "Potential secrets in config files:"
  echo "$CONFIG_SECRETS" | head -5
fi

# ─── 4. .env Files in Git ────────────────────────────────────────
echo ""
echo "4. Environment Files in Git"
ENV_IN_GIT=$(git ls-files 2>/dev/null | grep -E "\.env\.|\.env$" || true)
if [ -z "$ENV_IN_GIT" ]; then
  pass "No .env files tracked in git"
else
  fail ".env files found in git: $ENV_IN_GIT"
fi

# ─── 5. console.log with Sensitive Data ──────────────────────────
echo ""
echo "5. Sensitive Data Logging"
SENSITIVE_LOGS=$(grep -rn --include="*.js" --include="*.jsx" "console\.log.*\(password\|secret\|token\|sessionID\|req\.body\)" server/ 2>/dev/null | grep -v "node_modules" || true)
if [ -z "$SENSITIVE_LOGS" ]; then
  pass "No sensitive data logging detected"
else
  fail "Sensitive data may be logged:"
  echo "$SENSITIVE_LOGS" | head -5
fi

# ─── 6. SQL Injection Vectors ────────────────────────────────────
echo ""
echo "6. SQL Injection Check"
SQL_CONCAT=$(grep -rn --include="*.js" --include="*.jsx" -E "query\(\s*\`.*\$\{" server/ 2>/dev/null | grep -v "node_modules" | grep -v "test" || true)
if [ -z "$SQL_CONCAT" ]; then
  pass "No template literal SQL queries detected"
else
  warn "Potential SQL injection (template literals in queries):"
  echo "$SQL_CONCAT" | head -5
fi

# ─── 7. eval() and Function() Usage ──────────────────────────────
echo ""
echo "7. Dangerous Function Usage"
EVAL_USAGE=$(grep -rn --include="*.js" --include="*.jsx" -E "eval\(|new Function\(" server/ src/ 2>/dev/null | grep -v "node_modules" | grep -v "test" || true)
if [ -z "$EVAL_USAGE" ]; then
  pass "No eval() or Function() usage detected"
else
  fail "Dangerous function usage detected:"
  echo "$EVAL_USAGE" | head -5
fi

# ─── 8. Helmet Security Headers ──────────────────────────────────
echo ""
echo "8. Helmet Security Headers"
if grep -rn "helmet" server/ 2>/dev/null | grep -q "import\|require"; then
  pass "Helmet is imported in server code"
else
  warn "Helmet may not be configured"
fi

# ─── 9. Rate Limiting ────────────────────────────────────────────
echo ""
echo "9. Rate Limiting Configuration"
RATE_LIMITERS=$(grep -rn "rateLimiter\|rateLimit\|rate-limit" server/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$RATE_LIMITERS" -gt 0 ]; then
  pass "Rate limiting configured ($RATE_LIMITERS references)"
else
  warn "No rate limiting configuration found"
fi

# ─── 10. CORS Configuration ──────────────────────────────────────
echo ""
echo "10. CORS Configuration"
CORS_CONFIG=$(grep -rn "cors\|CORS\|allowedOrigins" server/ 2>/dev/null | grep -v "node_modules" | wc -l)
if [ "$CORS_CONFIG" -gt 0 ]; then
  pass "CORS is configured ($CORS_CONFIG references)"
else
  warn "No CORS configuration found"
fi

# ─── Summary ─────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [ "$FAILURES" -eq 0 ]; then
  echo -e "  ${GREEN}SECURITY AUDIT: PASSED${NC} (0 failures)"
else
  echo -e "  ${RED}SECURITY AUDIT: FAILED${NC} ($FAILURES failures)"
fi
echo "═══════════════════════════════════════════════════════════════"

exit $FAILURES
