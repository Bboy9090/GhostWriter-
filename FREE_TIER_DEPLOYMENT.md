# 💰 Free Tier Deployment Guide - Zero Cost 24/7

This guide helps you deploy GhostWriter on **100% FREE** hosting platforms with **24/7 uptime** so you can save money and consolidate your deployment services.

## 🎯 Why This Guide?

- **Save Money**: No monthly hosting fees
- **24/7 Uptime**: Keep your text capture vault always available
- **Single Platform**: Reduce deployment complexity
- **Easy Migration**: Move from Replit in minutes

---

## 🏆 Best Free Option: Render.com (Recommended)

**Why Render?**
- ✅ Free PostgreSQL database (90 days, then auto-renews)
- ✅ Free Redis (25MB - perfect for our needs)
- ✅ Free web service (750 hours/month)
- ✅ Auto-sleep after 15 min inactivity (but can keep-alive)
- ✅ All services in ONE platform
- ✅ No credit card required

### Quick Deploy to Render (5 minutes)

1. **Sign up**: Go to [render.com](https://render.com) - Sign up with GitHub

2. **Deploy Database** (PostgreSQL):
   - Click "New +" → "PostgreSQL"
   - Name: `ghostwriter-db`
   - Database: `ghostwriter_vault`
   - User: `ghostwriter_user`
   - Region: Choose closest to you
   - Plan: **Free** 
   - Click "Create Database"
   - **Save the Internal Database URL** (looks like `postgresql://ghostwriter_user:password@hostname/ghostwriter_vault`)

3. **Deploy Redis**:
   - Click "New +" → "Redis"
   - Name: `ghostwriter-redis`
   - Plan: **Free** (25MB)
   - Click "Create Redis"
   - **Save the Internal Redis URL** (looks like `redis://red-xxx:6379`)

4. **Deploy Backend API**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `ghostwriter-api`
   - Region: Same as database
   - Root Directory: `backend-go`
   - Runtime: **Go**
   - Build Command: `go build -o bin/ghostwriter ./cmd/server`
   - Start Command: `./bin/ghostwriter`
   - Plan: **Free**
   - **Add Environment Variables**:
     ```
     DB_URL=<your-postgres-internal-url>
     REDIS_URL=<your-redis-internal-url>
     JWT_SECRET=your-random-secret-key-here
     PORT=8080
     ```
   - Click "Create Web Service"
   - **Save the API URL** (looks like `https://ghostwriter-api.onrender.com`)

5. **Deploy Frontend**:
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Name: `ghostwriter`
   - Build Command: `npm ci && npm run build`
   - Publish Directory: `dist`
   - **Add Environment Variable**:
     ```
     VITE_API_URL=<your-backend-api-url>
     VITE_WS_URL=wss://<your-backend-domain>/ws
     ```
   - Click "Create Static Site"

6. **Done! 🎉** Your GhostWriter is live on Render!

### Keep-Alive for 24/7 Uptime

Render free tier sleeps after 15 minutes of inactivity. To keep it awake 24/7:

**Option 1: UptimeRobot (Free & Easy)**
1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
2. Add New Monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://ghostwriter-api.onrender.com/health`
   - Monitoring Interval: 5 minutes
3. Done! Your app stays awake 24/7

**Option 2: Cron-job.org (Free Alternative)**
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - URL: `https://ghostwriter-api.onrender.com/health`
   - Interval: Every 5 minutes
3. Done!

---

## 🚀 Alternative Option: Fly.io Free Tier

**Why Fly.io?**
- ✅ 3 shared-cpu VMs (256MB RAM each) - FREE
- ✅ 3GB persistent volumes - FREE
- ✅ 160GB outbound data - FREE
- ✅ Global deployment
- ✅ No sleep/auto-pause

### Deploy to Fly.io (Already Configured!)

Your project already has `fly.toml` configured. Here's how to optimize for FREE tier:

1. **Install Fly CLI**:
   ```bash
   # Mac/Linux
   curl -L https://fly.io/install.sh | sh
   
   # Windows
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login**:
   ```bash
   flyctl auth login
   ```

3. **Update fly.toml for Free Tier**:
   ```toml
   app = 'ghostwriter'
   primary_region = 'iad'
   
   [build]
   
   [http_service]
     internal_port = 80
     force_https = true
     auto_stop_machines = false  # Keep running 24/7
     auto_start_machines = true
     min_machines_running = 1    # Always 1 running
     processes = ['app']
   
   [[vm]]
     cpu_kind = 'shared'
     cpus = 1
     memory_mb = 256  # Free tier limit
   ```

4. **Deploy**:
   ```bash
   flyctl deploy
   ```

5. **Set Secrets**:
   ```bash
   flyctl secrets set DB_URL="your-db-url"
   flyctl secrets set REDIS_URL="your-redis-url"
   flyctl secrets set JWT_SECRET="your-secret"
   ```

6. **Add Database (Fly Postgres)**:
   ```bash
   flyctl postgres create --name ghostwriter-db
   flyctl postgres attach ghostwriter-db
   ```

**Cost**: $0/month if you stay within free tier limits (3 VMs, 3GB storage)

---

## 💎 Alternative Option: Railway.app

**Why Railway?**
- ✅ $5 free credit monthly (no credit card needed)
- ✅ Easy deployment
- ✅ Built-in PostgreSQL and Redis
- ✅ No sleep/pause

### Deploy to Railway

1. **Sign up**: Go to [railway.app](https://railway.app) with GitHub

2. **Deploy from GitHub**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your GhostWriter repository
   - Railway auto-detects and deploys!

3. **Add PostgreSQL**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway auto-connects to your app

4. **Add Redis**:
   - Click "New" → "Database" → "Add Redis"
   - Railway auto-connects to your app

5. **Set Environment Variables**:
   - Railway auto-sets DB and Redis URLs
   - Add:
     ```
     JWT_SECRET=your-secret-key
     VITE_API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
     ```

6. **Done!** Railway handles everything automatically.

**Cost**: $0/month with $5 credit (renews monthly, enough for small apps)

---

## 🆓 Alternative Option: Vercel + Supabase

**Why This Combo?**
- ✅ Vercel: Free static hosting + Serverless functions
- ✅ Supabase: Free PostgreSQL (500MB) + Free Redis equivalent
- ✅ Both have generous free tiers
- ✅ No sleep/pause issues

### Setup

1. **Deploy Frontend to Vercel**:
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

2. **Setup Supabase (Database)**:
   - Sign up at [supabase.com](https://supabase.com)
   - Create new project
   - Get connection string from Settings → Database
   - Enable pgvector extension in SQL editor:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

3. **Deploy Backend to Vercel Serverless**:
   - Create `api/` directory in your project
   - Add serverless functions (Node.js)
   - Or use Fly.io/Render for backend (free tier)

**Cost**: $0/month for low-traffic apps

---

## 📊 Cost Comparison Table

| Platform | Frontend | Backend | Database | Redis | Monthly Cost | 24/7? | Sleep? |
|----------|----------|---------|----------|-------|--------------|-------|--------|
| **Render** | Free | Free | Free | Free | **$0** | ✅ | ⚠️ 15min (use keep-alive) |
| **Fly.io** | Free | Free | Free | - | **$0** | ✅ | ❌ |
| **Railway** | Free | Free | Free | Free | **$0** | ✅ | ❌ |
| **Vercel + Supabase** | Free | $0-7/mo | Free | - | **$0-7** | ✅ | ❌ |
| **Replit** | - | - | - | - | **$7-20/mo** | ✅ | ⚠️ |

**Winner for Zero Cost**: **Render.com** (with UptimeRobot for keep-alive)
**Winner for Simplicity**: **Railway.app** (auto-detects everything)
**Winner for Reliability**: **Fly.io** (no sleep, true 24/7)

---

## 🎯 Migration from Replit

### Step-by-Step Migration

1. **Export Your Data** (if any):
   - Go to your Replit project
   - Download any environment variables
   - Export database data (if applicable)

2. **Choose Your New Platform** (Recommended: Render or Fly.io)

3. **Follow Deployment Guide Above** for your chosen platform

4. **Update Environment Variables**:
   - Copy from Replit to new platform
   - Update any URLs/endpoints

5. **Test Your Deployment**:
   - Visit your new URL
   - Test text capture functionality
   - Verify data persistence

6. **Shutdown Replit**:
   - Once everything works, stop your Replit
   - Delete Replit project to avoid charges

**Migration Time**: 10-15 minutes

---

## 🔧 Environment Variables Checklist

Make sure these are set on your chosen platform:

### Backend
```bash
DB_URL=postgresql://user:pass@host/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-random-secret-key
PORT=8080
```

### Frontend
```bash
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com/ws
NODE_ENV=production
```

---

## 🚨 Free Tier Limitations & Workarounds

### Render.com
- **Limitation**: Sleeps after 15 min inactivity
- **Workaround**: Use UptimeRobot to ping every 5 min (free)

### Fly.io
- **Limitation**: 3 VMs limit (256MB each)
- **Workaround**: Optimize your app, use single VM for small apps

### Railway
- **Limitation**: $5 credit/month (~100 hours runtime)
- **Workaround**: Efficient resource usage, sleep during low traffic

### Vercel
- **Limitation**: Serverless function limits
- **Workaround**: Use separate backend on Render/Fly.io

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Frontend loads successfully
- [ ] Backend API responds (`/health` endpoint)
- [ ] Database connection works
- [ ] Redis connection works (if applicable)
- [ ] Text capture/OCR works
- [ ] Data persists across app restarts
- [ ] WebSocket connection works (if used)
- [ ] 24/7 uptime maintained (check after 24 hours)

---

## 🔗 Quick Links

- [Render.com](https://render.com) - Recommended for $0 deployment
- [Fly.io](https://fly.io) - Best for true 24/7 with no sleep
- [Railway.app](https://railway.app) - Easiest auto-deployment
- [UptimeRobot](https://uptimerobot.com) - Free keep-alive monitoring
- [Cron-job.org](https://cron-job.org) - Alternative keep-alive

---

## 💡 Pro Tips

1. **Use UptimeRobot**: Free monitoring + keeps Render awake 24/7
2. **Combine Platforms**: Vercel (frontend) + Render (backend) = Free!
3. **Environment Variables**: Store in platform, never commit secrets
4. **Monitoring**: Set up uptime monitoring on all platforms
5. **Backups**: Export data regularly (use export feature in app)

---

## 🆘 Troubleshooting

### App Sleeps on Render
- **Solution**: Add UptimeRobot monitor pinging every 5 minutes

### Build Fails
- **Solution**: Check Node.js version (need 20+), verify `package-lock.json` exists

### Database Connection Error
- **Solution**: Check `DB_URL` format, ensure database is running

### Out of Memory
- **Solution**: Use Fly.io with 256MB VM, optimize memory usage

---

**🎯 Bottom Line**: Use **Render.com + UptimeRobot** for completely FREE 24/7 deployment!

**Migration from Replit = $7-20/month saved! 💰**
