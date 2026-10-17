@echo off
setlocal
cd /d "%~dp0..\selenium"
echo Delete only QA29 test resources on staging. Reports and shared accounts are kept.
node support/teacher/cleanup-fixtures.js --apply
set "qa29CleanupExit=%errorlevel%"
pause
exit /b %qa29CleanupExit%
