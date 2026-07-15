@echo off
REM ===== Bachpan School Management - one-click launcher =====
REM Double-click this file to start both the backend and frontend.
REM Two terminal windows will open. Keep them open while using the app.
REM Close them (or press Ctrl+C in each) to stop the app.

echo Starting Bachpan...

start "Bachpan Backend"  cmd /k "cd /d "%~dp0backend"  && npm start"
start "Bachpan Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Two windows opened (Backend + Frontend).
echo.
echo   On this PC:  http://localhost:5173
echo   On phone:    see the "Network:" line in the Frontend window
echo.
echo You can close THIS window.
timeout /t 8 >nul
