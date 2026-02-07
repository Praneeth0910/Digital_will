# 🚀 Deploy Your Digital Will App RIGHT NOW

Your code is ready and pushed to GitHub! Follow these exact steps to deploy.

---

## 🗄️ STEP 1: Set Up MongoDB Atlas (5 minutes)

### 1.1 Create Account & Cluster

1. **Open:** https://www.mongodb.com/cloud/atlas/register
2. **Sign up** with Google/GitHub or email
3. **Click:** "Build a Database" 
4. **Select:** FREE (M0) tier
5. **Choose:** Cloud Provider & Region (choose closest to you)
6. **Cluster Name:** Keep default or name it `digital-will-cluster`
7. **Click:** "Create Cluster"

### 1.2 Configure Security

**Create Database User:**
1. Security → Database Access → "Add New Database User"
2. Username: `digitalwilluser` (or your choice)
3. Password: Click "Autogenerate Secure Password" → **COPY THIS PASSWORD**
4. User Privileges: "Read and write to any database"
5. Click "Add User"

**Configure Network Access:**
1. Security → Network Access → "Add IP Address"
2. Click "Allow Access from Anywhere" (adds 0.0.0.0/0)
3. Click "Confirm"

### 1.3 Get Connection String

1. **Click:** "Connect" on your cluster
2. **Choose:** "Connect your application"
3. **Driver:** Node.js, Version: 5.5 or later
4. **Copy the connection string** - looks like:
   ```
   mongodb+srv://digitalwilluser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace** `<password>` with the password you copied earlier
6. **Add database name** before the `?`:
   ```
   mongodb+srv://digitalwilluser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/digital_inheritance?retryWrites=true&w=majority
   ```
7. **SAVE THIS STRING** - you'll need it in Step 2

---

## 🎯 STEP 2: Deploy to Render (5 minutes)

### 2.1 Create Render Account

1. **Open:** https://dashboard.render.com/register
2. **Sign up** with GitHub (recommended) or email
3. **Authorize** Render to access your GitHub account

### 2.2 Deploy Using Blueprint

1. **In Render Dashboard, click:** "New" (blue button) → "Blueprint"

2. **Connect Repository:**
   - You'll see a list of your GitHub repos
   - Find and select: **`Praneeth0910/Digital_will`**
   - Click "Connect"

3. **Render detects render.yaml:**
   - You'll see 2 services:
     - ✅ `digital-will-backend` (Web Service)
     - ✅ `digital-will-frontend` (Static Site)

4. **Configure Environment Variables:**
   
   For **digital-will-backend** service:
   - Find `MONGODB_URI` (it says "sync: false")
   - Click the value field
   - **Paste your MongoDB connection string** from Step 1.3
   - Leave other variables as they are (JWT_SECRET will auto-generate)

5. **Click:** "Apply" (bottom right)

6. **Wait for deployment** (5-10 minutes)
   - You'll see build logs for both services
   - Backend will show npm install and server starting
   - Frontend will show npm build process

---

## 🔗 STEP 3: Configure URLs (3 minutes)

### 3.1 Get Your Service URLs

After deployment completes:

1. **Backend URL:**
   - Click on "digital-will-backend" service
   - Copy the URL at the top (e.g., `https://digital-will-backend-xxxx.onrender.com`)
   - **SAVE THIS URL**

2. **Frontend URL:**
   - Click on "digital-will-frontend" service  
   - Copy the URL at the top (e.g., `https://digital-will-frontend-xxxx.onrender.com`)
   - **SAVE THIS URL**

### 3.2 Update Backend CORS

1. **Go to:** digital-will-backend service
2. **Click:** "Environment" in left sidebar
3. **Add new environment variable:**
   - Key: `FRONTEND_URL`
   - Value: `https://digital-will-frontend-xxxx.onrender.com` (your frontend URL)
4. **Click:** "Save Changes"
5. Service will automatically redeploy (1-2 minutes)

### 3.3 Update Frontend API URL

**Option A: Via Render Dashboard (Recommended)**
1. Go to: digital-will-frontend service
2. Click: "Environment" 
3. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://digital-will-backend-xxxx.onrender.com` (your backend URL)
4. Click: "Save Changes"
5. Trigger manual redeploy if needed

**Option B: Via Code (Alternative)**
1. Update `.env.production` file locally:
   ```
   VITE_API_URL=https://digital-will-backend-xxxx.onrender.com
   ```
2. Commit and push:
   ```bash
   git add .env.production
   git commit -m "Update production API URL"
   git push origin main
   ```
3. Render will auto-redeploy

---

## ✅ STEP 4: Test Your Deployment (2 minutes)

### 4.1 Check Backend Health

1. Open: `https://digital-will-backend-xxxx.onrender.com/health`
2. You should see:
   ```json
   {
     "success": true,
     "message": "Digital Inheritance API is running",
     "database": {
       "status": "connected"
     }
   }
   ```

### 4.2 Test Frontend

1. Open: `https://digital-will-frontend-xxxx.onrender.com`
2. You should see the Digital Will homepage
3. Try to register a new user
4. Try to login
5. Check browser console - no CORS errors

---

## 📝 YOUR DEPLOYMENT URLS

Fill these in after deployment:

```
Backend API:  https://_________________________________.onrender.com
Frontend App: https://_________________________________.onrender.com
MongoDB:      Your connection string (keep private)
```

---

## 🐛 Quick Troubleshooting

### Backend won't start
- **Check:** MongoDB connection string is correct
- **Check:** All required env vars are set
- **Look at:** Logs in Render dashboard

### CORS errors in browser
- **Check:** FRONTEND_URL is set in backend
- **Check:** Both services are deployed and running
- **Try:** Hard refresh (Ctrl+Shift+R)

### Database connection fails
- **Check:** MongoDB Atlas network access allows 0.0.0.0/0
- **Check:** Database user password is correct
- **Check:** Connection string format is correct

### First request is slow
- **Normal:** Free tier spins down after 15 min inactivity
- **First request** after spin-down takes 30-60 seconds
- **Subsequent requests** are fast

---

## 🎉 Success!

Once all steps are complete:
- ✅ Your backend API is live and connected to MongoDB
- ✅ Your frontend is live and connected to backend
- ✅ Users can register, login, and use all features
- ✅ Auto-deploy is enabled for future updates

**Share your frontend URL with users!**

---

## 💰 Cost

- **Current Setup:** $0/month (100% free)
- **Limitations:** Services spin down after 15 min inactivity
- **Upgrade:** $7/month for always-on backend (optional)

---

## 📞 Need Help?

- **Render Support:** https://render.com/docs
- **MongoDB Support:** https://docs.atlas.mongodb.com/
- **Check logs:** Render dashboard → Your service → Logs

---

**Happy Deploying! 🚀**
