@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\selenium\tools\Watch-Student.ps1" %*
set "qa30WatchExit=%errorlevel%"
pause
exit /b %qa30WatchExit%
