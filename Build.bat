@echo off
title JetFlux Build Script
color 0B
cls

echo.
echo  =========================================================
echo    JetFlux Build Script
echo    Fly Exclusive. Pay Smart.
echo  =========================================================
echo.

cd /d "%~dp0"

REM ── Prerequisites check ─────────────────────────────────────
echo  [CHECK] Verifying prerequisites...
where dotnet >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  [ERROR] .NET SDK not found. Install from https://dotnet.microsoft.com/download
    pause & exit /b 1
)
where node >nul 2>&1
if %errorlevel% NEQ 0 (
    echo  [ERROR] Node.js not found. Install from https://nodejs.org
    pause & exit /b 1
)
echo  [OK]  .NET and Node.js found.
echo.

REM ── Stop any running JetFlux instance ───────────────────────
echo  [STOP] Stopping any running JetFlux processes...
powershell -Command "Get-Process -Name JetFlux,dotnet -ErrorAction SilentlyContinue | Stop-Process -Force" >nul 2>&1
timeout /t 2 /nobreak >nul

REM ── Install frontend dependencies if needed ─────────────────
if not exist "frontend\node_modules" (
    echo  [NPM]  Installing frontend dependencies...
    cd frontend && npm install
    if %errorlevel% NEQ 0 ( echo  [ERROR] npm install failed. & cd .. & pause & exit /b 1 )
    cd ..
)

REM ── Build Angular for production ────────────────────────────
echo  [1/3] Building Angular frontend (production)...
cd frontend
call npm run build -- --configuration production
if %errorlevel% NEQ 0 (
    echo  [ERROR] Angular build failed.
    cd ..
    pause & exit /b 1
)
cd ..
echo  [OK]  Angular build complete.
echo.

REM ── Publish .NET API (self-contained, win-x64) ──────────────
echo  [2/3] Publishing .NET API as self-contained executable...
if exist "dist\JetFlux" rmdir /s /q "dist\JetFlux"
dotnet publish src\EmptyLegs.API\EmptyLegs.API.csproj -c Release -r win-x64 --self-contained true -o dist\JetFlux
if %errorlevel% NEQ 0 (
    echo  [ERROR] .NET publish failed.
    pause & exit /b 1
)
echo  [OK]  .NET publish complete.
echo.

REM ── Copy launch scripts into dist ───────────────────────────
echo  [3/3] Copying launch scripts...
copy /Y "%~dp0dist\START_JETFLUX.bat" "%~dp0dist\JetFlux\START_JETFLUX.bat" >nul 2>&1
copy /Y "%~dp0dist\STOP_JETFLUX.bat" "%~dp0dist\JetFlux\STOP_JETFLUX.bat" >nul 2>&1
echo  [OK]  Launch scripts ready.
echo.

REM ── Summary ─────────────────────────────────────────────────
echo  =========================================================
echo    BUILD SUCCESSFUL!
echo.
echo    Distribution folder: %~dp0dist\JetFlux\
echo.
echo    To run JetFlux:
echo      Double-click:  dist\JetFlux\START_JETFLUX.bat
echo.
echo    Contents of dist\JetFlux\:
echo      JetFlux.exe          Server (API + Angular SPA bundled)
echo      appsettings.json     Configuration
echo      seed-data\           Initial database seed files
echo      wwwroot\browser\     Angular SPA (pre-built)
echo      START_JETFLUX.bat    Launch script (starts server + Chrome)
echo      STOP_JETFLUX.bat     Stop the server
echo  =========================================================
echo.
pause
