@echo off
chcp 65001 >nul
setlocal
title AntiLocale Toolkit - zh-CN
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  call :say NEED_NODE
  pause
  exit /b 1
)

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)" >nul 2>&1
if errorlevel 1 (
  call :say NEED_NODE
  pause
  exit /b 1
)

if not exist "%~dp0node_modules\asar" (
  call :say INSTALLING
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    call :say INSTALL_FAILED
    pause
    exit /b 1
  )
)

node "%~dp0scripts\patcher.js" --auto --lang zh-CN %*
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" pause
endlocal & exit /b %EXIT_CODE%

:say
if /I "%~1"=="NEED_NODE" set "MESSAGE_B64=6ZyA6KaBIE5vZGUuanMgMjAg5oiW5pu06auY54mI5pys44CC"
if /I "%~1"=="INSTALLING" set "MESSAGE_B64=6aaW5qyh5L2/55So77yM5q2j5Zyo5a6J6KOF5b+F6KaB57uE5Lu2Li4u"
if /I "%~1"=="INSTALL_FAILED" set "MESSAGE_B64=5L6d6LWW5a6J6KOF5aSx6LSl77yM6K+35qOA5p+l572R57uc6L+e5o6l5ZCO6YeN6K+V44CC"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$OutputEncoding=[Console]::OutputEncoding=[Text.Encoding]::UTF8; Write-Host ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('%MESSAGE_B64%')))"
exit /b 0
