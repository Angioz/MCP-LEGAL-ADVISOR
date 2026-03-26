#!/bin/bash
###############################################################################
# SANITIZATION SCRIPT - Pre-npm Publishing Verification
# Purpose: Ensure NO personal/sensitive data before npm publish
# Usage: npm run sanitize  OR  bash scripts/sanitize.sh
# Version: 1.0.0
###############################################################################
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'
WARNINGS=0
ERRORS=0
CHECKS_PASSED=0
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SANITIZATION CHECK - Pre-npm Publishing Verification${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}\n"
echo -e "${BLUE}[PHASE 1] Scanning for Secrets & Credentials${NC}"
echo "─────────────────────────────────────────────────────────"
SECRETS_PATTERNS=(
    "APIKEY\|API_KEY"
    "TOKEN\|AUTH_TOKEN"
    "SECRET\|API_SECRET"
    "PASSWORD\|PASSWD"
    "private_key\|privateKey"
    "access_key\|accessKey"
    "aws_secret\|AWS_SECRET"
    "db_password\|DB_PASSWORD"
)
SECRETS_FOUND=0
for pattern in "${SECRETS_PATTERNS[@]}"; do
    if grep -r "$pattern" src/ 2>/dev/null | grep -v "node_modules" | grep -v ".map" > /dev/null 2>&1; then
        MATCHES=$(grep -r "$pattern" src/ 2>/dev/null | grep -v "node_modules" | grep -v "\.map" || true)
        if [ -n "$MATCHES" ]; then
            if ! echo "$MATCHES" | grep "parameter\|param\|example" > /dev/null 2>&1; then
                echo -e "${RED}✗ POTENTIAL SECRET: $pattern${NC}"
                echo "  $MATCHES" | head -3
                SECRETS_FOUND=$((SECRETS_FOUND + 1))
                ERRORS=$((ERRORS + 1))
            fi
        fi
    fi
done
if [ $SECRETS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No API keys, tokens, or passwords detected${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}⚠ Found $SECRETS_FOUND potential secrets${NC}"
fi
echo -e "\n${BLUE}[PHASE 2] Checking for .env File Leaks${NC}"
echo "─────────────────────────────────────────────────────────"
ENV_FILES=$(find . -maxdepth 1 -name ".env*" -type f 2>/dev/null || true)
if [ -z "$ENV_FILES" ]; then
    echo -e "${GREEN}✓ No .env files in root directory${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}✗ .env files found in root:${NC}"
    echo "$ENV_FILES"
    ERRORS=$((ERRORS + 1))
fi
echo -e "\n${BLUE}[PHASE 3] Verifying .npmignore Configuration${NC}"
echo "─────────────────────────────────────────────────────────"
if [ ! -f ".npmignore" ]; then
    echo -e "${RED}✗ .npmignore file missing${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ .npmignore file exists${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    CRITICAL_PATTERNS=(
        "\.env"
        "\.claude"
        "\.gemini"
        "\.qwen"
        "_bmad"
        "gaps/"
        "GAP_REPORT"
        "src/"
        "tsconfig"
    )
    for pattern in "${CRITICAL_PATTERNS[@]}"; do
        if grep -q "$pattern" .npmignore; then
            echo -e "  ${GREEN}✓ Excludes: $pattern${NC}"
        else
            echo -e "  ${YELLOW}⚠ Missing exclusion: $pattern${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    done
fi
echo -e "\n${BLUE}[PHASE 4] Verifying Build Output${NC}"
echo "─────────────────────────────────────────────────────────"
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ dist/ directory not found${NC}"
    echo "  Run: npm run build"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✓ dist/ directory exists${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    UNEXPECTED=$(find dist/ -type f ! -name "*.js" ! -name "*.map" ! -name "*.d.ts" ! -name "*.d.ts.map" 2>/dev/null || true)
    if [ -z "$UNEXPECTED" ]; then
        echo -e "${GREEN}✓ dist/ contains only .js and .map files${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ Unexpected files in dist/:${NC}"
        echo "$UNEXPECTED"
        ERRORS=$((ERRORS + 1))
    fi
    if [ -f "dist/index.js" ] && head -1 dist/index.js | grep -q "#!/usr/bin/env node"; then
        echo -e "${GREEN}✓ dist/index.js has correct shebang${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}✗ dist/index.js missing shebang${NC}"
        ERRORS=$((ERRORS + 1))
    fi
fi
echo -e "\n${BLUE}[PHASE 5] Validating package.json${NC}"
echo "─────────────────────────────────────────────────────────"
REQUIRED_FIELDS=("name" "version" "description" "main" "bin" "license")
for field in "${REQUIRED_FIELDS[@]}"; do
    if grep -q "\"$field\"" package.json; then
        echo -e "${GREEN}✓ Field present: $field${NC}"
    else
        echo -e "${RED}✗ Missing field: $field${NC}"
        ERRORS=$((ERRORS + 1))
    fi
done
if grep -q "\"files\"" package.json && grep -A 3 "\"files\"" package.json | grep -q "dist"; then
    echo -e "${GREEN}✓ files field includes dist/${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${YELLOW}⚠ files field should include dist/${NC}"
    WARNINGS=$((WARNINGS + 1))
fi
echo -e "\n${BLUE}[PHASE 6] Preview: What Will Be Published${NC}"
echo "─────────────────────────────────────────────────────────"
if command -v npm &> /dev/null; then
    echo "Files that WILL be published to npm:"
    npm pack --dry-run 2>/dev/null | grep -E "^\+" | head -10 || echo "  (run: npm pack --dry-run for full list)"
fi
echo -e "\n${BLUE}[PHASE 7] Checking for Sensitive File Types${NC}"
echo "─────────────────────────────────────────────────────────"
SENSITIVE_PATTERNS=(
    "\.pem"
    "\.key"
    "\.pfx"
    "credentials"
    "secrets\.json"
    "\.p12"
)
SENSITIVE_FOUND=0
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if find . -name "$pattern" 2>/dev/null | grep -v node_modules | grep -v ".git" > /dev/null 2>&1; then
        echo -e "${RED}✗ Found potentially sensitive file: $pattern${NC}"
        SENSITIVE_FOUND=$((SENSITIVE_FOUND + 1))
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $SENSITIVE_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No credential files detected${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
fi
echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SANITIZATION REPORT${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "Checks Passed:  ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Warnings:       ${YELLOW}$WARNINGS${NC}"
echo -e "Errors:         ${RED}$ERRORS${NC}"
echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ SANITIZATION PASSED ✓✓✓${NC}"
    echo -e "${GREEN}Safe to publish to npm${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review: npm pack --dry-run"
    echo "  2. Publish: npm publish"
    echo ""
    exit 0
else
    echo -e "${RED}✗✗✗ SANITIZATION FAILED ✗✗✗${NC}"
    echo -e "${RED}DO NOT PUBLISH - Fix errors above first${NC}"
    echo ""
    echo "Issues found:"
    if [ $SECRETS_FOUND -gt 0 ]; then
        echo "  • Secrets detected - remove before publishing"
    fi
    if [ -n "$ENV_FILES" ]; then
        echo "  • .env files present - remove or exclude in .npmignore"
    fi
    if [ $ERRORS -gt 0 ]; then
        echo "  • $ERRORS critical issue(s) to resolve"
    fi
    echo ""
    exit 1
fi
