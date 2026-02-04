#!/bin/bash

# Branch Cleanup Automation Script
# This script helps merge priority branches into main and delete obsolete branches
# 
# Usage: ./scripts/branch-cleanup.sh [--dry-run] [--merge-only] [--delete-only]
#
# Options:
#   --dry-run       Show what would be done without making changes
#   --merge-only    Only merge branches, don't delete
#   --delete-only   Only delete branches (use after merging)
#   --help          Show this help message

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DRY_RUN=false
MERGE_ONLY=false
DELETE_ONLY=false

# Priority branches to merge (in order)
PRIORITY_BRANCHES=(
    "copilot/update-main-branch-latest"
    "copilot/optimize-deployment-costs"
    "copilot/implement-websocket-connection"
    "cursor/ghostwriter-services-setup-c1a6"
    "copilot/pivot-to-ghostwriter-repo"
    "copilot/update-logo-splash-screens"
)

# Branches to delete after merge
BRANCHES_TO_DELETE=(
    "copilot/update-main-branch-latest"
    "copilot/optimize-deployment-costs"
    "copilot/implement-websocket-connection"
    "cursor/ghostwriter-services-setup-c1a6"
    "copilot/pivot-to-ghostwriter-repo"
    "copilot/update-logo-splash-screens"
    "dependabot/npm_and_yarn/framer-motion-12.31.0"
    "dependabot/npm_and_yarn/multi-91da0948d5"
    "dependabot/npm_and_yarn/octokit-5.0.5"
    "dependabot/npm_and_yarn/playwright/test-1.58.1"
    "dependabot/npm_and_yarn/typescript-5.9.3"
    "vercel/set-up-vercel-speed-insights-t-a4wn9t"
    "vercel/set-up-vercel-web-analytics-in-lzvuwz"
    "copilot/close-unneeded-branches"
    "cursor/universal-cart-god-mode-fc35"
)

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --merge-only)
            MERGE_ONLY=true
            shift
            ;;
        --delete-only)
            DELETE_ONLY=true
            shift
            ;;
        --help)
            echo "Branch Cleanup Automation Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --dry-run       Show what would be done without making changes"
            echo "  --merge-only    Only merge branches, don't delete"
            echo "  --delete-only   Only delete branches (use after merging)"
            echo "  --help          Show this help message"
            echo ""
            echo "This script will:"
            echo "  1. Fetch all remote branches"
            echo "  2. Merge priority branches into main (in order)"
            echo "  3. Delete merged and obsolete branches"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Function to print colored messages
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository!"
        exit 1
    fi
}

# Function to check if on main branch
ensure_on_main() {
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        log_warning "Not on main branch. Checking out main..."
        if [ "$DRY_RUN" = false ]; then
            git checkout main
            log_success "Switched to main branch"
        else
            log_info "[DRY RUN] Would checkout main branch"
        fi
    else
        log_success "Already on main branch"
    fi
}

# Function to fetch all branches
fetch_all() {
    log_info "Fetching all remote branches..."
    if [ "$DRY_RUN" = false ]; then
        git fetch --all
        log_success "Fetched all branches"
    else
        log_info "[DRY RUN] Would fetch all branches"
    fi
}

# Function to check if a branch exists
branch_exists() {
    local branch=$1
    git ls-remote --heads origin "$branch" | grep -q "$branch"
}

# Function to merge a branch
merge_branch() {
    local branch=$1
    local merge_msg=$2
    
    log_info "Merging $branch..."
    
    if ! branch_exists "$branch"; then
        log_warning "Branch $branch does not exist, skipping..."
        return 1
    fi
    
    if [ "$DRY_RUN" = false ]; then
        if git merge "origin/$branch" -m "$merge_msg" --no-ff; then
            log_success "Merged $branch"
            if git push origin main; then
                log_success "Pushed changes to main"
                return 0
            else
                log_error "Failed to push changes"
                return 1
            fi
        else
            log_error "Failed to merge $branch"
            log_error "Please resolve conflicts manually and run the script again"
            exit 1
        fi
    else
        log_info "[DRY RUN] Would merge $branch with message: $merge_msg"
        return 0
    fi
}

# Function to delete a branch
delete_branch() {
    local branch=$1
    
    log_info "Deleting branch $branch..."
    
    if ! branch_exists "$branch"; then
        log_warning "Branch $branch does not exist, skipping..."
        return 1
    fi
    
    if [ "$DRY_RUN" = false ]; then
        if git push origin --delete "$branch"; then
            log_success "Deleted $branch"
            return 0
        else
            log_error "Failed to delete $branch"
            return 1
        fi
    else
        log_info "[DRY RUN] Would delete branch $branch"
        return 0
    fi
}

# Main script
main() {
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║   Branch Cleanup Automation Script        ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "Running in DRY RUN mode - no changes will be made"
        echo ""
    fi
    
    # Check prerequisites
    check_git_repo
    
    # Fetch all branches
    fetch_all
    echo ""
    
    # Merge phase
    if [ "$DELETE_ONLY" = false ]; then
        log_info "═══ MERGE PHASE ═══"
        echo ""
        
        ensure_on_main
        echo ""
        
        merged_count=0
        skipped_count=0
        
        for branch in "${PRIORITY_BRANCHES[@]}"; do
            merge_msg="Merge: $branch into main"
            if merge_branch "$branch" "$merge_msg"; then
                ((merged_count++))
            else
                ((skipped_count++))
            fi
            echo ""
        done
        
        log_success "Merge phase complete: $merged_count merged, $skipped_count skipped"
        echo ""
    fi
    
    # Delete phase
    if [ "$MERGE_ONLY" = false ]; then
        log_info "═══ DELETE PHASE ═══"
        echo ""
        
        if [ "$DRY_RUN" = false ] && [ "$DELETE_ONLY" = false ]; then
            echo -e "${YELLOW}About to delete ${#BRANCHES_TO_DELETE[@]} branches.${NC}"
            read -p "Continue? (y/N) " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log_warning "Delete phase cancelled by user"
                exit 0
            fi
            echo ""
        fi
        
        deleted_count=0
        skipped_count=0
        
        for branch in "${BRANCHES_TO_DELETE[@]}"; do
            if delete_branch "$branch"; then
                ((deleted_count++))
            else
                ((skipped_count++))
            fi
        done
        
        echo ""
        log_success "Delete phase complete: $deleted_count deleted, $skipped_count skipped"
        echo ""
    fi
    
    # Summary
    echo ""
    echo "╔════════════════════════════════════════════╗"
    echo "║   Cleanup Complete!                        ║"
    echo "╚════════════════════════════════════════════╝"
    echo ""
    
    if [ "$DRY_RUN" = false ]; then
        log_success "All operations completed successfully"
        log_info "Your main branch now contains all merged updates"
        log_info "Obsolete branches have been deleted"
    else
        log_info "This was a dry run. No changes were made."
        log_info "Run without --dry-run to execute the operations"
    fi
    
    echo ""
}

# Run main function
main
