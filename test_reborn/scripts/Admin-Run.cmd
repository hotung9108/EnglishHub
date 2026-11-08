@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [E2E] CHAY KIEM THU LUONG QUAN TRI VIEN (ADMIN - HEADLESS) ===
node admin/run.js %*
exit /b %ERRORLEVEL%
