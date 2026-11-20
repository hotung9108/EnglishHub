@echo off
setlocal
cd /d "%~dp0"
echo =================================================================
echo   [ENGLISHHUB] CHAY KIEM THU THU CONG VA AUDIT UI/UX CHUYEN SAU
echo =================================================================
node run_ux_audit.js %*
exit /b %ERRORLEVEL%
