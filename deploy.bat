@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   PowerSchedule - One-Click Git & Vercel Deployer
echo ===================================================
echo.

:: Ask user for commit message
set /p commit_msg="Enter commit message (or press Enter for default): "

:: If message is blank, generate a default message
if "%commit_msg%"=="" (
    set commit_msg=Update PowerSchedule App - AM/PM Clock & League Enhancements
)

echo.
echo [1/3] Adding changes to Git...
git add .

echo.
echo [2/3] Committing: "%commit_msg%"...
git commit -m "%commit_msg%"

echo.
echo [3/3] Deploying directly to Vercel Production...
call npx vercel --prod --yes

echo.
echo ===================================================
echo   SUCCESS! Production Deployment Completed!
echo ===================================================
echo.
pause
