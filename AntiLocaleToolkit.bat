@echo off
setlocal
title AntiLocale Toolkit
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)

if not exist "%~dp0node_modules\asar" (
  echo Installing required components for first use...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Dependency installation failed. Check your network connection and try again.
    pause
    exit /b 1
  )
)

node "%~dp0scripts\patcher.js" --interactive
if errorlevel 1 pause
endlocal
