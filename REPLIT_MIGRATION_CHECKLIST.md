# 📋 Replit Migration Checklist

**Complete step-by-step guide to migrate from Replit to free hosting**

Save $7-20/month and get better performance! ✨

---

## 🎯 Pre-Migration (5 minutes)

### 1. Gather Your Replit Information

- [ ] **List all environment variables**
  - Open your Replit project
  - Go to "Secrets" or ".env" file
  - Copy all variable names and values
  - Paste into a temporary text file (keep secure!)

- [ ] **Export your data** (if applicable)
  - Export any database backups
  - Download any uploaded files/assets
  - Save any configuration files

- [ ] **Document your current setup**
  - Note which services you're using
  - List any custom configurations
  - Take screenshots if helpful

### 2. Choose Your New Platform

**Recommended: Render.com** (see why below)

| Platform | Cost | Setup Time | Best For |
|----------|------|------------|----------|
| **Render.com** | $0 | 15 min | Zero cost, all-in-one |
| **Fly.io** | $0-2 | 10 min | True 24/7, no sleep |
| **Railway.app** | $0-5 | 5 min | Easiest setup |

👉 **For this checklist, we'll use Render.com** (recommended for you)

---

## 🚀 Migration Steps - Render.com (15 minutes)

### Step 1: Sign Up for Render (2 minutes)

- [ ] Go to [render.com](https://render.com)
- [ ] Click "Get Started" or "Sign Up"
- [ ] Sign up with your GitHub account (easiest)
- [ ] Verify your email if prompted
- [ ] No credit card required! ✅

### Step 2: Deploy PostgreSQL Database (3 minutes)

- [ ] In Render Dashboard, click "New +" in top right
- [ ] Select "PostgreSQL"
- [ ] Fill in details:
  ```
  Name: ghostwriter-db
  Database: ghostwriter_vault
  User: ghostwriter_user
  Region: [Choose closest to you]
  PostgreSQL Version: 16 (latest)
  Plan: Free
  ```
- [ ] Click "Create Database"
- [ ] Wait for database to provision (takes 1-2 min)
- [ ] **Important**: Copy the "Internal Database URL" from the database page
  - Looks like: `postgresql://ghostwriter_user:xxxx@hostname/ghostwriter_vault`
  - Save this URL in your text file!

### Step 3: Deploy Redis (2 minutes)

- [ ] Click "New +" → "Redis"
- [ ] Fill in details:
  ```
  Name: ghostwriter-redis
  Region: [Same as database]
  Plan: Free
  MaxMemory Policy: allkeys-lru (recommended)
  ```
- [ ] Click "Create Redis"
- [ ] **Important**: Copy the "Internal Redis URL"
  - Looks like: `redis://red-xxxx:6379`
  - Save this URL in your text file!

### Step 4: Deploy Backend API (4 minutes)

- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repository
  - Click "Connect GitHub"
  - Authorize Render to access your repos
  - Select your GhostWriter repository
- [ ] Fill in details:
  ```
  Name: ghostwriter-api
  Region: [Same as database]
  Branch: main
  Root Directory: backend-go
  Runtime: Go
  Build Command: go build -o bin/ghostwriter ./cmd/server
  Start Command: ./bin/ghostwriter
  Plan: Free
  ```
- [ ] Click "Advanced" to add environment variables:
  ```
  DB_URL = [Paste your PostgreSQL Internal URL]
  REDIS_URL = [Paste your Redis Internal URL]
  JWT_SECRET = [Generate random string - use: openssl rand -base64 32]
  PORT = 8080
  ```
- [ ] Add any other environment variables from your Replit
- [ ] Click "Create Web Service"
- [ ] Wait for deployment (takes 2-3 min)
- [ ] **Important**: Copy the service URL
  - Looks like: `https://ghostwriter-api.onrender.com`
  - Save this URL in your text file!

### Step 5: Deploy Frontend (4 minutes)

- [ ] Click "New +" → "Static Site"
- [ ] Connect your GitHub repository (if not already)
- [ ] Fill in details:
  ```
  Name: ghostwriter
  Branch: main
  Root Directory: [leave empty]
  Build Command: npm ci && npm run build
  Publish Directory: dist
  ```
- [ ] Click "Advanced" to add environment variables:
  ```
  NODE_ENV = production
  VITE_API_URL = [Your backend URL from Step 4]
  VITE_WS_URL = wss://[Your backend domain from Step 4]/ws
  ```
- [ ] Click "Create Static Site"
- [ ] Wait for build and deployment (takes 3-4 min)
- [ ] **Your app is live!** 🎉
- [ ] Copy the frontend URL
  - Looks like: `https://ghostwriter.onrender.com`
  - Save this URL!

---

## 🔄 Post-Migration Setup (10 minutes)

### Step 6: Setup Keep-Alive for 24/7 Uptime (5 minutes)

Render free tier sleeps after 15 min inactivity. Keep it awake with UptimeRobot:

- [ ] Go to [uptimerobot.com](https://uptimerobot.com)
- [ ] Sign up (free, no credit card needed)
- [ ] Click "Add New Monitor"
- [ ] Configure monitor:
  ```
  Monitor Type: HTTP(s)
  Friendly Name: GhostWriter API
  URL: [Your backend URL]/health
  Monitoring Interval: 5 minutes
  ```
- [ ] Click "Create Monitor"
- [ ] Monitor should show "Up" status (green)
- [ ] Done! Your app now stays awake 24/7 ✅

**Alternative**: Use GitHub Actions keep-alive (already included in repo)
- [ ] In GitHub, go to Settings → Secrets → Actions
- [ ] Add secret: `RENDER_SERVICE_URL` = your backend URL
- [ ] Workflow will ping every 5 minutes automatically

### Step 7: Test Your New Deployment (5 minutes)

- [ ] Open your frontend URL in browser
- [ ] Test login/PIN functionality
- [ ] Test screen capture feature
- [ ] Verify text is saved to vault
- [ ] Test search functionality
- [ ] Check data persists after closing/reopening
- [ ] Test on mobile (if applicable)

### Step 8: Verify 24/7 Uptime (Wait 1 hour)

- [ ] Wait 1 hour without using the app
- [ ] Check UptimeRobot dashboard (should show "Up")
- [ ] Open your app again - should load instantly
- [ ] If app is slow to load, UptimeRobot isn't working (check URL)

---

## 🗑️ Decommission Replit (2 minutes)

**Only do this after confirming everything works!**

### Final Checks Before Deletion

- [ ] Verify your new deployment works perfectly
- [ ] Confirm all data is accessible
- [ ] Test all features work as expected
- [ ] Wait 24 hours to be sure

### Delete Replit Project

- [ ] Go to your Replit dashboard
- [ ] Open your project
- [ ] Click project name → Settings
- [ ] Scroll to bottom → "Delete Repl"
- [ ] Confirm deletion
- [ ] **Stop paying for Replit subscription** 💰

### Cancel Replit Subscription

- [ ] Go to Replit account settings
- [ ] Navigate to "Subscription" or "Billing"
- [ ] Click "Cancel Subscription"
- [ ] Confirm cancellation
- [ ] **You're now saving $7-20/month!** 🎉

---

## 💰 Verify Your Savings

### Calculate Your Savings

**Before (Replit)**:
- Monthly cost: $____ (Hacker $7 or Pro $20)
- Annual cost: $____ × 12

**After (Render + UptimeRobot)**:
- Monthly cost: $0 (completely free!)
- Annual cost: $0

**Total Savings**: $____ per month = $____ per year! 💸

---

## 📊 Success Metrics

After 24-48 hours, verify:

- [ ] ✅ Frontend loads in < 2 seconds
- [ ] ✅ Backend responds to API calls
- [ ] ✅ Database stores data correctly
- [ ] ✅ App doesn't go to sleep
- [ ] ✅ Screen capture works
- [ ] ✅ Search functionality works
- [ ] ✅ Data persists across browser sessions
- [ ] ✅ Mobile access works (if applicable)

---

## 🆘 Troubleshooting

### Problem: Database Connection Fails

**Error**: "Cannot connect to database"

**Solution**:
1. Check `DB_URL` in backend environment variables
2. Ensure database is "Available" in Render dashboard
3. Verify internal URL is used (not external)
4. Check firewall/network settings

### Problem: Backend Goes to Sleep

**Error**: App takes 30+ seconds to load after inactivity

**Solution**:
1. Verify UptimeRobot monitor is active
2. Check monitor URL is correct (should end with `/health`)
3. Ensure interval is 5 minutes or less
4. Check Render logs for errors

### Problem: Build Fails

**Error**: Deployment fails during build

**Solution**:
1. Check Node.js version (should be 20+)
2. Verify `package-lock.json` exists in repo
3. Check build command is correct
4. Review Render build logs for specific errors

### Problem: Frontend Can't Reach Backend

**Error**: API calls fail, CORS errors

**Solution**:
1. Verify `VITE_API_URL` matches your backend URL
2. Check backend is "Live" in Render dashboard
3. Test backend directly: `curl https://your-backend.onrender.com/health`
4. Ensure backend allows CORS from frontend domain

### Problem: Out of Memory (Free Tier)

**Error**: "Out of memory" or crashes

**Solution**:
1. Optimize your code (reduce memory usage)
2. Check for memory leaks
3. Consider upgrading to paid tier ($7/mo)
4. Or switch to Fly.io (better free tier resources)

---

## 📚 Additional Resources

**Documentation**:
- [FREE_TIER_DEPLOYMENT.md](./FREE_TIER_DEPLOYMENT.md) - Complete deployment guide
- [COST_OPTIMIZATION.md](./COST_OPTIMIZATION.md) - Detailed cost analysis
- [QUICK_DEPLOY_COMPARISON.md](./QUICK_DEPLOY_COMPARISON.md) - Platform comparison

**External Guides**:
- [Render Documentation](https://render.com/docs)
- [UptimeRobot Guide](https://uptimerobot.com/docs)
- [PostgreSQL Basics](https://www.postgresql.org/docs/)

**Need Help?**
- Open a GitHub issue with "migration" label
- Check Render community forums
- Review Render status page for outages

---

## 🎉 Congratulations!

You've successfully migrated from Replit to a free, 24/7 deployment!

**What You Achieved**:
- ✅ Saved $7-20/month ($84-240/year)
- ✅ Got 24/7 uptime
- ✅ Reduced deployment complexity (all-in-one platform)
- ✅ Maintained all functionality
- ✅ Improved reliability

**Next Steps**:
1. Monitor your app for 24-48 hours
2. Share your success (optional!)
3. Enjoy your savings! 💰

---

**🚀 Your GhostWriter app is now running on free, reliable hosting!**

**Total Migration Time**: ~25 minutes
**Annual Savings**: $84-240
**Setup Complexity**: Easy (followed checklist)
**Result**: 24/7 uptime at $0/month! 🎉

---

## ✅ Final Checklist Summary

### Completed Steps
- [ ] Exported data from Replit
- [ ] Signed up for Render.com
- [ ] Created PostgreSQL database
- [ ] Created Redis instance
- [ ] Deployed backend API
- [ ] Deployed frontend
- [ ] Setup keep-alive (UptimeRobot or GitHub Actions)
- [ ] Tested all functionality
- [ ] Verified 24/7 uptime
- [ ] Deleted Replit project
- [ ] Cancelled Replit subscription
- [ ] Calculated savings

**Status**: Complete! 🎉

**Your new URLs**:
- Frontend: ___________________________
- Backend: ___________________________
- Database: (internal only)
- Redis: (internal only)

**Keep these URLs safe for future reference!**
