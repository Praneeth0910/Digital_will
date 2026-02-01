# 🚀 QUICK START - VERCEL DEPLOYMENT

## Prerequisites (1 minute)
```bash
# Install globally
npm install -g vercel

# Verify installation
vercel --version
node --version  # Must be 18+
git --version
```

## Deploy Frontend (3 minutes)

### Option 1: Using Deploy Script (Windows)
```bash
# Just run this in the project folder
deploy.bat
```

### Option 2: Using Deploy Script (Mac/Linux)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 3: Manual Vercel CLI
```bash
# In project root
vercel --prod

# Follow prompts:
# Framework: Vite
# Build Command: npm run build
# Output Directory: dist
# Install Command: npm install
```

## Configure Environment Variables (2 minutes)

After deployment:

1. Open https://vercel.com/dashboard
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   ```
   VITE_API_BASE_URL = https://your-backend-api.com/api
   ```
5. Click **Redeploy** on Deployments tab

## Get Your Live URL

```bash
# After deployment
vercel --list

# Or check Vercel Dashboard
# URL format: https://your-project.vercel.app
```

## Test Deployment

```bash
# Visit your frontend
https://your-project.vercel.app

# Test API connection in browser console:
fetch('https://your-api.com/api/health').then(r => r.json())
```

## Deploy Backend (Separate Service)

### Quick: Railway
```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway variables set MONGODB_URI=<your-mongodb-url>
railway deploy
```

### Or: Render
1. Go https://render.com/new
2. Select "Web Service"
3. Connect GitHub repo
4. Build: `npm run build`
5. Start: `npm start`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Run `npm run build` locally first |
| API 404 errors | Check `VITE_API_BASE_URL` environment variable |
| CORS errors | Backend needs CORS enabled for your Vercel URL |
| TypeScript errors | Run `npx tsc --noEmit` to check locally |

## Project URLs After Deployment

```
Frontend:  https://your-app.vercel.app
Backend:   https://your-api.railway.app  (or Render/Heroku)
```

## File Structure (What Gets Deployed)

```
TO VERCEL:
├── src/              ✅ React components
├── public/           ✅ Static assets
├── dist/             ✅ Built output
├── vite.config.ts    ✅ Build config
├── package.json      ✅ Dependencies
└── index.html        ✅ Entry point

NOT DEPLOYED:
├── backend/          ❌ Goes to separate service
├── .git/             ❌ Excluded
├── node_modules/     ❌ Rebuilt on server
└── .env.local        ❌ Kept private
```

## Redeployment Commands

```bash
# Trigger rebuild
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Rollback to previous
vercel rollback

# View environment variables
vercel env ls
```

## Production Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Railway/Render/Heroku
- [ ] Environment variables set in Vercel
- [ ] CORS configured in backend
- [ ] Tested user registration
- [ ] Tested user login
- [ ] Tested file upload
- [ ] Verified API calls work
- [ ] Checked browser console for errors
- [ ] Monitored Vercel analytics

## Support Resources

- Vercel Docs: https://vercel.com/docs
- Vite Guide: https://vitejs.dev/guide/build.html
- React Deploy: https://react.dev/learn/start-a-new-react-project
- Railway: https://railway.app/docs
- Render: https://render.com/docs

---

**Status: Ready to Deploy ✅**

Questions? See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed steps.
