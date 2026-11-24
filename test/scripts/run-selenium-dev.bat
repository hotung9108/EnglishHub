@echo off
setlocal
cd /d "%~dp0..\selenium"
set "TEST_ENV=dev"
set "SELENIUM_BASE_URL=http://localhost:5173"
call npm.cmd test
exit /b %ERRORLEVEL%
