@echo off
title PearlSky - Deploy to Render.com
color 0B
cls

echo.
echo  =========================================================
echo    PearlSky - Deploy to Render.com (Free Hosting)
echo  =========================================================
echo.

cd /d "%~dp0"

REM ── Check Git ──────────────────────────────────────────────
where git >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  [ERROR] Git not found.
    echo          Install from: https://git-scm.com/download/win
    pause & exit /b 1
)

echo  This script will push your code to GitHub.
echo  Render.com will then auto-deploy from GitHub.
echo.
echo  BEFORE RUNNING THIS SCRIPT:
echo  ─────────────────────────────────────────────────────────
echo   1. Create a FREE account at: https://github.com
echo   2. Create a NEW repository named: pearlsky
echo      (go to github.com/new)
echo   3. Copy your repo URL, e.g.:
echo      https://github.com/YOUR_USERNAME/pearlsky.git
echo  ─────────────────────────────────────────────────────────
echo.
set /p REPO_URL="  Paste your GitHub repo URL here: "

if "%REPO_URL%"=="" (
    echo  [ERROR] No URL provided.
    pause & exit /b 1
)

echo.
echo  [1/4] Initializing Git repository...
git init
git add .
git commit -m "Initial commit: PearlSky application" --allow-empty

echo.
echo  [2/4] Setting remote origin...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo.
echo  [3/4] Pushing to GitHub...
git branch -M main
git push -u origin main

if %errorlevel% NEQ 0 (
    echo.
    echo  [ERROR] Push failed. Common fixes:
    echo    - Make sure you created the repo on GitHub first
    echo    - Make sure the URL is correct
    echo    - You may need to login: git config --global credential.helper manager
    pause & exit /b 1
)

echo.
echo  [4/4] Code pushed to GitHub successfully!
echo.
echo  =========================================================
echo    NEXT STEPS — Deploy on Render.com (FREE):
echo  =========================================================
echo.
echo   1. Go to: https://render.com  (create free account)
echo.
echo   2. Click "New +" → "Web Service"
echo.
echo   3. Connect GitHub → select your "pearlsky" repository
echo.
echo   4. Fill in settings:
echo        Name     : pearlsky
echo        Runtime  : Docker
echo        Branch   : main
echo        Plan     : Free
echo.
echo   5. Click "Create Web Service"
echo.
echo   6. Wait 5-10 minutes for first build to complete
echo.
echo   7. Your app will be live at:
echo      https://pearlsky.onrender.com
echo.
echo  ─────────────────────────────────────────────────────────
echo   NOTE: Free tier SLEEPS after 15 min of inactivity.
echo         First request after sleep takes ~30 seconds.
echo         Data resets on restart (demo only).
echo  ─────────────────────────────────────────────────────────
echo.
pause
