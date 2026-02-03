# 🚀 Deployment Guide - Vercel

GhostWriter is optimized for deployment on **Vercel**. This guide covers everything you need to deploy successfully.

## 📋 Prerequisites

- GitHub repository with your code
- Vercel account
- Environment variables configured

## ⚡ Vercel Deployment

### Quick Start

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click **Add New...** → **Project**
   - Import your GitHub repository

2. **Auto-Configuration**:
   - Vercel auto-detects `vercel.json`
   - Automatically configures build settings
   - Framework: Vite (auto-detected)

3. **Environment Variables**:
   - Go to **Settings** → **Environment Variables**
   - Add:
     ```
     NODE_ENV=production
     VITE_API_URL=https://your-api-url.com
     ```

4. **Deploy**:
   - Click **Deploy**
   - Vercel builds and deploys automatically
   - Get your public URL instantly!

### Using vercel.json (Recommended)

The `vercel.json` file is already configured with:
- ✅ Build command: `npm ci && npm run build`
- ✅ Output directory: `dist`
- ✅ SPA routing: All routes → `/index.html`
- ✅ Asset caching: Long-term cache for static assets

### Vercel Settings

- **Framework**: Vite (auto-detected)
- **Build Command**: `npm ci && npm run build` (from `vercel.json`)
- **Output Directory**: `dist` (Vite output)
- **Install Command**: `npm ci` (clean install)
- **Node Version**: 20+ (auto-detected from `package.json`)

## 🔧 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `VITE_API_URL` | Backend API URL | `https://api.example.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_WS_URL` | WebSocket URL | Auto-detected |
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `false` |

## 📦 Build Configuration

### Build Process

1. **Install Dependencies**: `npm ci` (clean install)
2. **Type Check**: `tsc` (TypeScript validation)
3. **Build**: `vite build` (production bundle)
4. **Output**: `dist/` directory

### Build Output

- **Static Files**: All assets in `dist/`
- **Index**: `dist/index.html`
- **Assets**: `dist/assets/` (JS, CSS, images)

## 🎯 Production Optimizations

### Already Configured

- ✅ **Code Splitting**: Manual chunks for React, UI, utils
- ✅ **Minification**: Terser with console removal
- ✅ **Source Maps**: Dev only (smaller prod builds)
- ✅ **Tree Shaking**: Automatic dead code elimination
- ✅ **Asset Optimization**: Automatic image/asset optimization
- ✅ **Asset Caching**: Long-term cache headers for static assets

### Performance Features

- **Bundle Analysis**: Run `npm run analyze` locally
- **Web Vitals**: Monitored in production
- **Lazy Loading**: Route-based code splitting
- **PWA Support**: Service worker for offline use
- **Edge Network**: Vercel's global CDN

## 📱 Mobile Deployment

### iPhone PWA

1. **Deploy to Vercel**
2. **Open on iPhone Safari**
3. **Add to Home Screen**
4. **Floating Portal works!**

### Android PWA

1. **Deploy to Vercel**
2. **Open in Chrome**
3. **Add to Home Screen**
4. **Full PWA experience**

## 🔒 Security Considerations

### HTTPS

- **Vercel**: Automatic HTTPS (all plans)
- **Custom Domain**: Free SSL certificates
- **HSTS**: Enabled by default

### Environment Variables

- ✅ Never commit secrets to git
- ✅ Use Vercel's secret management
- ✅ Rotate keys regularly
- ✅ Separate env vars for preview/production

### CORS

If your API is on a different domain:

```javascript
// Backend must allow your frontend domain
Access-Control-Allow-Origin: https://your-app.vercel.app
```

## 🐛 Troubleshooting

### Build Fails

**Error**: `npm ci` fails
- **Fix**: Check `package-lock.json` is committed
- **Fix**: Ensure Node.js version matches (20+)

**Error**: TypeScript errors
- **Fix**: Run `npm run type-check` locally first
- **Fix**: Fix all TypeScript errors before deploying

### App Not Loading

**Error**: Blank page
- **Check**: Browser console for errors
- **Check**: Network tab for failed requests
- **Check**: `VITE_API_URL` is correct

**Error**: 404 on routes
- **Fix**: `vercel.json` already configured for SPA routing
- **Fix**: Ensure `rewrites` rule is present

### Routing Issues

Vercel handles SPA routing automatically via `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 📊 Monitoring

### Vercel Analytics

- **Metrics**: Built-in dashboard
- **Logs**: Real-time log streaming
- **Analytics**: Web Vitals tracking
- **Speed Insights**: Performance monitoring

### Alerts

- **Email**: Deployment notifications
- **Slack**: Integration available
- **Discord**: Integration available

## 🔄 Auto-Deploy

### Vercel

- **Default**: Auto-deploys on push to `main`
- **Manual**: Deploy from dashboard
- **Preview**: Deploys PRs automatically
- **Branch Deploys**: Automatic for all branches

## 🚀 Quick Deploy Commands

### Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Git Integration

```bash
# Just push to GitHub
git push origin main

# Vercel auto-deploys!
```

## 📝 Deployment Checklist

- [ ] Repository connected to Vercel
- [ ] Environment variables set
- [ ] `vercel.json` configured
- [ ] Build command verified
- [ ] Output directory verified
- [ ] SPA routing configured
- [ ] HTTPS enabled (automatic)
- [ ] Custom domain configured (optional)
- [ ] Analytics enabled (optional)

## 🎉 Post-Deployment

1. **Test the URL**: Open your deployed app
2. **Test Mobile**: Open on iPhone/Android
3. **Test PWA**: Add to Home Screen
4. **Test Portal**: Verify floating portal works
5. **Test Capture**: Verify OCR capture works
6. **Test Routes**: Navigate to different pages

## 🌍 Custom Domain

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records
4. SSL certificate auto-provisioned

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [PWA Guide](https://web.dev/progressive-web-apps/)
- [Vercel CLI](https://vercel.com/docs/cli)

---

**Your GhostWriter app is now live on Vercel! 👻🚀**
