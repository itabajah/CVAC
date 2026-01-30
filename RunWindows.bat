@echo off
:: CV As Code - Windows Launcher
:: Double-click to start. Close browser tab or press Ctrl+C to stop.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Node.js is not installed.
    echo.
    echo Would you like to install Node.js automatically using winget?
    echo.
    set /p INSTALL_NODE="Press Y to install automatically, or any other key to exit: "
    if /i "%INSTALL_NODE%"=="y" (
        echo.
        echo [INFO] Installing Node.js via winget...
        echo.
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        if %errorlevel% neq 0 (
            echo.
            echo [ERROR] Failed to install Node.js via winget.
            echo [INFO] Please install manually from https://nodejs.org
            echo.
            pause
            exit /b 1
        )
        echo.
        echo [SUCCESS] Node.js installed successfully!
        echo [INFO] Please close this window and run RunWindows.bat again.
        echo.
        pause
        exit /b 0
    ) else (
        echo.
        echo [INFO] Installation cancelled. Please install Node.js manually from https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

:: Run the cross-platform launcher
cd /d "%~dp0"
node src/launcher/index.js

:: Auto-close after the script ends
timeout /t 2 /nobreak >nul
exit
