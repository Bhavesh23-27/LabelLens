@echo off
title LabelLens
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install Node 20 or newer from https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Installing dependencies, this takes a few minutes the first time...
  call npm install || (echo Install failed. & pause & exit /b 1)
)

echo.
echo Starting LabelLens... open the URL below in your browser (usually http://localhost:8080)
echo Press Ctrl + C in this window to stop.
echo.
call npm start
pause
