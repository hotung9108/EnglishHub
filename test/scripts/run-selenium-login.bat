@echo off
setlocal
cd /d "%~dp0..\selenium"
if not exist .env (
  copy /y .env.example .env >nul
  echo Fill SELENIUM_TEACHER_EMAIL and SELENIUM_TEACHER_PASSWORD in test\selenium\.env, then run again.
  pause
  exit /b 2
)
if not exist node_modules\selenium-webdriver\package.json (
  call npm.cmd ci --no-audit --no-fund --cache .cache\npm
  if errorlevel 1 exit /b 1
)
call npm.cmd run test:login
set "SELENIUM_EXIT=%ERRORLEVEL%"
echo Reports: %CD%\reports
pause
exit /b %SELENIUM_EXIT%
