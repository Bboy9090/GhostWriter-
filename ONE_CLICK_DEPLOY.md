# ⚡ One-Click Deployment

Deploy GhostWriter in under 60 seconds.

---

## 🚀 Option 1: Deploy with Vercel (Recommended)

**Zero config. Works immediately.**

### One-Click Button

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBboy9090%2FGhostWriter-)

1. Click the button above
2. Sign in with GitHub (if prompted)
3. Click **Deploy**
4. Done. Your app is live.

### Or: Connect GitHub Repo

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import `Bboy9090/GhostWriter-`
3. Vercel auto-detects `vercel.json` — no config needed
4. Click **Deploy**

**Auto-deploys:** Every push to `main` deploys automatically.

---

## 📦 Option 2: CLI Deploy (One Command)

```bash
npm run deploy
```

Requires: `npm i -g vercel` and `vercel login` once.

---

## 🔧 Option 3: GitHub Actions (Manual Trigger)

1. Go to **Actions** → **Deploy to Vercel**
2. Click **Run workflow** → **Run workflow**
3. Wait ~2 min. Check the workflow run for the deployment URL.

**Required secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`  
Add in: **Settings** → **Secrets and variables** → **Actions**

---

## Environment Variables (Optional)

| Variable       | Description                           |
| -------------- | ------------------------------------- |
| `VITE_API_URL` | Backend API URL (if using Go backend) |
| `VITE_WS_URL`  | WebSocket URL                         |

Set in Vercel: **Project** → **Settings** → **Environment Variables**

---

## Summary

| Method             | Setup               | Deploy           |
| ------------------ | ------------------- | ---------------- |
| **Vercel Button**  | None                | 1 click          |
| **GitHub Import**  | None                | 1 click          |
| **CLI**            | `vercel login` once | `npm run deploy` |
| **GitHub Actions** | Add 3 secrets       | Run workflow     |
