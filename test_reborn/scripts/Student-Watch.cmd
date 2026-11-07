@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [E2E] THEO DOI TRUC TIEP LUONG HOC VIEN (STUDENT - WATCH UI) ===
node student/run.js --watch %*
exit /b %ERRORLEVEL%
