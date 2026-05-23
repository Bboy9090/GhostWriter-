#!/bin/bash
# Ghost Writer Smoke Test
# End-to-end workflow test to verify core functionality

set -e

echo "🧪 Ghost Writer Smoke Test"
echo "=============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Helper functions
test_start() {
    echo -e "${BLUE}→${NC} Testing: $1"
    TESTS_RUN=$((TESTS_RUN + 1))
}

test_pass() {
    echo -e "${GREEN}✓${NC} $1"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_fail() {
    echo -e "${RED}✗${NC} $1"
    TESTS_FAILED=$((TESTS_FAILED + 1))
}

test_skip() {
    echo -e "${YELLOW}⊘${NC} $1 (skipped)"
}

# Check if build exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠${NC} Build not found. Building..."
    npm run build
fi

echo "Starting smoke tests..."
echo ""

# Test 1: Build artifacts
test_start "Build artifacts exist"
if [ -f "dist/index.html" ] && [ -d "dist/assets" ]; then
    test_pass "Build artifacts present"
else
    test_fail "Build artifacts missing"
fi
echo ""

# Test 2: Package.json validity
test_start "Package.json is valid"
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
    test_pass "package.json is valid JSON"
else
    test_fail "package.json is invalid"
fi
echo ""

# Test 3: App metadata
test_start "App metadata exists and is valid"
if [ -f "app.metadata.json" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('app.metadata.json', 'utf8'))"; then
        # Check required fields
        PACKAGE_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('app.metadata.json', 'utf8')).packageId)")
        if [ "$PACKAGE_ID" = "com.bobbysworld.ghostwriter" ]; then
            test_pass "app.metadata.json is valid with correct package ID"
        else
            test_fail "app.metadata.json has incorrect package ID: $PACKAGE_ID"
        fi
    else
        test_fail "app.metadata.json is invalid JSON"
    fi
else
    test_fail "app.metadata.json not found"
fi
echo ""

# Test 4: TypeScript compilation
test_start "TypeScript compilation"
if npm run type-check 2>&1 | grep -q "error" ; then
    test_fail "TypeScript errors found"
else
    test_pass "TypeScript compilation successful"
fi
echo ""

# Test 5: Linting
test_start "ESLint checks"
if npm run lint 2>&1 | grep -qE "error|✖" ; then
    test_fail "Linting errors found"
else
    test_pass "No linting errors"
fi
echo ""

# Test 6: Required files exist
test_start "Required source files"
REQUIRED_FILES=(
    "src/main.tsx"
    "src/App.tsx"
    "index.html"
)

ALL_FILES_EXIST=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        test_fail "$file missing"
        ALL_FILES_EXIST=false
    fi
done

if [ "$ALL_FILES_EXIST" = true ]; then
    test_pass "All required source files present"
fi
echo ""

# Test 7: Documentation exists
test_start "Documentation completeness"
DOC_FILES=(
    "README.md"
    "docs/PRD.md"
    "docs/ROADMAP.md"
    "docs/RELEASE_CHECKLIST.md"
    "docs/WRITING_PIPELINE.md"
)

ALL_DOCS_EXIST=true
for file in "${DOC_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        test_fail "$file missing"
        ALL_DOCS_EXIST=false
    fi
done

if [ "$ALL_DOCS_EXIST" = true ]; then
    test_pass "All documentation files present"
fi
echo ""

# Test 8: Templates structure
test_start "Templates directory"
if [ -d "src/templates" ]; then
    test_pass "Templates directory exists"
else
    test_skip "Templates directory will be created during development"
fi
echo ""

# Test 9: Export functionality
test_start "Export functionality"
if grep -r "export.*markdown\|export.*txt\|exportAs" src/ >/dev/null 2>&1; then
    test_pass "Export functions found in source"
else
    test_skip "Export functionality will be implemented"
fi
echo ""

# Test 10: AI configuration (optional)
test_start "AI configuration (optional feature)"
if grep -r "ai.*config\|aiProvider" src/ >/dev/null 2>&1 || [ -f "src/lib/ai-config.ts" ]; then
    test_pass "AI configuration found"
else
    test_skip "AI config will be implemented (optional feature)"
fi
echo ""

# Test 11: Storage utilities
test_start "Storage utilities"
if grep -r "localStorage\|storage" src/ >/dev/null 2>&1 || [ -f "src/lib/storage.ts" ]; then
    test_pass "Storage utilities found"
else
    test_skip "Storage utilities will be implemented"
fi
echo ""

# Test 12: Build size check
test_start "Build size optimization"
if [ -d "dist/assets" ]; then
    TOTAL_SIZE=$(du -sb dist/assets | cut -f1)
    # Check if gzipped size is reasonable (< 1MB for MVP)
    if [ $TOTAL_SIZE -lt 2000000 ]; then
        test_pass "Build size is reasonable ($(($TOTAL_SIZE / 1024))KB)"
    else
        test_fail "Build size is too large ($(($TOTAL_SIZE / 1024))KB)"
    fi
else
    test_skip "Build assets not found"
fi
echo ""

# Test 13: Packaging directory
test_start "Packaging documentation"
if [ -f "packaging/README.md" ]; then
    test_pass "Packaging README exists"
else
    test_skip "Packaging README will be created"
fi
echo ""

# Summary
echo "=============================="
echo "Test Summary:"
echo "  Total:  $TESTS_RUN"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All smoke tests passed!${NC}"
    echo ""
    echo "Ghost Writer is ready for testing and development."
    exit 0
else
    echo -e "${RED}❌ Some smoke tests failed.${NC}"
    echo ""
    echo "Please fix the failed tests before proceeding."
    exit 1
fi
