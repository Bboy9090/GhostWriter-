#!/bin/bash

# GhostWriter Git Helper - Common Operations
# Interactive menu for common git tasks

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  GhostWriter Git Helper${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_menu() {
    echo -e "${CYAN}Choose an operation:${NC}"
    echo ""
    echo "  1) Full sync (fetch + update all branches)"
    echo "  2) Quick status check"
    echo "  3) Update main branch only"
    echo "  4) Show all branches"
    echo "  5) Create new feature branch"
    echo "  6) Merge branch into main"
    echo "  7) Push current branch"
    echo "  8) Pull current branch with rebase"
    echo "  9) Stash changes"
    echo "  10) Pop stashed changes"
    echo "  0) Exit"
    echo ""
}

check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}Error: Not in a git repository!${NC}"
        exit 1
    fi
}

full_sync() {
    echo -e "${GREEN}Running full synchronization...${NC}"
    ./scripts/sync-branches.sh
}

quick_status() {
    echo -e "${GREEN}Checking status...${NC}"
    ./scripts/git-status.sh
}

update_main() {
    echo -e "${GREEN}Updating main branch...${NC}"
    
    # Detect main branch
    MAIN_BRANCH=""
    if git show-ref --verify --quiet refs/heads/main; then
        MAIN_BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        MAIN_BRANCH="master"
    else
        echo -e "${RED}Error: Could not find main or master branch${NC}"
        return 1
    fi
    
    CURRENT=$(git rev-parse --abbrev-ref HEAD)
    git checkout $MAIN_BRANCH
    git pull --rebase origin $MAIN_BRANCH
    
    if [ "$CURRENT" != "$MAIN_BRANCH" ]; then
        git checkout $CURRENT
    fi
    
    echo -e "${GREEN}✓ Main branch updated${NC}"
}

show_branches() {
    echo -e "${GREEN}All branches:${NC}"
    echo ""
    echo -e "${CYAN}Local branches:${NC}"
    git branch -vv
    echo ""
    echo -e "${CYAN}Remote branches:${NC}"
    git branch -r
}

create_branch() {
    echo ""
    echo -e "${CYAN}Enter new branch name (e.g., feature/my-feature):${NC}"
    read -p "> " branch_name
    
    if [ -z "$branch_name" ]; then
        echo -e "${RED}Error: Branch name cannot be empty${NC}"
        return 1
    fi
    
    git checkout -b "$branch_name"
    echo -e "${GREEN}✓ Created and switched to branch: $branch_name${NC}"
}

merge_to_main() {
    echo ""
    echo -e "${CYAN}Enter branch name to merge into main:${NC}"
    read -p "> " branch_name
    
    if [ -z "$branch_name" ]; then
        echo -e "${RED}Error: Branch name cannot be empty${NC}"
        return 1
    fi
    
    # Detect main branch
    MAIN_BRANCH=""
    if git show-ref --verify --quiet refs/heads/main; then
        MAIN_BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master; then
        MAIN_BRANCH="master"
    else
        echo -e "${RED}Error: Could not find main or master branch${NC}"
        return 1
    fi
    
    git checkout $MAIN_BRANCH
    git pull --rebase origin $MAIN_BRANCH
    git merge "$branch_name"
    
    echo -e "${GREEN}✓ Merged $branch_name into $MAIN_BRANCH${NC}"
    echo ""
    echo -e "${YELLOW}Don't forget to push: git push origin $MAIN_BRANCH${NC}"
}

push_current() {
    CURRENT=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${GREEN}Pushing $CURRENT to origin...${NC}"
    git push origin $CURRENT
    echo -e "${GREEN}✓ Pushed successfully${NC}"
}

pull_current() {
    CURRENT=$(git rev-parse --abbrev-ref HEAD)
    echo -e "${GREEN}Pulling $CURRENT with rebase...${NC}"
    git pull --rebase origin $CURRENT
    echo -e "${GREEN}✓ Pulled successfully${NC}"
}

stash_changes() {
    echo ""
    echo -e "${CYAN}Enter stash message (optional):${NC}"
    read -p "> " message
    
    if [ -z "$message" ]; then
        git stash
    else
        git stash save "$message"
    fi
    
    echo -e "${GREEN}✓ Changes stashed${NC}"
}

pop_stash() {
    echo -e "${GREEN}Available stashes:${NC}"
    git stash list
    echo ""
    git stash pop
    echo -e "${GREEN}✓ Stash popped${NC}"
}

# Main script
print_header
check_git_repo

while true; do
    print_menu
    read -p "Enter choice [0-10]: " choice
    
    case $choice in
        1)
            full_sync
            ;;
        2)
            quick_status
            ;;
        3)
            update_main
            ;;
        4)
            show_branches
            ;;
        5)
            create_branch
            ;;
        6)
            merge_to_main
            ;;
        7)
            push_current
            ;;
        8)
            pull_current
            ;;
        9)
            stash_changes
            ;;
        10)
            pop_stash
            ;;
        0)
            echo ""
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Please try again.${NC}"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}Press Enter to continue...${NC}"
    read
    clear
    print_header
done
