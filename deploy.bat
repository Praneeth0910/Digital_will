@echo off
REM Digital Inheritance - Deployment Script for Windows

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo.
echo 🚀 Digital Inheritance Deployment Script
echo.
echo ==========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Please install Node.js 18+
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Check if Git is installed
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git not found. Please install Git
    echo Download from: https://git-scm.com
    pause
    exit /b 1
)

echo ✅ Prerequisites found
echo.

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Vercel CLI not found. Installing...
    call npm install -g vercel
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo.
echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 📦 Building application...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

if not exist "dist" (
    echo ❌ Build failed - dist folder not created
    pause
    exit /b 1
)

echo ✅ Build successful
echo.

REM Check if Git repository exists
if not exist ".git" (
    echo 📚 Initializing Git repository...
    call git init
    call git add .
    call git commit -m "Initial commit - Digital Inheritance app"
    echo.
    echo ⚠️  Please add remote repository:
    echo    git remote add origin ^<your-repo-url^>
    echo    git branch -M main
    echo    git push -u origin main
    echo.
) else (
    echo ✅ Git repository already initialized
    echo.
)

REM Deploy to Vercel
echo 🌐 Deploying to Vercel...
echo.
echo This will open your browser to authenticate with Vercel.
echo Follow these steps:
echo 1. Authenticate with your Vercel account
echo 2. Select the project folder as the root
echo 3. Configure build settings (should auto-detect Vite)
echo 4. Complete the deployment
echo.
pause

call vercel --prod

echo.
echo ==========================================
echo ✅ Deployment Complete!
echo ==========================================
echo.
echo 📝 Next Steps:
echo 1. Visit your Vercel dashboard: https://vercel.com
echo 2. Go to your project settings
echo 3. Add environment variables:
echo    - VITE_API_BASE_URL: ^<your-backend-api-url^>
echo 4. Redeploy to apply environment variables
echo.
echo 📚 See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions
echo.
echo ==========================================
echo.

pause
