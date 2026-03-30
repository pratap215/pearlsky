@echo off
title EmptyLegs - Private Jet Booking System
color 0A

echo.
echo  ============================================================
echo    EmptyLegs - Private Jet Booking POC
echo    Starting application...
echo  ============================================================
echo.

REM Check if seed-data folder exists
if not exist "seed-data" (
    echo  [ERROR] seed-data folder not found!
    echo  Please run this script from the EmptyLegs_ClaudeCode directory.
    pause
    exit /b 1
)

REM Copy seed-data to API output if running from source
if exist "src\EmptyLegs.API\bin\Debug\net9.0" (
    if not exist "src\EmptyLegs.API\bin\Debug\net9.0\seed-data" (
        echo  Copying seed data...
        xcopy /E /I /Q "seed-data" "src\EmptyLegs.API\bin\Debug\net9.0\seed-data" >nul
    )
)

echo  [1/2] Starting .NET API (http://localhost:5000) ...
start "EmptyLegs API" cmd /k "cd src\EmptyLegs.API && dotnet run --urls=http://localhost:5000"

echo  Waiting for API to start...
timeout /t 5 /nobreak >nul

echo  [2/2] Opening browser...
timeout /t 3 /nobreak >nul
start "" "http://localhost:5000"

echo.
echo  ============================================================
echo    Application is running!
echo.
echo    URL:      http://localhost:5000
echo.
echo    LOGIN CREDENTIALS:
echo    User:     aditya@example.com     / User@123
echo    Operator: admin@indijet.in       / Admin@123
echo    Admin:    admin@emptylegs.com    / Admin@123
echo.
echo    Close the "EmptyLegs API" window to stop the server.
echo  ============================================================
echo.
pause
