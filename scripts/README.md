# Scripts Directory

This directory contains utility scripts for repository management.

## Available Scripts

### branch-cleanup.sh

Automated script to help merge priority branches into main and delete obsolete branches.

**Usage:**
```bash
# See what would happen (recommended first step)
./scripts/branch-cleanup.sh --dry-run

# Merge all priority branches
./scripts/branch-cleanup.sh --merge-only

# Delete obsolete branches (after merging)
./scripts/branch-cleanup.sh --delete-only

# Do everything (merge and delete)
./scripts/branch-cleanup.sh
```

**Features:**
- ✅ Dry-run mode to preview changes
- ✅ Automatic conflict detection
- ✅ Colored output for easy reading
- ✅ Progress tracking
- ✅ Safety confirmations
- ✅ Separate merge and delete phases

**Prerequisites:**
- Git installed
- Write access to the repository
- Currently in the repository directory

**Safety Features:**
- Asks for confirmation before deleting branches
- Stops on merge conflicts
- Validates branch existence before operations
- Can be run in phases (merge first, delete later)

**Example Workflow:**
```bash
# 1. See what will happen
./scripts/branch-cleanup.sh --dry-run

# 2. Merge all priority branches
./scripts/branch-cleanup.sh --merge-only

# 3. Test your application

# 4. If everything works, delete old branches
./scripts/branch-cleanup.sh --delete-only
```

---

## Need Help?

See the main guides:
- `BRANCH_CLEANUP_GUIDE.md` - Simple step-by-step instructions
- `BRANCH_CLEANUP_ANALYSIS.md` - Detailed branch analysis

## Contributing

When adding new scripts:
1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add usage documentation to this README
3. Include a `--help` option
4. Add a `--dry-run` option for safety
