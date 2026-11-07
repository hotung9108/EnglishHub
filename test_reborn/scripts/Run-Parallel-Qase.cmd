@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [ENGLISHHUB] CHAY PARALLEL E2E VA DONG BO LEN QASE TMS ===
node run-parallel.js --sync-qase %*
exit /b %ERRORLEVEL%
y