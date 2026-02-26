# Deploy Frontend Only to Render.com

If you want to deploy just the GhostWriter frontend (no backend) as a static site on Render:

## Setup in Render Dashboard

1. **New** → **Static Site**
2. Connect your GitHub repo
3. Configure:
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
4. Add **Rewrite Rule** (for SPA routing): `/*` → `/index.html`
5. Deploy

## Build Notes

- Render may set `NODE_ENV=production` during build. If the build fails (missing devDependencies), set env var `NODE_ENV=development` for the build step.
- The frontend works standalone for iPhone Capture (OCR runs in-browser).
