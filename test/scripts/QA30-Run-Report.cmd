@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\selenium\tools\Run-Student.ps1" %*
set "qa30Result=%errorlevel%"
echo.
echo QA30 finished. Review the report and existing issue links together.
if /I not "%~1"=="-CheckOnly" pause
exit /b %qa30Result%
