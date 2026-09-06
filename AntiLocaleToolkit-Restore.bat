@echo off
setlocal
title Antigravity Chinese Toolkit - Restore
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)" >nul 2>&1
if errorlevel 1 (
  echo Node.js 20 or newer is required.
  pause
  exit /b 1
)

node "%~dp0scripts\patcher.js" --restore %*
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
