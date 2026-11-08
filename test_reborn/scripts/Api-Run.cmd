@echo off
setlocal
cd /d "%~dp0\..\black-box\api"
echo === [API] CHAY 8 BO KIEM THU API BLACK-BOX (TUAN TU) ===
node run.cjs %*
exit /b %ERRORLEVEL%
