# 📋 Deployment Checklist for GhostWriter

Use this checklist to ensure a smooth deployment process.

## 🎯 Pre-Deployment

### Code Quality

- [ ] All tests passing (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors or warnings in dev mode

### Documentation

- [ ] README.md is up to date
- [ ] DEPLOYMENT.md reviewed
- [ ] Environment variables documented
- [ ] API endpoints documented (if backend changes)

### Version Control

- [ ] All changes committed
- [ ] Working on correct branch
- [ ] No uncommitted changes
- [ ] Changes pushed to GitHub

## 🚀 Frontend Deployment (Vercel)

### Initial Setup (One-Time)

- [ ] Vercel account created
- [ ] GitHub repository connected to Vercel
- [ ] Project imported to Vercel
- [ ] Vercel CLI installed (`npm i -g vercel`)

### Configuration

- [ ] Environment variables set in Vercel dashboard:
  - [ ] `NODE_ENV=production`
  - [ ] `VITE_API_URL` (your backend URL)
  - [ ] `VITE_WS_URL` (WebSocket URL)
- [ ] `vercel.json` configuration verified
- [ ] Build command correct: `npm ci && npm run build`
- [ ] Output directory correct: `dist`

### Deployment

- [ ] Push to `main` branch (triggers auto-deploy) OR
- [ ] Run `vercel --prod` manually
- [ ] Deployment successful (check Vercel dashboard)
- [ ] No build errors in logs

### Post-Deployment Verification

- [ ] Site loads correctly
- [ ] No console errors in browser
- [ ] All routes work (test navigation)
- [ ] Assets loading (images, icons, fonts)
- [ ] API connection works
- [ ] WebSocket connection established
- [ ] Mobile responsive design works
- [ ] PWA install prompt works

## 🔧 Backend Deployment (Docker)

### Initial Setup

- [ ] Docker and Docker Compose installed
- [ ] Server/VPS access configured
- [ ] Domain/subdomain configured (if applicable)

### Configuration

- [ ] `backend-go/.env` file created from template
- [ ] Environment variables configured:
  - [ ] `DB_URL` (PostgreSQL connection)
  - [ ] `REDIS_URL` (Redis connection)
  - [ ] `OPENAI_API_KEY` (for embeddings)
  - [ ] `JWT_SECRET` (generate secure secret)
  - [ ] APNS settings (if using iOS push)

### Deployment

- [ ] Build backend image: `docker-compose build ghost-api`
- [ ] Start all services: `docker-compose up -d`
- [ ] Check services status: `docker-compose ps`
- [ ] View logs: `docker-compose logs -f`

### Post-Deployment Verification

- [ ] Health check passes: `curl http://localhost:8080/health`
- [ ] PostgreSQL accessible and initialized
- [ ] Redis accessible
- [ ] WebSocket endpoint accessible
- [ ] API endpoints responding
- [ ] Database migrations applied
- [ ] Vector embeddings working

## 🔗 Integration Testing

### Frontend ↔ Backend

- [ ] Frontend can reach backend API
- [ ] CORS configured correctly
- [ ] WebSocket connection established
- [ ] Authentication working (if implemented)
- [ ] Data flows correctly between frontend/backend

### End-to-End Features

- [ ] Text capture works
- [ ] OCR processing works
- [ ] Text saves to database
- [ ] Search functionality works
- [ ] Semantic search returns results
- [ ] Real-time sync via WebSocket
- [ ] Push notifications work (if enabled)

## 📱 Mobile Testing

### PWA Installation

- [ ] Install prompt appears on mobile
- [ ] Add to Home Screen works
- [ ] App launches from home screen
- [ ] Offline functionality works (if implemented)
- [ ] Icons display correctly

### iOS Testing

- [ ] Works on iPhone Safari
- [ ] Floating portal functional
- [ ] Touch interactions work
- [ ] Safe area handling correct
- [ ] Camera/file upload works

### Android Testing

- [ ] Works on Chrome/Android
- [ ] PWA install works
- [ ] Touch interactions work
- [ ] Camera/file upload works

## 🔒 Security

### SSL/HTTPS

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Backend uses HTTPS (if public)
- [ ] WebSocket uses WSS protocol (secure)
- [ ] No mixed content warnings

### Secrets Management

- [ ] No secrets in git repository
- [ ] Environment variables properly secured
- [ ] API keys rotated if exposed
- [ ] Database credentials secure
- [ ] JWT secret is strong and unique

### Security Headers

- [ ] CSP headers configured (if needed)
- [ ] CORS properly configured
- [ ] Rate limiting configured (backend)
- [ ] Input validation in place

## 📊 Monitoring & Performance

### Monitoring Setup

- [ ] Vercel Analytics enabled
- [ ] Backend logging configured
- [ ] Error tracking setup (optional)
- [ ] Performance monitoring (optional)

### Performance Checks

- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3.5s
- [ ] Bundle size reasonable
- [ ] Images optimized
- [ ] API response times acceptable

## 🎉 Go-Live

### Final Checks

- [ ] All checklist items completed
- [ ] Team notified of deployment
- [ ] Documentation updated
- [ ] Rollback plan in place
- [ ] Support contacts available

### Announcement

- [ ] Update status page (if applicable)
- [ ] Notify users (if applicable)
- [ ] Share deployment URL
- [ ] Celebrate! 🎉

## 🐛 Troubleshooting

### Common Issues

**Build fails on Vercel:**

- Check Node.js version (needs 20+)
- Verify `package-lock.json` is committed
- Check environment variables
- Review build logs in Vercel

**Backend won't start:**

- Check Docker logs: `docker-compose logs ghost-api`
- Verify database connection
- Check environment variables
- Ensure PostgreSQL has pgvector extension

**WebSocket won't connect:**

- Verify WebSocket URL uses `wss://` in production
- Check CORS settings
- Verify firewall allows WebSocket
- Check backend logs for connection errors

**Database connection fails:**

- Verify PostgreSQL is running
- Check connection string format
- Ensure database exists
- Check pgvector extension installed

## 📚 Resources

- [DEPLOY_QUICK_START.md](./DEPLOY_QUICK_START.md) - Quick deployment guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed Vercel guide
- [backend-go/README.md](./backend-go/README.md) - Backend setup
- [Vercel Docs](https://vercel.com/docs)
- [Docker Docs](https://docs.docker.com/)

---

**Last Updated:** 2026-01-27
**Version:** 1.0.0
