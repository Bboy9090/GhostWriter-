# CI/CD Git Synchronization Examples

Examples of using GhostWriter's git synchronization tools in automated workflows.

## GitHub Actions

### Example 1: Auto-sync on Schedule

```yaml
name: Auto Sync Branches

on:
  schedule:
    # Run every day at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Fetch all history
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git
        run: |
          git config --global user.name "github-actions[bot]"
          git config --global user.email "github-actions[bot]@users.noreply.github.com"

      - name: Run sync script
        run: |
          chmod +x ./scripts/sync-branches.sh
          ./scripts/sync-branches.sh

      - name: Show sync status
        run: |
          chmod +x ./scripts/git-status.sh
          ./scripts/git-status.sh
```

### Example 2: Sync Before Build

```yaml
name: Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Sync branches
        run: |
          chmod +x ./scripts/sync-branches.sh
          ./scripts/sync-branches.sh

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Test
        run: npm test
```

### Example 3: Auto-merge Dependabot PRs After Tests

```yaml
name: Auto-merge Dependabot

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  auto-merge:
    runs-on: ubuntu-latest
    if: github.actor == 'dependabot[bot]'
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Sync branches
        run: |
          chmod +x ./scripts/sync-branches.sh
          ./scripts/sync-branches.sh

      - name: Install and test
        run: |
          npm ci
          npm test

      - name: Enable auto-merge
        if: success()
        run: gh pr merge --auto --squash "$PR_URL"
        env:
          PR_URL: ${{ github.event.pull_request.html_url }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## GitLab CI

### Example 1: Auto Sync Pipeline

```yaml
# .gitlab-ci.yml

stages:
  - sync
  - build
  - test

sync-branches:
  stage: sync
  script:
    - chmod +x ./scripts/sync-branches.sh
    - ./scripts/sync-branches.sh
  only:
    - schedules
    - web

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

test:
  stage: test
  script:
    - npm ci
    - npm test
```

## Jenkins

### Example 1: Jenkinsfile with Git Sync

```groovy
pipeline {
    agent any

    triggers {
        cron('H 2 * * *') // Run nightly
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Sync Branches') {
            steps {
                sh '''
                    chmod +x ./scripts/sync-branches.sh
                    ./scripts/sync-branches.sh
                '''
            }
        }

        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Test') {
            steps {
                sh 'npm test'
            }
        }

        stage('Status Report') {
            steps {
                sh '''
                    chmod +x ./scripts/git-status.sh
                    ./scripts/git-status.sh
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
```

## Husky Git Hooks

### Pre-push Hook

```bash
# .husky/pre-push

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔄 Checking branch sync status..."

# Run status check
./scripts/git-status.sh

# Ask user to confirm if there are unpushed changes
read -p "Continue with push? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi
```

### Post-merge Hook

```bash
# .husky/post-merge

#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "📥 Merge complete. Checking if dependencies need updating..."

# Check if package.json or package-lock.json changed
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep --quiet "package.*json"; then
  echo "📦 Dependencies changed. Running npm install..."
  npm install
fi

echo "✅ Post-merge checks complete"
```

## Docker

### Example 1: Dockerfile with Git Sync

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy git scripts
COPY scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh

# Copy package files
COPY package*.json ./

# Sync branches (if in git repo)
RUN if [ -d .git ]; then ./scripts/sync-branches.sh; fi

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Local Development Scripts

### Example 1: Daily Sync Script

```bash
#!/bin/bash
# ~/bin/ghostwriter-sync.sh

cd ~/projects/GhostWriter- || exit 1

echo "🌅 Good morning! Syncing GhostWriter repository..."

# Run full sync
npm run git:sync

# Show status
npm run git:status

echo "✅ Repository synced and ready for development!"
```

Add to crontab:

```bash
# Run every weekday at 9 AM
0 9 * * 1-5 ~/bin/ghostwriter-sync.sh
```

### Example 2: Pre-work Checklist Script

```bash
#!/bin/bash
# scripts/pre-work.sh

echo "📋 Pre-work Checklist"
echo "===================="

# 1. Sync repository
echo "1. Syncing repository..."
./scripts/sync-branches.sh

# 2. Check status
echo ""
echo "2. Current status:"
./scripts/git-status.sh

# 3. Check for updates
echo ""
echo "3. Checking for npm updates..."
npm outdated

# 4. Run tests
echo ""
echo "4. Running tests..."
npm test

echo ""
echo "✅ Ready to work!"
```

## Make it executable

```bash
chmod +x scripts/pre-work.sh
```

## NPM Scripts Integration

Add to `package.json`:

```json
{
  "scripts": {
    "predev": "npm run git:sync",
    "prebuild": "npm run git:status",
    "pretest": "npm run git:status",
    "morning": "./scripts/pre-work.sh"
  }
}
```

Usage:

```bash
npm run morning  # Run morning checklist
npm run dev      # Auto-syncs before starting
```

## Git Aliases

Add to `~/.gitconfig`:

```ini
[alias]
    # GhostWriter specific
    gw-sync = !cd $(git rev-parse --show-toplevel) && ./scripts/sync-branches.sh
    gw-status = !cd $(git rev-parse --show-toplevel) && ./scripts/git-status.sh
    gw-helper = !cd $(git rev-parse --show-toplevel) && ./scripts/git-helper.sh
```

Usage from anywhere in the repo:

```bash
git gw-sync    # Full sync
git gw-status  # Quick status
git gw-helper  # Interactive menu
```

## Monitoring and Notifications

### Slack Notification Example

```bash
#!/bin/bash
# scripts/sync-and-notify.sh

SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Run sync
OUTPUT=$(./scripts/sync-branches.sh 2>&1)
STATUS=$?

if [ $STATUS -eq 0 ]; then
    MESSAGE="✅ GhostWriter repository synced successfully"
    COLOR="good"
else
    MESSAGE="❌ GhostWriter repository sync failed"
    COLOR="danger"
fi

# Send to Slack
curl -X POST -H 'Content-type: application/json' \
    --data "{
        \"attachments\": [{
            \"color\": \"$COLOR\",
            \"title\": \"Git Sync Report\",
            \"text\": \"$MESSAGE\",
            \"footer\": \"GhostWriter CI/CD\"
        }]
    }" \
    $SLACK_WEBHOOK
```

## Email Notification Example

```bash
#!/bin/bash
# scripts/sync-and-email.sh

RECIPIENT="dev@example.com"

# Run sync and capture output
OUTPUT=$(./scripts/sync-branches.sh 2>&1)
STATUS=$?

if [ $STATUS -eq 0 ]; then
    SUBJECT="✅ Git Sync Successful"
else
    SUBJECT="❌ Git Sync Failed"
fi

# Send email
echo "$OUTPUT" | mail -s "$SUBJECT" "$RECIPIENT"
```

---

## Best Practices for CI/CD

1. **Always fetch before operations**

   ```bash
   git fetch --all --prune
   ```

2. **Use specific branch names**

   ```bash
   git checkout main  # Not just 'git checkout'
   ```

3. **Configure git identity**

   ```bash
   git config user.name "CI Bot"
   git config user.email "ci@example.com"
   ```

4. **Handle authentication securely**
   - Use `GITHUB_TOKEN` in GitHub Actions
   - Use deploy keys or tokens, not passwords
   - Store credentials in CI/CD secrets

5. **Clean workspace**

   ```bash
   git clean -ffdx  # Remove all untracked files
   ```

6. **Fail fast**
   ```bash
   set -e  # Exit on any error
   ```

---

## Troubleshooting CI/CD

### Problem: Permission Denied

```bash
# Make scripts executable in CI
chmod +x ./scripts/*.sh
```

### Problem: Detached HEAD

```bash
# Always checkout a branch in CI
git checkout ${BRANCH_NAME}
```

### Problem: Authentication Failed

```yaml
# GitHub Actions - use token
- uses: actions/checkout@v4
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
```

---

For more information, see:

- [GIT_WORKFLOW.md](GIT_WORKFLOW.md) - Complete workflow guide
- [GIT_QUICK_REFERENCE.md](GIT_QUICK_REFERENCE.md) - Quick command reference
