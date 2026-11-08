@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [E2E] CHAY KIEM THU LUONG GIAO VIEN (TEACHER - HEADLESS) ===
node teacher/run.js %*
exit /b %ERRORLEVEL%
