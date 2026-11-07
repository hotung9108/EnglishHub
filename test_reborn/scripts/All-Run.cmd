@echo off
setlocal
echo =================================================================
echo === [ENGLISHHUB] CHAY TOAN DIEN HE THONG (API + E2E PARALLEL) ===
echo =================================================================
cd /d "%~dp0\..\black-box\api"
echo --- [BUOC 1/2] KIEM THU API SONG SONG ---
call node run.cjs --parallel %*
cd /d "%~dp0\..\black-box\e2e"
echo --- [BUOC 2/2] KIEM THU E2E PARALLEL 3 VAI TRO ---
call node run-parallel.js %*
exit /b %ERRORLEVEL%
