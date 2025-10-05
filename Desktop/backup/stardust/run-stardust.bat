@echo off
echo Starting Stardust Web Client...
echo.

cd /d "c:\Users\Acer\Desktop\backup\stardust\stardust\webclient"

echo Starting server in background...
start "" /B python -m http.server 8000

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

echo Opening Stardust in your default browser...
start http://localhost:8000/

echo.
echo Stardust is now running at: http://localhost:8000
echo.
echo To stop the server:
echo 1. Press Ctrl+C in this window, or
echo 2. Close this window and run: taskkill /f /im python.exe
echo.
pause