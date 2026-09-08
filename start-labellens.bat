@echo off
setlocal
title LabelLens
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install the current LTS version from https://nodejs.org
  pause
  exit /b 1
)

for /f "tokens=1 delims=." %%v in ('node -p "process.versions.node"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 20 (
  echo ERROR: LabelLens needs Node.js 20 or newer.
  echo Your installed version is:
  node --version
  echo Download the current LTS version from https://nodejs.org
  pause
  exit /b 1
)

echo.
echo Preparing LabelLens...
echo This may take a few minutes after downloading an update.
call npm install --prefer-offline --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo ERROR: LabelLens could not install its required files.
  echo Check your internet connection, then run this file again.
  pause
  exit /b 1
)

echo.
echo Starting LabelLens at http://localhost:8080
echo Press Ctrl + C in this window to stop.
echo.
call npm run dev -- --host 127.0.0.1 --port 8080
if errorlevel 1 (
  echo.
  echo ERROR: LabelLens could not start. Read the error shown above.
  echo If port 8080 is already in use, close the older LabelLens window and try again.
)
pause
endlocal
