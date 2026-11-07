@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [E2E] THEO DOI TRUC TIEP LUONG QUAN TRI VIEN (ADMIN - WATCH UI) ===
node admin/run.js --watch %*
exit /b %ERRORLEVEL%
