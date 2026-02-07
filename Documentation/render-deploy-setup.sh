#!/bin/bash
# Render Deployment Setup Script

echo "=============================================="
echo "🚀 Digital Will - Render Deployment Setup"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
  echo -e "${RED}❌ Error: Not a git repository${NC}"
  echo "Please initialize git first: git init"
  exit 1
fi

echo -e "${GREEN}✓${NC} Git repository detected"

# Check for uncommitted changes
if [[ `git status --porcelain` ]]; then
  echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
  read -p "Do you want to commit them now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    read -p "Enter commit message: " commit_msg
    git commit -m "$commit_msg"
    echo -e "${GREEN}✓${NC} Changes committed"
  fi
fi

# Check if remote is set
if ! git remote | grep -q "origin"; then
  echo -e "${YELLOW}⚠ No remote 'origin' found${NC}"
  read -p "Enter your GitHub repository URL: " repo_url
  git remote add origin "$repo_url"
  echo -e "${GREEN}✓${NC} Remote added"
fi

# Push to GitHub
echo ""
echo "Pushing to GitHub..."
git push -u origin main 2>/dev/null || git push -u origin master

echo ""
echo -e "${GREEN}✓${NC} Code pushed to GitHub"
echo ""
echo "=============================================="
echo "📋 Next Steps:"
echo "=============================================="
echo ""
echo "1. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/atlas"
echo "   - Create a free cluster"
echo "   - Create a database user"
echo "   - Whitelist IP: 0.0.0.0/0"
echo "   - Get connection string"
echo ""
echo "2. Deploy to Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - Click 'New' → 'Blueprint'"
echo "   - Connect your GitHub repository"
echo "   - Render will detect render.yaml"
echo "   - Set MONGODB_URI environment variable"
echo "   - Click 'Apply'"
echo ""
echo "3. Update Frontend URL:"
echo "   - After backend deploys, note the URL"
echo "   - Update backend FRONTEND_URL env var"
echo "   - After frontend deploys, update .env.production"
echo "   - Redeploy frontend"
echo ""
echo "4. Test your deployment:"
echo "   - Visit frontend URL"
echo "   - Try registering a user"
echo "   - Test login and features"
echo ""
echo "=============================================="
echo "📚 Full guide: RENDER_DEPLOYMENT_GUIDE.md"
echo "=============================================="
