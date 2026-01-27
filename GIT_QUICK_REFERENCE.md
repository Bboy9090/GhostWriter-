# Git Quick Reference Guide

A visual cheat sheet for common Git operations in GhostWriter.

## 🚀 Quick Commands

### Sync Everything (Recommended)

```bash
npm run git:sync
```

**What it does:**
```
┌─────────────────────────────────────┐
│  1. Fetch all remote changes        │
│  2. Update main branch              │
│  3. Update all tracking branches    │
│  4. Clean up stale references       │
│  5. Return to original branch       │
└─────────────────────────────────────┘
```

### Check Status

```bash
npm run git:status
```

**Shows:**
- ✓ Current branch
- ✓ All branches with tracking info
- ✓ Uncommitted changes
- ✓ Unpushed commits
- ✓ Remote repositories

### Interactive Helper

```bash
./scripts/git-helper.sh
```

**Menu options:**
1. Full sync
2. Quick status
3. Update main only
4. Show all branches
5. Create feature branch
6. Merge to main
7. Push current branch
8. Pull with rebase
9. Stash changes
10. Pop stash

---

## 📊 Git Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     TYPICAL WORKFLOW                          │
└──────────────────────────────────────────────────────────────┘

1. SYNC YOUR REPO
   ┌─────────────────┐
   │  npm run git:sync│
   └────────┬─────────┘
            │
            ▼
   ┌─────────────────┐
   │ All branches    │
   │ up to date!     │
   └────────┬─────────┘

2. CREATE FEATURE BRANCH
            │
            ▼
   ┌───────────────────────────┐
   │ git checkout -b feature/  │
   │     my-awesome-feature    │
   └───────────┬───────────────┘

3. MAKE CHANGES
            │
            ▼
   ┌───────────────────────────┐
   │  # Edit files             │
   │  git add .                │
   │  git commit -m "..."      │
   └───────────┬───────────────┘

4. PUSH TO REMOTE
            │
            ▼
   ┌───────────────────────────┐
   │  git push origin HEAD     │
   └───────────┬───────────────┘

5. MERGE TO MAIN
            │
            ▼
   ┌───────────────────────────┐
   │  git checkout main        │
   │  git merge feature/...    │
   │  git push origin main     │
   └───────────────────────────┘
```

---

## 🔄 Branch States

### ✅ Up to Date
```
Local:  A---B---C (main)
Remote: A---B---C (origin/main)
```
**Action:** None needed! You're synced.

### ⬇️ Behind Remote
```
Local:  A---B (main)
Remote: A---B---C---D (origin/main)
```
**Action:** `git pull --rebase origin main`

### ⬆️ Ahead of Remote
```
Local:  A---B---C---D (main)
Remote: A---B (origin/main)
```
**Action:** `git push origin main`

### ⚠️ Diverged
```
Local:  A---B---C (main)
Remote: A---B---X---Y (origin/main)
```
**Action:** 
1. `git pull --rebase origin main` (recommended)
2. Or `git pull origin main` (creates merge commit)

---

## 🎯 Common Scenarios

### Scenario 1: Start New Feature

```bash
# Sync everything first
npm run git:sync

# Create new branch from main
git checkout main
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-feature
```

### Scenario 2: Update Feature Branch with Latest Main

```bash
# Sync main branch
npm run git:sync

# Go to your feature branch
git checkout feature/my-feature

# Rebase on top of main
git rebase main

# Force push (if already pushed)
git push --force-with-lease origin feature/my-feature
```

### Scenario 3: Merge Feature to Main

```bash
# Sync everything
npm run git:sync

# Switch to main
git checkout main

# Merge feature branch
git merge feature/my-feature

# Push to remote
git push origin main

# Optional: Delete feature branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

### Scenario 4: Save Work in Progress

```bash
# Stash your changes
git stash push -m "WIP: working on feature X"

# Do other work...
git checkout main
git pull

# Return and restore
git checkout feature/my-feature
git stash pop
```

### Scenario 5: See What Changed

```bash
# Compare with remote
git fetch origin
git diff main origin/main

# See commits you don't have
git log main..origin/main

# See commits you haven't pushed
git log origin/main..main
```

---

## 🛠️ Troubleshooting

### Problem: Merge Conflict

```bash
# During merge or rebase
# 1. Edit conflicted files (look for <<<<<<)
# 2. Mark as resolved
git add conflicted-file.js

# 3. Continue
git rebase --continue  # or git merge --continue

# Or abort
git rebase --abort     # or git merge --abort
```

### Problem: Pushed Wrong Commit

```bash
# Undo last commit but keep changes
git reset --soft HEAD~1

# Undo last commit and discard changes (careful!)
git reset --hard HEAD~1

# Note: Don't force push if others have your branch
```

### Problem: Need to Undo Push

```bash
# Create a revert commit (safe)
git revert HEAD
git push origin HEAD

# Or force push (dangerous if others use branch)
git reset --hard HEAD~1
git push --force-with-lease origin HEAD
```

---

## 📝 Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructure
- `test:` Tests
- `chore:` Maintenance

**Examples:**
```bash
git commit -m "feat(ocr): add tesseract support"
git commit -m "fix(ui): resolve portal positioning bug"
git commit -m "docs: update git workflow guide"
```

---

## 🔗 Useful Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    # Quick commands
    st = status
    co = checkout
    br = branch
    ci = commit
    
    # GhostWriter specific
    sync = !./scripts/sync-branches.sh
    quick = !./scripts/git-status.sh
    
    # Pretty log
    lg = log --oneline --graph --decorate --all
    
    # Quick updates
    up = pull --rebase --autostash
    
    # Stash helpers
    save = stash push -m
    pop = stash pop
```

Then use:
```bash
git sync    # Full synchronization
git quick   # Quick status
git lg      # Pretty branch graph
git up      # Pull with rebase
```

---

## 📚 Learn More

- **Full Guide:** [GIT_WORKFLOW.md](GIT_WORKFLOW.md)
- **Git Documentation:** https://git-scm.com/doc
- **GitHub Flow:** https://guides.github.com/introduction/flow/
- **Interactive Learning:** https://learngitbranching.js.org/

---

## 🆘 Get Help

```bash
# Git help
git help <command>

# Script help
./scripts/sync-branches.sh --help
./scripts/git-helper.sh

# Check this guide
cat GIT_QUICK_REFERENCE.md
```

---

**Remember:** Always sync before starting new work! 🚀

```bash
npm run git:sync
```
