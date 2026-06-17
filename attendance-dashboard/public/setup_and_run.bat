@echo off
setlocal enabledelayedexpansion

echo ========================================
echo    Attendance System - One-Click Setup
echo ========================================
echo.

:: --- 1. Install Python if missing ---
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Installing via winget...
    winget install Python.Python.3.11 --silent --accept-package-agreements --accept-source-agreements
    if %errorlevel% neq 0 (
        echo Failed to install Python. Please install Python manually from python.org and re-run this batch.
        pause
        exit /b 1
    )
    :: Refresh PATH (winget adds Python to PATH after install, but may need a restart)
    echo Python installed. Please RESTART this batch file once installation finishes.
    pause
    exit /b 0
)

echo Python is installed.

:: --- 2. Install required packages ---
echo Installing required packages...
python -m pip install --quiet pyserial supabase
if %errorlevel% neq 0 (
    echo Failed to install packages. Check internet connection.
    pause
    exit /b 1
)

echo All dependencies ready.

:: --- 3. Run the service silently ---
echo Starting attendance service (hidden)...
cd /d "%~dp0"
start "" /B pythonw.exe "%cd%\attendance_service.py"

echo Service is now running in background.
echo Check attendance_service.log for details.
echo You can close this window.
pause