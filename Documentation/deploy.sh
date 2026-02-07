#!/bin/bash
# Digital Inheritance - Quick Deployment Script for Vercel

set -e

echo "=========================================="
echo "🚀 Digital Inheritance Deployment Script"
echo "=========================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

if ! command -v git &> /dev/null; then
    echo "❌ Git not found. Please install Git"
    exit 1
fi

echo "✅ Prerequisites met"
echo ""

# Step 1: Build locally
echo "📦 Building application..."
npm install
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist folder not created"
    exit 1
fi

echo "✅ Build successful"
echo ""

# Step 2: Initialize git if needed
if [ ! -d ".git" ]; then
    echo "📚 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Digital Inheritance app"
    echo "⚠️  Please add remote: git remote add origin <your-repo-url>"
else
    echo "✅ Git repository already initialized"
fi

echo ""

# Step 3: Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo ""
echo "This will open your browser to authenticate with Vercel."
echo "Follow these steps:"
echo "1. Authenticate with your Vercel account"
echo "2. Select 'Link to existing project' if this is first time, or let it create new"
echo "3. Configure build settings (should auto-detect Vite)"
echo "4. Add environment variables in Vercel dashboard after deployment"
echo ""

vercel --prod

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo "1. Visit your Vercel dashboard: https://vercel.com"
echo "2. Add environment variables:"
echo "   - VITE_API_BASE_URL: <your-backend-api-url>"
echo "3. Redeploy to apply environment variables"
echo ""
echo "🔗 Your frontend is live at:"
vercel --cwd . --show-url
echo ""
echo "📚 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions"
echo "=========================================="
