@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [E2E] CHAY KIEM THU LUONG HOC VIEN (STUDENT - HEADLESS) ===
node student/run.js %*
exit /b %ERRORLEVEL%
