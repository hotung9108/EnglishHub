@echo off
setlocal
cd /d "%~dp0..\selenium"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22+ first.
  pause
  exit /b 1
)
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created test/selenium\.env. Fill teacher credentials and QA29 fixture names, then run again.
  pause
  exit /b 2
)
if not exist "node_modules\selenium-webdriver\package.json" (
  call npm.cmd ci --no-audit --no-fund --cache .cache/npm
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
call npm.cmd run test:teacher
set "qa29ExitCode=%errorlevel%"
echo.
echo Reports: test/selenium\reports\qa29-...
pause
exit /b %qa29ExitCode%
