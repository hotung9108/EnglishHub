@echo off
setlocal
cd /d "%~dp0..\selenium"
if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Fill SELENIUM Admin, Teacher and Student credentials in test/selenium\.env, then run again.
  pause
  exit /b 2
)
node support/teacher/prepare-fixtures.js
set "qa29PrepareExit=%errorlevel%"
echo.
if "%qa29PrepareExit%"=="0" (
  echo Fixture names have been configured. You can now run QA29-Run-Teacher.cmd.
) else (
  echo Preparation failed. Check the error above and re-run after fixing staging or credentials.
)
pause
exit /b %qa29PrepareExit%
