# Render Deployment Troubleshooting

## Common failure causes

### 1. **Static site build fails**

**Check:** Render dashboard → ghostwriter → Logs

**Causes:**

- **Missing devDependencies:** Ensure build command uses `NODE_ENV=development` before `npm ci` so Vite and Tailwind install.
- **Node version:** Project needs Node 20+. Add to Render: Environment → `NODE_VERSION` = `20` (or set in Render's Build settings).

### 2. **ghostwriter-api (Go) build fails**

**Check:** Render dashboard → ghostwriter-api → Logs

**Causes:**

- **go.mod path:** Module is `github.com/Bboy9090/GhostWriter/backend-go`. If you forked/renamed the repo, update `go.mod` to match.
- **Database not ready:** First deploy can fail if DB isn't provisioned yet. Retry the deploy after DB shows "Available".

### 3. **fromService / env var resolution fails**

**Cause:** Static site references `ghostwriter-api` via `fromService`. If the API service doesn't exist or isn't deployed yet, the static site build can fail.

**Fix:** Services are ordered in `render.yaml` so the API is created before the static site. If you still see this, try:

1. Manual sync: Blueprint → Manual sync
2. Deploy API first, wait for it to be Live, then deploy the static site

### 4. **Database connection fails**

**Check:** ghostwriter-api logs for `Failed to connect to database`

**Causes:**

- Internal DB URL not ready yet on first deploy
- SSL mode: Render Postgres may require `?sslmode=require`. The connection string from `fromDatabase` usually includes this.

### 5. **"Associate existing services" vs "Create all as new"**

- **Create all as new:** Use when deploying for the first time or when you want separate instances.
- **Associate existing:** Use when you already have services and want to attach them to this Blueprint. Only choose if those services were created by this same Blueprint before.

## Getting the actual error

1. Go to **Render Dashboard** → your service (ghostwriter, ghostwriter-api, etc.)
2. Click **Logs**
3. Scroll to the **Build** section for build failures, or **Deploy** for runtime failures
4. The last lines usually show the exact error (e.g. `npm ERR!`, `go: ...`, `Failed to connect`)

## Quick fixes to try

| Failure                   | Fix                                                           |
| ------------------------- | ------------------------------------------------------------- |
| `npm ci` omits packages   | Build command: `NODE_ENV=development npm ci && npm run build` |
| `go: module not found`    | Check `go.mod` module path matches repo                       |
| `fromService` unresolved  | Re-sync Blueprint; ensure API deploys before static site      |
| 502 / service unreachable | Check health check path `/health` exists on API               |
