#!/bin/bash

# Quick Git Status Check
# Shows current status of all branches

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Current Branch ===${NC}"
git rev-parse --abbrev-ref HEAD

echo ""
echo -e "${BLUE}=== Branch Status ===${NC}"
git branch -vv

echo ""
echo -e "${BLUE}=== Remote Branches ===${NC}"
git branch -r | head -20

echo ""
echo -e "${BLUE}=== Uncommitted Changes ===${NC}"
if git diff-index --quiet HEAD --; then
    echo -e "${GREEN}✓ Working tree clean${NC}"
else
    echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
    git status --short
fi

echo ""
echo -e "${BLUE}=== Unpushed Commits ===${NC}"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
UPSTREAM=$(git rev-parse --abbrev-ref ${CURRENT_BRANCH}@{upstream} 2>/dev/null || echo "")
if [ -n "$UPSTREAM" ]; then
    UNPUSHED=$(git log ${UPSTREAM}..HEAD --oneline | wc -l)
    if [ "$UNPUSHED" -eq 0 ]; then
        echo -e "${GREEN}✓ All commits pushed${NC}"
    else
        echo -e "${YELLOW}⚠ ${UNPUSHED} unpushed commit(s)${NC}"
        git log ${UPSTREAM}..HEAD --oneline
    fi
else
    echo "No upstream branch configured"
fi

echo ""
echo -e "${BLUE}=== Remote Status ===${NC}"
git remote -v
