@echo off
chcp 65001 >nul
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-Admin.ps1" %*
set "QA31_EXIT=%errorlevel%"
pause
exit /b %QA31_EXIT%
