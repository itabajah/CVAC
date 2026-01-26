@echo off
:: CV As Code - Windows Launcher
:: Double-click to start. Close browser tab or press Ctrl+C to stop.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Run the cross-platform launcher
cd /d "%~dp0"
node src/launcher/index.js

:: Auto-close after the script ends
timeout /t 2 /nobreak >nul
exit
