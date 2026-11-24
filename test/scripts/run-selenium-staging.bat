@echo off
setlocal
cd /d "%~dp0..\selenium"
set "TEST_ENV=staging"
call npm.cmd test
exit /b %ERRORLEVEL%
