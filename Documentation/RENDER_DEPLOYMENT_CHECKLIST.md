# 🚀 Render Deployment Checklist

Use this checklist to track your deployment progress.

## Pre-Deployment Setup

- [ ] Code pushed to GitHub
- [ ] All tests passing locally
- [ ] Environment files configured (.env.example exists)
- [ ] Git repository is clean (no sensitive data)

## MongoDB Atlas Setup

- [ ] MongoDB Atlas account created
- [ ] Free cluster created (M0)
- [ ] Database user created with strong password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Connection string tested locally

## Render Account Setup

- [ ] Render.com account created
- [ ] GitHub account connected to Render
- [ ] Repository access granted to Render

## Backend Deployment

- [ ] Backend web service created (via Blueprint or manual)
- [ ] Build command set: `cd backend && npm install`
- [ ] Start command set: `cd backend && npm start`
- [ ] Environment variables configured:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=5000`
  - [ ] `MONGODB_URI=<your-atlas-connection-string>`
  - [ ] `JWT_SECRET=<generated-or-custom>`
  - [ ] `DEMO_MODE=false`
  - [ ] `FRONTEND_URL=<to-be-set-after-frontend-deploy>`
- [ ] Health check path set: `/health`
- [ ] Backend deployed successfully
- [ ] Backend URL noted: ____________________________________

## Frontend Deployment

- [ ] `.env.production` updated with backend URL
- [ ] Changes committed and pushed to GitHub
- [ ] Frontend static site created (via Blueprint or manual)
- [ ] Build command set: `npm install && npm run build`
- [ ] Publish directory set: `dist`
- [ ] Rewrite rule added: `/* → /index.html`
- [ ] Frontend deployed successfully
- [ ] Frontend URL noted: ____________________________________

## Post-Deployment Configuration

- [ ] Backend `FRONTEND_URL` environment variable updated
- [ ] Backend service redeployed
- [ ] CORS working correctly (no errors in browser console)

## Testing

- [ ] Frontend loads correctly
- [ ] Backend health check accessible: `<backend-url>/health`
- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] Nominee management works
- [ ] Dashboard loads data correctly
- [ ] No console errors in browser
- [ ] No errors in Render logs

## Monitoring & Maintenance

- [ ] Render dashboard bookmarked
- [ ] MongoDB Atlas dashboard bookmarked
- [ ] Auto-deploy enabled on both services
- [ ] Email notifications enabled in Render
- [ ] Database backups scheduled in MongoDB Atlas

## Optional Enhancements

- [ ] Custom domain configured
- [ ] SSL certificate verified (automatic with Render)
- [ ] Uptime monitor set up (e.g., UptimeRobot)
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics added (e.g., Google Analytics)

## Documentation

- [ ] Deployment URLs documented
- [ ] Environment variables documented
- [ ] Access credentials stored securely
- [ ] Team members notified of deployment

## Troubleshooting Completed

If you encountered issues, document what you fixed:

**Issue 1:** _______________________________________________
**Solution:** _______________________________________________

**Issue 2:** _______________________________________________
**Solution:** _______________________________________________

**Issue 3:** _______________________________________________
**Solution:** _______________________________________________

---

## Quick Reference

**Backend URL:** _______________________________________________
**Frontend URL:** _______________________________________________
**MongoDB Cluster:** _______________________________________________
**Deployed Date:** _______________________________________________
**Deployed By:** _______________________________________________

---

**Status:** 🟢 Live | 🟡 In Progress | 🔴 Issues

**Last Updated:** _______________________________________________
