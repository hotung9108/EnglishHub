@echo off
setlocal
cd /d "%~dp0..\selenium"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22+ first.
  pause
  exit /b 2
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Configure QA Admin, Teacher and Student credentials in test/selenium/.env, then run again.
  pause
  exit /b 2
)
if not exist "node_modules\selenium-webdriver\package.json" (
  call npm.cmd ci --no-audit --no-fund --cache .cache/npm
  if errorlevel 1 exit /b 1
)
call npm.cmd run test:student -- %*
set "qa30Exit=%errorlevel%"
echo Reports: test/selenium/reports/qa30-...
pause
exit /b %qa30Exit%
