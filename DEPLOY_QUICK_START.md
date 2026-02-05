# 🚀 Quick Deployment Guide

This guide helps you deploy GhostWriter quickly to production.

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) - Recommended ⭐

**Best for**: Quick deployment with zero configuration

1. **Prerequisites**:
   - GitHub account
   - Vercel account (free tier works)

2. **Deploy in 2 minutes**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login to Vercel
   vercel login

   # Deploy to production
   vercel --prod
   ```

3. **Or use GitHub Integration**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select this repository
   - Click "Deploy" (Vercel auto-detects settings from `vercel.json`)

4. **Set Environment Variables** (in Vercel Dashboard):

   ```
   NODE_ENV=production
   VITE_API_URL=https://your-backend-url.com
   ```

5. **Done!** 🎉 Your app is live at `https://your-app.vercel.app`

### Option 2: Docker Compose (Full Stack) - Local/VPS

**Best for**: Running the complete stack (frontend + backend + database)

1. **Prerequisites**:
   - Docker and Docker Compose installed
   - VPS or local machine

2. **Deploy**:

   ```bash
   # Clone the repository
   git clone https://github.com/Bboy9090/GhostWriter-.git
   cd GhostWriter-

   # Configure environment (backend)
   cd backend-go
   cp .env.template .env
   # Edit .env with your OpenAI API key and other settings
   cd ..

   # Start all services
   docker-compose up -d

   # Check status
   docker-compose ps
   ```

3. **Services running**:
   - Frontend: Build with `npm run build` and serve `dist/` folder
   - Backend API: `http://localhost:8080`
   - PostgreSQL: `localhost:5432`
   - Redis: `localhost:6379`

### Option 3: GitHub Actions (Automated) - CI/CD

**Best for**: Automated deployments on every push

1. **Setup Secrets** (GitHub Repository Settings → Secrets):

   For Vercel deployment:

   ```
   VERCEL_TOKEN=your_vercel_token
   VERCEL_ORG_ID=your_org_id
   VERCEL_PROJECT_ID=your_project_id
   ```

   For Docker deployment:

   ```
   DOCKER_USERNAME=your_dockerhub_username
   DOCKER_PASSWORD=your_dockerhub_password
   ```

2. **Enable Workflows**:
   - Push to `main` branch automatically triggers deployment
   - `.github/workflows/deploy.yml` - Frontend to Vercel
   - `.github/workflows/deploy-backend.yml` - Backend to Docker Hub

3. **Monitor Deployments**:
   - Go to "Actions" tab in GitHub
   - View deployment status and logs

## 🔧 Environment Variables

### Frontend (.env for local, Vercel UI for production)

```bash
NODE_ENV=production
VITE_API_URL=https://your-backend.com
VITE_WS_URL=wss://your-backend.com/ws
```

### Backend (backend-go/.env)

```bash
# Database
DB_URL=postgres://user:pass@host:5432/ghostwriter_vault?sslmode=disable

# Redis
REDIS_URL=redis-host:6379

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-key-here

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=8080

# APNS (Optional - for iOS push notifications)
APNS_AUTH_MODE=token
APNS_KEY_PATH=/path/to/AuthKey.p8
APNS_KEY_ID=your-key-id
APNS_TEAM_ID=your-team-id
APNS_TOPIC=com.yourapp.ghostwriter
APNS_PRODUCTION=false
```

## 📋 Deployment Checklist

### Frontend

- [ ] Repository pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured (optional)
- [ ] SSL certificate verified (automatic on Vercel)

### Backend

- [ ] Docker installed
- [ ] Environment variables configured in `.env`
- [ ] OpenAI API key obtained
- [ ] Database initialized with migrations
- [ ] Redis running
- [ ] Backend accessible via API endpoint

### Full Stack

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] Frontend connected to backend (`VITE_API_URL`)
- [ ] WebSocket connection working
- [ ] Database migrations applied
- [ ] Test capture and search functionality

## 🔍 Verifying Deployment

### Frontend Health Check

```bash
# Visit your deployed URL
curl https://your-app.vercel.app
```

### Backend Health Check

```bash
# Check API health
curl https://your-backend.com/health

# Expected response:
# {"status":"ok"}
```

### WebSocket Connection

```javascript
// Test WebSocket in browser console
const ws = new WebSocket('wss://your-backend.com/ws')
ws.onopen = () => console.log('✅ WebSocket connected')
ws.onerror = e => console.error('❌ WebSocket error:', e)
```

## 🚨 Troubleshooting

### Build Fails on Vercel

1. Check Node.js version matches `package.json` engines (20+)
2. Ensure `package-lock.json` is committed
3. Run `npm ci && npm run build` locally first
4. Check build logs in Vercel dashboard

### Backend Not Accessible

1. Check Docker container status: `docker-compose ps`
2. View logs: `docker-compose logs ghost-api`
3. Verify environment variables in `.env`
4. Ensure PostgreSQL and Redis are running

### Database Connection Fails

1. Check PostgreSQL is running: `docker-compose ps vault-db`
2. Verify connection string in `DB_URL`
3. Check database logs: `docker-compose logs vault-db`
4. Ensure pgvector extension is installed

### WebSocket Connection Fails

1. Check CORS settings on backend
2. Verify WebSocket URL uses `wss://` (not `ws://`) in production
3. Check firewall rules allow WebSocket connections
4. Test with WebSocket debugging tool

## 🎉 Post-Deployment

### Test the Application

1. **Capture Text**: Test OCR capture functionality
2. **Search**: Try semantic search in vault
3. **Mobile**: Test on iPhone/Android
4. **PWA**: Add to home screen and test offline

### Monitor Performance

1. **Vercel Analytics**: View traffic and performance
2. **Backend Logs**: Monitor with `docker-compose logs -f`
3. **Database**: Check PostgreSQL performance
4. **WebSocket**: Monitor active connections

### Scale (Optional)

1. **Vercel**: Automatic scaling (no action needed)
2. **Backend**: Deploy to Kubernetes/ECS for auto-scaling
3. **Database**: Consider managed PostgreSQL (AWS RDS, Supabase)
4. **Redis**: Consider managed Redis (AWS ElastiCache, Redis Cloud)

## 📚 Additional Resources

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed Vercel deployment guide
- [backend-go/README.md](./backend-go/README.md) - Backend setup guide
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Need help?** Open an issue on GitHub or check the documentation!

👻 Happy Deploying! 🚀
