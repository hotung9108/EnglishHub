@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [ENGLISHHUB] CHAY PARALLEL E2E TOI UU (ADMIN + TEACHER + STUDENT) ===
node run-parallel.js %*
exit /b %ERRORLEVEL%
