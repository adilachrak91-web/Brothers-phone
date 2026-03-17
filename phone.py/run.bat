@echo off
REM تشغيل خادم Brothers-Phone على Windows
REM Running Brothers-Phone Server on Windows

echo.
echo ========================================
echo  Brothers-Phone Web Server
echo ========================================
echo.
echo Serving on http://localhost:8000
echo.

cd /d "%~dp0"
python -m http.server 8000

if errorlevel 1 (
    echo.
    echo Error: Python is not installed or not in PATH
    echo Make sure Python is installed: https://www.python.org
    echo.
    pause
)
