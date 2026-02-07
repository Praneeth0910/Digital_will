# Digital Inheritance - Vercel Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Frontend (React + TypeScript + Vite)
- [x] `vercel.json` configured
- [x] `.vercelignore` created
- [x] Build scripts in `package.json`
- [x] TypeScript compilation enabled

### ✅ Backend (Node.js + Express)
- [ ] Backend deployed separately (see below)
- [ ] Environment variables configured
- [ ] Database connection string set

---

## 🚀 Deployment Options

### Option 1: Frontend-Only Deployment (Recommended for Testing)
Deploy just the React frontend to Vercel and point it to an existing backend API.

### Option 2: Full-Stack Deployment
Deploy frontend to Vercel + backend to a separate service.

---

## 📱 STEP 1: Deploy Frontend to Vercel

### Prerequisites
1. **Vercel Account** - Sign up at https://vercel.com
2. **Git Repository** - Push code to GitHub/GitLab/Bitbucket
3. **Node.js 18+** - Installed locally

### Step 1.1: Push to Git Repository

```bash
cd a:\PROJECTS\DigitalWill\Digital_will_clone_gitrepo

# Initialize git if needed
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Digital Inheritance app"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/digital-inheritance.git
git branch -M main
git push -u origin main
```

### Step 1.2: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Answer prompts:
# - Select project name: digital-inheritance
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

**Option B: Using Vercel Dashboard**

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository
4. Configure:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

---

## 🔐 STEP 2: Configure Environment Variables

### In Vercel Dashboard:

1. Go to **Project Settings** → **Environment Variables**
2. Add the following variables:

```env
# Frontend API Configuration
VITE_API_BASE_URL=https://your-backend-api.com/api

# Optional: API keys for external services
VITE_ENCRYPTION_KEY=your-encryption-key
```

**Save and redeploy:**
```bash
vercel --prod
```

---

## 🖥️ STEP 3: Deploy Backend Separately

Since Vercel is optimized for serverless frontend hosting, the Node.js backend needs a different platform.

### Option A: Deploy to Railway (Recommended - Easy)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# In backend directory
cd backend

# Initialize Railway project
railway init

# Add environment variables
railway variables set MONGODB_URI=mongodb+srv://...
railway variables set JWT_SECRET=your-secret-key

# Deploy
railway deploy
```

### Option B: Deploy to Render (Free Tier Available)

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect Git repository
4. Configure:
   - **Runtime:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `npm start` or `node server.js`
5. Add Environment Variables in Render dashboard

### Option C: Deploy to Heroku (Paid)

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create digital-inheritance-api

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set MONGODB_URI=mongodb+srv://...

# Deploy
git push heroku main
```

---

## 🔗 STEP 4: Connect Frontend to Backend

### Update API Base URL

After backend is deployed, update your frontend:

1. In Vercel Dashboard:
   - Go to **Settings** → **Environment Variables**
   - Update `VITE_API_BASE_URL` to your backend URL
   - Example: `https://digital-inheritance-api.railway.app/api`

2. Trigger redeploy:
   ```bash
   vercel --prod
   ```

Or manually trigger in Vercel Dashboard:
- Click **Deployments**
- Find latest deployment
- Click **⋯** → **Redeploy**

---

## 📊 Deployment Status Checklist

### Frontend (Vercel)
```
URL: https://your-app.vercel.app
✅ React frontend deployed
✅ TypeScript compiled
✅ Build optimized
✅ Environment variables set
```

### Backend (Railway/Render/Heroku)
```
URL: https://api.your-backend.com
✅ Express server running
✅ MongoDB connected
✅ JWT authentication working
✅ Environment variables set
```

### Cross-Origin Setup
```
✅ CORS enabled in backend
✅ Backend allows frontend origin
✅ API base URL configured in frontend
✅ Authentication headers passing
```

---

## 🧪 Testing After Deployment

### Test Frontend
```bash
# Visit your frontend
https://your-app.vercel.app

# Check:
- ✅ Page loads without errors
- ✅ Navigation works
- ✅ Styling loads correctly
```

### Test API Connection
```bash
# In browser console:
const response = await fetch('https://your-api.com/api/auth/verify');
console.log(response);
```

### Test Full Flow
1. **User Registration**
   - Fill form and submit
   - Check browser console for API call
   - Verify response in Network tab

2. **User Login**
   - Login with test credentials
   - Verify token stored in localStorage
   - Check redirect to dashboard

3. **Asset Upload**
   - Navigate to vault/assets
   - Upload test file
   - Verify encryption and storage

---

## 🐛 Troubleshooting

### Issue: "VITE_API_BASE_URL is undefined"
**Solution:**
```bash
# Rebuild with environment variables
vercel build
vercel --prod
```

### Issue: "CORS error - blocked by browser"
**Solution:** Update backend CORS:
```javascript
app.use(cors({
  origin: 'https://your-app.vercel.app',
  credentials: true
}));
```

### Issue: "API calls returning 404"
**Solution:** Verify API base URL in environment variables:
```javascript
// src/api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
console.log('API Base URL:', API_BASE_URL);
```

### Issue: "Build fails with TypeScript errors"
**Solution:**
```bash
# Locally verify build works
npm run build

# Check for type errors
npx tsc --noEmit

# Fix errors, then redeploy
```

---

## 📈 Performance Optimization

### Frontend Optimizations (Already in Vercel)
- [x] Automatic code splitting
- [x] Image optimization
- [x] CSS minification
- [x] JavaScript minification
- [x] Gzip compression

### Additional Optimizations
```typescript
// src/api/client.ts - Add request timeout
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Request timeout')), 10000)
);

Promise.race([fetch(...), timeout]);
```

---

## 🔒 Security Checklist

### Environment Variables
- [x] API keys stored in Vercel, not in code
- [x] JWT secret stored securely
- [x] Database credentials not in git
- [x] No sensitive data in `.vercelignore`

### HTTPS
- [x] All Vercel deployments use HTTPS automatically
- [x] Backend enforces HTTPS

### CORS
- [x] CORS configured for specific origins
- [x] Credentials properly handled
- [x] No wildcard origins in production

---

## 📚 Useful Commands

```bash
# View deployment logs
vercel logs

# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback

# View environment variables
vercel env ls

# Update environment variable
vercel env add VITE_API_BASE_URL

# Trigger rebuild
vercel --prod

# View analytics
vercel analytics
```

---

## 🎯 Deployment Summary

### What Gets Deployed

**To Vercel (Frontend):**
- React TypeScript components
- CSS styles
- Assets (images, fonts)
- Built JavaScript bundle
- index.html

**To Backend Service (Backend):**
- Express server
- Node.js dependencies
- Environment configuration
- Database connection
- API routes

### What Doesn't Get Deployed
- Source maps (optional)
- Test files (not copied)
- node_modules (rebuilt on server)
- .env.local (kept private)
- .git folder (via .vercelignore)

---

## 🚨 Post-Deployment Monitoring

### Monitor Frontend
```bash
# Vercel Dashboard → Analytics
- Page views
- Response times
- Error rates
- Deployment status
```

### Monitor Backend
```bash
# Railway/Render Dashboard
- CPU usage
- Memory usage
- Error logs
- Uptime
```

### Monitor User Experience
```javascript
// Add error tracking (optional)
window.addEventListener('error', (e) => {
  console.error('Global error:', e);
  // Send to error tracking service
});
```

---

## 📝 Next Steps

After deployment is complete:

1. ✅ **Test all features** in production
2. ✅ **Monitor error logs** for issues
3. ✅ **Set up custom domain** (optional)
4. ✅ **Enable analytics** for insights
5. ✅ **Configure SSL certificate** (auto on Vercel)
6. ✅ **Set up automated backups** (for database)
7. ✅ **Document API endpoints** for team

---

## 🎓 Learn More

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Production Guide](https://vitejs.dev/guide/build.html)
- [React Deployment Guide](https://react.dev/learn/start-a-new-react-project)
- [Railway Documentation](https://railway.app/docs)
- [Render Documentation](https://render.com/docs)

---

## 💬 Support

For issues during deployment:
1. Check Vercel build logs: Dashboard → Deployments → View Logs
2. Check backend logs: Railway/Render dashboard
3. Review browser console for frontend errors
4. Check Network tab for API calls
5. Verify environment variables are set correctly

---

**Deployment Status: READY FOR PRODUCTION ✅**

