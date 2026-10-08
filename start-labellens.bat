@echo off
setlocal
chcp 65001 >nul
title LabelLens
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install the current LTS version from https://nodejs.org
  pause
  exit /b 1
)

node -e "const [major,minor]=process.versions.node.split('.').map(Number); process.exit(major >= 22 && (major > 22 || minor >= 12) ? 0 : 1)"
if errorlevel 1 (
  echo ERROR: LabelLens needs Node.js 22.12 or newer.
  echo Your installed version is:
  node --version
  echo Download the current LTS version from https://nodejs.org
  pause
  exit /b 1
)

if not exist ".env" (
  if not exist ".env.example" (
    echo ERROR: The LabelLens settings file is missing.
    pause
    exit /b 1
  )
  copy /y ".env.example" ".env" >nul
)

echo.
echo Preparing LabelLens...
echo This may take a few minutes after downloading an update.

rem Remove the private hosted-build package from the local copy only.
rem It exists only inside the online workspace and is not needed to run locally.
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));if(p.devDependencies&&p.devDependencies['@lovable.dev/vite-tanstack-config']){delete p.devDependencies['@lovable.dev/vite-tanstack-config'];fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');}"

call npm install --prefer-offline --no-audit --no-fund
if errorlevel 1 (
  echo.
  echo ERROR: LabelLens could not install its required files.
  echo Check your internet connection, then run this file again.
  pause
  exit /b 1
)

echo.
echo Starting LabelLens server...
echo Do NOT close this window while using LabelLens.
echo.
echo When it is ready, hold Ctrl and click the http://localhost:8080 link below.
echo.

call npm run dev:local
if errorlevel 1 (
  echo.
  echo ERROR: LabelLens could not start. Read the error shown above.
  echo If port 8080 is already in use, close the older LabelLens window and try again.
  echo You can also try:   npm run dev -- --port 3000
)
pause
endlocal
