@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   PowerSchedule - One-Click Git and Vercel Deployer
echo ===================================================
echo.

:: Ask user for commit message
set "commit_msg="
set /p "commit_msg=Enter commit message (or press Enter for default): "

:: If message is blank, use a default message.
:: (Quoted "set" and !delayed! expansion keep characters like & from being treated as commands.)
if not defined commit_msg set "commit_msg=Update PowerSchedule App"

echo.
echo [1/3] Adding changes to Git...
git add .

echo.
echo [2/3] Committing: "!commit_msg!"...
git commit -m "!commit_msg!"

echo.
echo [3/3] Deploying directly to Vercel Production...
call npx vercel --prod --yes
if errorlevel 1 (
    echo.
    echo ===================================================
    echo   DEPLOYMENT FAILED - see the messages above.
    echo   The live site was NOT updated.
    echo ===================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo   SUCCESS! Production Deployment Completed!
echo ===================================================
echo.
pause
