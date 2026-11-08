@echo off
setlocal
cd /d "%~dp0\..\black-box\api"
echo === [API] CHAY 8 BO KIEM THU API BLACK-BOX SONG SONG (SIEU TOC) ===
node run.cjs --parallel %*
exit /b %ERRORLEVEL%
