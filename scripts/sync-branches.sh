#!/bin/bash

# GhostWriter Branch Synchronization Script
# This script helps synchronize all branches (local, remote) and updates the main branch

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  GhostWriter Branch Synchronization Tool${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Function to print status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository!"
    exit 1
fi

print_status "Detected git repository"

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: ${CURRENT_BRANCH}"

# Step 1: Fetch all remotes
echo ""
echo -e "${BLUE}Step 1: Fetching from all remotes...${NC}"
if git fetch --all --prune --tags; then
    print_status "Fetched all remotes successfully"
else
    print_error "Failed to fetch from remotes"
    exit 1
fi

# Step 2: List all branches
echo ""
echo -e "${BLUE}Step 2: Available branches${NC}"
echo "Local branches:"
git branch | sed 's/^/  /'
echo ""
echo "Remote branches:"
git branch -r | sed 's/^/  /'

# Step 3: Check for main/master branch
echo ""
echo -e "${BLUE}Step 3: Identifying main branch...${NC}"
MAIN_BRANCH=""
if git show-ref --verify --quiet refs/heads/main; then
    MAIN_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
    MAIN_BRANCH="master"
elif git show-ref --verify --quiet refs/remotes/origin/main; then
    MAIN_BRANCH="main"
elif git show-ref --verify --quiet refs/remotes/origin/master; then
    MAIN_BRANCH="master"
fi

if [ -z "$MAIN_BRANCH" ]; then
    print_warning "Could not detect main/master branch"
    echo "Available branches are listed above"
    echo "Please specify which branch should be the main branch:"
    read -p "Enter main branch name: " MAIN_BRANCH
    # Validate branch name format
    if ! [[ "$MAIN_BRANCH" =~ ^[a-zA-Z0-9/_-]+$ ]]; then
        print_error "Invalid branch name format. Use only alphanumeric, hyphens, underscores, and slashes."
        exit 1
    fi
fi

print_status "Main branch identified: ${MAIN_BRANCH}"

# Step 4: Check if main branch exists locally
echo ""
echo -e "${BLUE}Step 4: Checking local main branch...${NC}"
if ! git show-ref --verify --quiet refs/heads/${MAIN_BRANCH}; then
    print_warning "Main branch '${MAIN_BRANCH}' doesn't exist locally"
    if git show-ref --verify --quiet refs/remotes/origin/${MAIN_BRANCH}; then
        print_info "Creating local '${MAIN_BRANCH}' branch from origin/${MAIN_BRANCH}"
        git checkout -b ${MAIN_BRANCH} origin/${MAIN_BRANCH}
        print_status "Created local ${MAIN_BRANCH} branch"
    else
        print_error "Main branch doesn't exist on remote either"
        exit 1
    fi
fi

# Step 5: Update main branch
echo ""
echo -e "${BLUE}Step 5: Updating main branch...${NC}"
git checkout ${MAIN_BRANCH}
print_status "Switched to ${MAIN_BRANCH}"

if git pull --rebase origin ${MAIN_BRANCH}; then
    print_status "Updated ${MAIN_BRANCH} with latest changes"
else
    print_warning "Failed to pull latest changes (might already be up to date)"
fi

# Step 6: Update all local branches that track remotes
echo ""
echo -e "${BLUE}Step 6: Updating all tracking branches...${NC}"
for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
    upstream=$(git rev-parse --abbrev-ref ${branch}@{upstream} 2>/dev/null || echo "")
    if [ -n "$upstream" ]; then
        print_info "Updating branch: ${branch}"
        git checkout ${branch}
        if git pull --rebase; then
            print_status "Updated ${branch}"
        else
            print_warning "Could not update ${branch} (might have conflicts)"
        fi
    fi
done

# Step 7: Return to original branch or main
echo ""
echo -e "${BLUE}Step 7: Returning to original branch...${NC}"
if [ "$CURRENT_BRANCH" != "$MAIN_BRANCH" ]; then
    if git show-ref --verify --quiet refs/heads/${CURRENT_BRANCH}; then
        git checkout ${CURRENT_BRANCH}
        print_status "Returned to ${CURRENT_BRANCH}"
    else
        print_warning "Original branch no longer exists, staying on ${MAIN_BRANCH}"
    fi
else
    print_status "Already on ${MAIN_BRANCH}"
fi

# Step 8: Show status
echo ""
echo -e "${BLUE}Step 8: Final status${NC}"
git status

# Summary
echo ""
echo -e "${GREEN}==================================================${NC}"
echo -e "${GREEN}  Synchronization Complete!${NC}"
echo -e "${GREEN}==================================================${NC}"
echo ""
echo "Summary:"
print_status "All remotes fetched"
print_status "Main branch (${MAIN_BRANCH}) updated"
print_status "All tracking branches updated"
echo ""
echo "Current branch: $(git rev-parse --abbrev-ref HEAD)"
echo ""
echo "To push local changes to remote, run:"
echo "  git push origin <branch-name>"
echo ""
echo "To see all branches with their upstream status:"
echo "  git branch -vv"
