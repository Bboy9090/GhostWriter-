# Git Workflow & Branch Synchronization Guide

This guide helps you keep all branches synchronized and ensures the main branch has all the latest updates.

## Quick Start

### One-Command Synchronization

Run the automated synchronization script:

```bash
./scripts/sync-branches.sh
```

This script will:

- ✅ Fetch all changes from all remotes
- ✅ Identify and update your main/master branch
- ✅ Update all local branches that track remote branches
- ✅ Clean up stale remote references
- ✅ Return you to your original branch
- ✅ Show a clear summary of all changes

## Manual Workflow

If you prefer to run commands manually, follow these steps:

### 1. Fetch All Remote Changes

```bash
# Fetch from all remotes and prune deleted branches
git fetch --all --prune --tags
```

This downloads all changes from remote repositories without modifying your local branches.

### 2. Update Main Branch

```bash
# Switch to main branch
git checkout main

# Pull latest changes with rebase
git pull --rebase origin main
```

If you use `master` instead of `main`:

```bash
git checkout master
git pull --rebase origin master
```

### 3. Update Other Branches

For each branch you want to update:

```bash
# Switch to the branch
git checkout feature-branch-name

# Rebase on top of main
git rebase main

# Or merge main into it
git merge main
```

### 4. Push Local Changes

After updating branches locally, push them to remote:

```bash
# Push current branch
git push origin HEAD

# Force push if you rebased (use with caution!)
git push --force-with-lease origin HEAD
```

### 5. Sync All Tracking Branches

To update all local branches that track remote branches:

```bash
# Create a script or run in a loop
for branch in $(git for-each-ref --format='%(refname:short)' refs/heads/); do
    echo "Updating $branch..."
    git checkout $branch
    git pull --rebase
done
```

## Common Scenarios

### Scenario 1: Merge Feature Branch into Main

```bash
# 1. Update main branch first
git checkout main
git pull --rebase origin main

# 2. Merge feature branch
git merge feature-branch-name

# 3. Push to remote
git push origin main
```

### Scenario 2: Rebase Feature Branch on Latest Main

```bash
# 1. Update main branch
git checkout main
git pull --rebase origin main

# 2. Switch to feature branch
git checkout feature-branch-name

# 3. Rebase on main
git rebase main

# 4. Force push (if needed)
git push --force-with-lease origin feature-branch-name
```

### Scenario 3: Pull Latest Changes from Multiple Branches

```bash
# Fetch everything
git fetch --all --prune

# List all remote branches
git branch -r

# Create local tracking branch for any remote branch
git checkout -b local-branch-name origin/remote-branch-name

# Or update existing tracking branch
git checkout local-branch-name
git pull --rebase
```

### Scenario 4: Sync Fork with Upstream

If you forked the repository:

```bash
# Add upstream remote (one time only)
git remote add upstream https://github.com/original-owner/GhostWriter-.git

# Fetch from upstream
git fetch upstream

# Update main from upstream
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

## Advanced Commands

### View All Branches with Status

```bash
# Show all branches with their upstream tracking
git branch -vv

# Show all branches including remotes
git branch -a
```

### Clean Up Old Branches

```bash
# Delete local branch
git branch -d branch-name

# Force delete local branch
git branch -D branch-name

# Delete remote branch
git push origin --delete branch-name

# Prune remote tracking branches
git remote prune origin
```

### Stash Changes Before Switching

```bash
# Save current changes
git stash push -m "Work in progress"

# Switch branches and sync
git checkout main
git pull --rebase

# Return and restore changes
git checkout feature-branch
git stash pop
```

### Check What Would Be Updated

```bash
# Fetch without merging
git fetch origin

# Compare with remote
git diff main origin/main

# See commits that would be pulled
git log main..origin/main
```

## NPM Scripts

Add these convenient commands to your workflow by adding them to `package.json`:

```json
{
  "scripts": {
    "git:sync": "./scripts/sync-branches.sh",
    "git:status": "git fetch --all && git status",
    "git:branches": "git branch -vv"
  }
}
```

Then run:

```bash
npm run git:sync    # Full synchronization
npm run git:status  # Quick status check
npm run git:branches # Show all branches
```

## Troubleshooting

### Merge Conflicts

If you encounter merge conflicts during sync:

```bash
# 1. View conflicted files
git status

# 2. Edit files to resolve conflicts
# (Look for <<<<<<, =====, >>>>>> markers)

# 3. Mark as resolved
git add resolved-file.js

# 4. Continue the merge/rebase
git rebase --continue
# or
git merge --continue

# 5. Abort if needed
git rebase --abort
# or
git merge --abort
```

### Diverged Branches

If your local branch has diverged from remote:

```bash
# Option 1: Rebase your changes on top of remote
git pull --rebase origin branch-name

# Option 2: Merge remote changes into your branch
git pull origin branch-name

# Option 3: Force remote to match local (dangerous!)
git push --force-with-lease origin branch-name
```

### Authentication Issues

If you get authentication errors:

```bash
# For HTTPS, update credentials
git config --global credential.helper store

# For SSH, verify keys
ssh -T git@github.com

# Switch from HTTPS to SSH
git remote set-url origin git@github.com:Bboy9090/GhostWriter-.git

# Switch from SSH to HTTPS
git remote set-url origin https://github.com/Bboy9090/GhostWriter-.git
```

## Best Practices

1. **Always fetch before starting work**

   ```bash
   git fetch --all
   ```

2. **Keep main branch clean**
   - Never work directly on main
   - Always create feature branches
   - Keep main in sync with remote

3. **Use meaningful branch names**

   ```bash
   git checkout -b feature/add-websocket-support
   git checkout -b fix/ocr-memory-leak
   git checkout -b docs/update-readme
   ```

4. **Commit often, push regularly**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin HEAD
   ```

5. **Use rebase for clean history**

   ```bash
   git pull --rebase  # instead of git pull
   ```

6. **Review before pushing**
   ```bash
   git diff origin/main..HEAD
   git log origin/main..HEAD
   ```

## Git Aliases

Add these aliases to `~/.gitconfig` for faster workflows:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    df = diff
    lg = log --oneline --graph --decorate --all
    sync = !./scripts/sync-branches.sh
    up = pull --rebase --autostash
    save = stash save
    pop = stash pop
    branches = branch -vv
    remotes = remote -v
```

Then use:

```bash
git sync      # Run synchronization
git up        # Pull with rebase and auto-stash
git lg        # Beautiful branch graph
git branches  # Show all branches with tracking
```

## Automated Synchronization

### Using the Sync Script

The included `scripts/sync-branches.sh` automates the entire process:

```bash
# Run synchronization
./scripts/sync-branches.sh

# Make it a git alias
git config --global alias.sync '!'"$(pwd)"'/scripts/sync-branches.sh'

# Now use as:
git sync
```

### What the Script Does

1. ✅ Verifies you're in a git repository
2. ✅ Saves your current branch
3. ✅ Fetches all remotes with pruning
4. ✅ Lists all available branches
5. ✅ Identifies main/master branch
6. ✅ Updates main branch from remote
7. ✅ Updates all tracking branches
8. ✅ Returns to your original branch
9. ✅ Shows final status and summary

## Additional Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)
- [Oh My Git!](https://ohmygit.org/) - Interactive Git learning game

---

**Need Help?** Open an issue or check existing issues at [GitHub Issues](https://github.com/Bboy9090/GhostWriter-/issues)
