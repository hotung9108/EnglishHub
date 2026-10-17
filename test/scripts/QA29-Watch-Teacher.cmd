@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\selenium\tools\Watch-Teacher.ps1"
set "qa29WatchExit=%errorlevel%"
pause
exit /b %qa29WatchExit%
