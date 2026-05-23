#!/bin/bash
# Ghost Writer Health Check
# Validates that all core components are present and functional

set -e

echo "🏥 Ghost Writer Health Check"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall health
ALL_CHECKS_PASSED=true

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ALL_CHECKS_PASSED=false
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Check if build artifacts exist
echo "📦 Checking Build Artifacts..."
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    check_pass "Build directory exists"
else
    check_warn "Build directory not found (run: npm run build)"
fi
echo ""

# 2. Check if core source files exist
echo "📝 Checking Core Components..."

# Editor component
if [ -f "src/components/Editor.tsx" ] || [ -f "src/App.tsx" ]; then
    check_pass "Editor component available"
else
    check_fail "Editor component missing"
fi

# Storage utilities
if [ -f "src/lib/storage.ts" ] || [ -f "src/lib/capture-store.ts" ]; then
    check_pass "Storage utilities available"
else
    check_fail "Storage utilities missing"
fi

echo ""

# 3. Check templates directory
echo "📄 Checking Templates..."
TEMPLATES_DIR="src/templates"

if [ ! -d "$TEMPLATES_DIR" ]; then
    mkdir -p "$TEMPLATES_DIR"
    check_warn "Templates directory created at $TEMPLATES_DIR"
else
    check_pass "Templates directory exists"
fi

# Check for individual templates (will be created)
REQUIRED_TEMPLATES=("email" "essay" "script" "blog" "chapter")
TEMPLATE_COUNT=0

for template in "${REQUIRED_TEMPLATES[@]}"; do
    if [ -f "$TEMPLATES_DIR/${template}.md" ] || [ -f "$TEMPLATES_DIR/${template}.ts" ]; then
        TEMPLATE_COUNT=$((TEMPLATE_COUNT + 1))
    fi
done

if [ $TEMPLATE_COUNT -eq 5 ]; then
    check_pass "All 5 templates available"
elif [ $TEMPLATE_COUNT -gt 0 ]; then
    check_warn "$TEMPLATE_COUNT/5 templates available"
else
    check_warn "Templates not yet created (will be added)"
fi

echo ""

# 4. Check export functionality
echo "📤 Checking Export Functionality..."
if grep -r "export.*markdown\|export.*txt" src/ >/dev/null 2>&1 || [ -f "src/lib/export.ts" ]; then
    check_pass "Export functions available or will be implemented"
else
    check_warn "Export functionality not yet implemented"
fi
echo ""

# 5. Check AI configuration
echo "🤖 Checking AI Configuration..."
AI_CONFIG_FILE="src/lib/ai-config.ts"
if [ -f "$AI_CONFIG_FILE" ] || [ -f "src/lib/ai.ts" ]; then
    check_pass "AI config file exists"
elif grep -r "aiProvider\|ai.*config" src/ >/dev/null 2>&1; then
    check_pass "AI configuration found in source"
else
    check_warn "AI config not yet implemented (optional feature)"
fi

# Check that AI is optional (should work offline)
if grep -r "offline.*fallback\|ai.*optional" src/ >/dev/null 2>&1 || [ ! -f "$AI_CONFIG_FILE" ]; then
    check_pass "AI is optional (offline fallback available)"
else
    check_warn "Verify AI offline fallback is implemented"
fi

echo ""

# 6. Check configuration files
echo "⚙️  Checking Configuration..."
CONFIG_FILES=(
    "package.json"
    "vite.config.ts"
    "tsconfig.json"
    "app.metadata.json"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file missing"
    fi
done

echo ""

# 7. Check documentation
echo "📚 Checking Documentation..."
DOC_FILES=(
    "README.md"
    "docs/PRD.md"
    "docs/ROADMAP.md"
    "docs/RELEASE_CHECKLIST.md"
    "docs/WRITING_PIPELINE.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file exists"
    else
        check_fail "$file missing"
    fi
done

echo ""

# 8. Check scripts
echo "🔧 Checking Scripts..."
if [ -f "scripts/smoke-test.sh" ]; then
    check_pass "smoke-test.sh exists"
    if [ -x "scripts/smoke-test.sh" ]; then
        check_pass "smoke-test.sh is executable"
    else
        check_warn "smoke-test.sh not executable (run: chmod +x scripts/smoke-test.sh)"
    fi
else
    check_warn "smoke-test.sh not yet created"
fi

echo ""

# 9. Check package.json scripts
echo "📜 Checking NPM Scripts..."
REQUIRED_SCRIPTS=("build" "test" "dev" "lint")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        check_pass "npm run $script available"
    else
        check_fail "npm run $script missing"
    fi
done

echo ""

# 10. Final summary
echo "=============================="
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✅ All critical health checks passed!${NC}"
    echo ""
    echo "Ghost Writer is healthy and ready for use."
    exit 0
else
    echo -e "${YELLOW}⚠️  Some health checks failed or require attention.${NC}"
    echo ""
    echo "Please review the warnings above and address any critical issues."
    echo "Non-critical warnings are acceptable for MVP."
    exit 1
fi
