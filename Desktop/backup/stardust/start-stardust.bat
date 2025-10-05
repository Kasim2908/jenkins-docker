@echo off
echo Starting Stardust Web Client...
echo.
echo Server will start at: http://localhost:8000
echo Press Ctrl+C to stop the server
echo.

cd /d "c:\Users\Acer\Desktop\backup\stardust\stardust\webclient"
python -m http.server 8000

pause