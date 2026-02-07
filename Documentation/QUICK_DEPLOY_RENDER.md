# 🚀 Quick Deploy to Render

This is the fastest way to deploy your Digital Will application to Render.

## ⚡ One-Command Setup

Run this script to prepare your code for deployment:

```bash
./render-deploy-setup.sh
```

This script will:
- ✅ Check your git setup
- ✅ Commit any pending changes
- ✅ Push to GitHub
- ✅ Show you next steps

## 📋 3-Step Deployment

### Step 1: Set Up MongoDB Atlas (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster (M0)
3. Create a database user
4. Whitelist all IPs: `0.0.0.0/0`
5. Copy your connection string

### Step 2: Deploy to Render (2 minutes)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render will detect `render.yaml`
5. Set the `MONGODB_URI` environment variable
6. Click **Apply**

### Step 3: Configure URLs (2 minutes)

1. **After backend deploys:**
   - Copy the backend URL (e.g., `https://digital-will-backend.onrender.com`)
   - In Render dashboard, go to backend service
   - Add environment variable: `FRONTEND_URL=<your-frontend-url-here>`

2. **After frontend deploys:**
   - Copy the frontend URL
   - Update `.env.production` with backend URL
   - Push changes to GitHub
   - Render will auto-redeploy

## ✅ Done!

Your app is now live! Visit your frontend URL to use it.

## 📚 Need More Details?

- **Full Guide:** [RENDER_DEPLOYMENT_GUIDE.md](RENDER_DEPLOYMENT_GUIDE.md)
- **Checklist:** [RENDER_DEPLOYMENT_CHECKLIST.md](RENDER_DEPLOYMENT_CHECKLIST.md)
- **Troubleshooting:** See the full guide

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check logs in Render dashboard, ensure dependencies are correct |
| CORS error | Update `FRONTEND_URL` in backend environment variables |
| Can't connect to DB | Verify MongoDB connection string and network access |
| 404 errors | Ensure rewrite rule `/* → /index.html` is set for frontend |

## 💰 Cost

- **Free tier:** Backend + Frontend + MongoDB Atlas = $0/month
- **Limitations:** Services spin down after 15 min inactivity
- **Paid option:** $7/month for always-on backend

---

**Need help?** Check the [full deployment guide](RENDER_DEPLOYMENT_GUIDE.md) for detailed instructions and troubleshooting.
