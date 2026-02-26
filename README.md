# GhostWriter

**Stealth screen text extraction.** Capture the thought, leave no trace.

GhostWriter portals screen text into a private, AI-searchable vault with on-device OCR, LLM healing, and real-time sync.

---

## ✨ What It Does

- **iPhone Capture** – Upload screenshots or screen recordings from ChatGPT, Gemini, or any app. OCR extracts text and stitches it into one clean note with deduplication.
- **Live Capture** – Android overlay captures screen text in real time via MediaProjection.
- **Semantic Vault** – Search extracted text with vector similarity (pgvector).
- **Phase-Shift Pipeline** – OCR → dedup gate → healer pass → vault sync.

---

## 📱 iPhone Capture (Screenshots & Recordings)

iOS doesn't allow live capture of other apps. GhostWriter's workaround:

1. Take **screenshots** or **record your screen** while scrolling a thread
2. Tap **More** → **iPhone Capture** in the app
3. Tap the upload area or drag files to add screenshots/recordings
4. Run **OCR** to extract text into one consolidated note

**Supported formats:** PNG, JPEG, HEIC (screenshots) · MOV, MP4, M4V (recordings)

See [IPHONE_CAPTURE_VAULT_GUIDE.md](./IPHONE_CAPTURE_VAULT_GUIDE.md) for full docs.

---

## 🚀 Deploy

**Save money!** Deploy for **$0/month** with 24/7 uptime:

- 🏆 **[Render.com](https://render.com)** – FREE with UptimeRobot keep-alive
- 🚀 **[Fly.io](https://fly.io)** – FREE tier (256MB RAM × 3 VMs)
- 🎨 **[Railway.app](https://railway.app)** – $5 free credit/month

**Full guide:** [FREE_TIER_DEPLOYMENT.md](./FREE_TIER_DEPLOYMENT.md)

### Deploy to Render.com (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Bboy9090/GhostWriter-)

Uses `render.yaml` Blueprint: static site, Go API, PostgreSQL, Redis.

**Keep awake:** Add [UptimeRobot](https://uptimerobot.com) monitor for `https://ghostwriter-api.onrender.com/health` (every 5 min).

**Troubleshooting:** [RENDER_TROUBLESHOOTING.md](./RENDER_TROUBLESHOOTING.md)

### Deploy to Vercel (Frontend only)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FBboy9090%2FGhostWriter-)

See [ONE_CLICK_DEPLOY.md](./ONE_CLICK_DEPLOY.md).

### Deploy to Fly.io

```bash
flyctl auth login
flyctl launch
flyctl deploy
```

---

## 💻 Run Locally

**Prerequisites:** Node.js 20+, npm

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

**Build:**

```bash
npm run build
```

Output in `dist/`.

---

## 🏗️ Architecture

- **Frontend:** React + TypeScript + Vite
- **OCR:** Tesseract.js (browser)
- **Backend:** Go (Fiber, WebSocket, pgvector, Redis)
- **iOS:** Vision OCR, WebSocket client (see `ios-native/`)

---

## 📂 Key Files

| Path                                | Purpose                                  |
| ----------------------------------- | ---------------------------------------- |
| `src/components/IOSCapture.tsx`     | iPhone screenshot/recording upload + OCR |
| `src/components/FloatingPortal.tsx` | Android overlay capture                  |
| `backend-go/`                       | Go API, WebSocket, embeddings            |
| `ios-native/`                       | iOS Swift app (Vision OCR)               |
| `render.yaml`                       | Render Blueprint                         |
| `RENDER_TROUBLESHOOTING.md`         | Deployment fixes                         |

---

## 📄 License

MIT License.
