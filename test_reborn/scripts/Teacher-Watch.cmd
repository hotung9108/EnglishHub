@echo off
setlocal
cd /d "%~dp0\..\black-box\e2e"
echo === [E2E] THEO DOI TRUC TIEP LUONG GIAO VIEN (TEACHER - WATCH UI) ===
node teacher/run.js --watch %*
exit /b %ERRORLEVEL%
