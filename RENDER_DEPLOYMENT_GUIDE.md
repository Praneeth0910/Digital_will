# Render Deployment Guide - Digital Will Platform

This guide walks you through deploying the Digital Will application to Render.com.

## 🌟 Overview

The application consists of two services:
1. **Backend API** - Node.js/Express server with MongoDB
2. **Frontend** - React/TypeScript static site built with Vite

## 📋 Prerequisites

Before deploying, ensure you have:

1. ✅ A [Render.com](https://render.com) account (free tier available)
2. ✅ A [MongoDB Atlas](https://www.mongodb.com/atlas) account with a database cluster
3. ✅ Your code pushed to a GitHub repository
4. ✅ Git installed and configured

## 🚀 Quick Deployment (Recommended)

### Option 1: Using Blueprint (render.yaml)

The easiest way to deploy is using the included `render.yaml` blueprint:

1. **Connect Your Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub account
   - Select the `Digital_will` repository
   - Click "Connect"

2. **Configure Environment Variables**
   - Render will detect the `render.yaml` file
   - Set the `MONGODB_URI` for the backend service:
     ```
     mongodb+srv://<username>:<password>@<cluster>.mongodb.net/digital_inheritance?retryWrites=true&w=majority
     ```
   - The `JWT_SECRET` will be auto-generated
   - Review other settings

3. **Deploy**
   - Click "Apply" to create both services
   - Render will build and deploy automatically
   - Wait 5-10 minutes for first deployment

### Option 2: Manual Deployment

If you prefer manual setup or the blueprint doesn't work:

#### Step 1: Deploy Backend API

1. **Create Web Service**
   - Go to Render Dashboard
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `digital-will-backend`
     - **Region**: Choose closest to your users
     - **Branch**: `main`
     - **Root Directory**: Leave empty
     - **Runtime**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && npm start`

2. **Set Environment Variables**
   Add these in the "Environment" section:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=<your-mongodb-atlas-connection-string>
   JWT_SECRET=<generate-a-strong-random-string>
   DEMO_MODE=false
   ```

3. **Configure Health Check**
   - **Health Check Path**: `/health`

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Note the backend URL (e.g., `https://digital-will-backend.onrender.com`)

#### Step 2: Deploy Frontend

1. **Update Frontend API URL**
   
   Before deploying the frontend, you need to configure it to use the backend URL:

   Create a `.env.production` file in the root directory:
   ```bash
   VITE_API_URL=https://digital-will-backend.onrender.com
   ```

2. **Create Static Site**
   - Go to Render Dashboard
   - Click "New" → "Static Site"
   - Connect your repository
   - Configure:
     - **Name**: `digital-will-frontend`
     - **Branch**: `main`
     - **Root Directory**: Leave empty
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`

3. **Add Rewrite Rules**
   In the "Redirects/Rewrites" section, add:
   ```
   Source: /*
   Destination: /index.html
   Action: Rewrite
   ```

4. **Deploy**
   - Click "Create Static Site"
   - Wait for build and deployment
   - Note the frontend URL (e.g., `https://digital-will-frontend.onrender.com`)

#### Step 3: Update CORS Configuration

Update the backend CORS settings to include your frontend URL:

Edit `backend/server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'https://digital-will-frontend.onrender.com', // Add your frontend URL
  // ... other origins
];
```

Commit and push to trigger a redeploy.

## 🗄️ MongoDB Atlas Setup

If you haven't set up MongoDB Atlas yet:

1. **Create Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for free

2. **Create Cluster**
   - Click "Create" → "Deploy a cloud database"
   - Choose "Free" tier (M0)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Configure Access**
   - **Database User**: Create a user with a strong password
   - **Network Access**: Add `0.0.0.0/0` to allow Render to connect

4. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database>` with `digital_inheritance`

## 🔧 Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | Yes | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for JWT tokens | Yes | `<random-64-char-string>` |
| `DEMO_MODE` | Enable demo mode | No | `false` |

### Frontend Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | `https://your-backend.onrender.com` |

## 📝 Post-Deployment Checklist

After deployment, verify:

- [ ] Backend health check: `https://your-backend.onrender.com/health`
- [ ] Frontend loads: `https://your-frontend.onrender.com`
- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] Nominee management works
- [ ] Check Render logs for any errors

## 🔄 Continuous Deployment

Render automatically deploys when you push to your GitHub repository:

1. Make changes locally
2. Commit and push to GitHub
3. Render detects the push and rebuilds automatically
4. Check deployment status in Render dashboard

## 🐛 Troubleshooting

### Backend Won't Start

**Problem**: Backend service fails to start

**Solutions**:
1. Check MongoDB connection string is correct
2. Verify all environment variables are set
3. Check logs in Render dashboard
4. Ensure `npm install` completed successfully

### Frontend Shows CORS Error

**Problem**: Frontend can't connect to backend (CORS error)

**Solutions**:
1. Verify backend URL in frontend environment variables
2. Update CORS allowed origins in `backend/server.js`
3. Ensure both services are deployed and running
4. Check Network tab in browser DevTools

### Database Connection Fails

**Problem**: MongoDB connection timeout

**Solutions**:
1. Verify MongoDB Atlas network access allows `0.0.0.0/0`
2. Check connection string format is correct
3. Ensure database user credentials are valid
4. Check MongoDB Atlas cluster is running

### Build Fails

**Problem**: Build command fails during deployment

**Solutions**:
1. Check Node.js version compatibility
2. Verify all dependencies are in `package.json`
3. Clear build cache and retry
4. Check build logs for specific errors

### Free Tier Limitations

**Problem**: Service spins down after inactivity

**Solutions**:
1. Free tier services spin down after 15 minutes of inactivity
2. First request after spin-down takes 30-60 seconds
3. Consider upgrading to paid tier for production use
4. Use an uptime monitor (e.g., UptimeRobot) to ping periodically

## 💰 Cost Considerations

### Free Tier
- Backend: Free (spins down after inactivity)
- Frontend: Free (100GB bandwidth/month)
- MongoDB Atlas: Free (512MB storage)

### Paid Options
- Backend: $7/month (always-on)
- Frontend: Included with backend
- MongoDB Atlas: From $9/month (2GB storage)

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit secrets to Git
   - Use Render's environment variable encryption
   - Rotate JWT_SECRET periodically

2. **MongoDB**
   - Use strong passwords
   - Restrict network access when possible
   - Enable MongoDB Atlas alerts

3. **CORS**
   - Only allow your frontend domain
   - Remove localhost origins in production

4. **HTTPS**
   - Render provides free SSL certificates
   - All traffic is encrypted automatically

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

## 🆘 Support

If you encounter issues:
1. Check Render logs in dashboard
2. Review MongoDB Atlas metrics
3. Check browser console for errors
4. Review this guide's troubleshooting section

## 🎉 Success!

Once deployed, your Digital Will platform is live! Share the frontend URL with users and monitor the services through the Render dashboard.

---

**Last Updated**: February 2026
**Version**: 1.0
