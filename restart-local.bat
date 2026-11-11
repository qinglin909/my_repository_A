@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo.
echo ==== Restart LOCAL backend on port 3000 ====
echo.

echo [1/4] Kill existing process listening on port 3000 ...
set FOUND=0
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    if not "%%P"=="0" (
        echo        kill PID %%P
        taskkill /PID %%P /F >nul 2>&1
        set FOUND=1
    )
)
if "!FOUND!"=="0" echo        none - port already free

echo [2/4] Wait for the port to be released ...
ping -n 2 127.0.0.1 >nul

echo [3/4] Start backend in a NEW window ...
start "solar-lunar-backend" /D "%~dp0" cmd /k node local_server.js

echo [4/4] Health check ...
ping -n 4 127.0.0.1 >nul
curl -s --max-time 5 http://localhost:3000/api/health
echo.
echo.
echo If the line above shows {"ok":true,...}, restart succeeded.
echo Frontend Vite (port 5173) was NOT touched - keep it running.
echo Close the "solar-lunar-backend" window to stop the backend.
echo.
pause
