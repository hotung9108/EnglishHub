@echo off
chcp 65001 >nul
pushd "%~dp0..\selenium"
node tools/watch-admin.mjs
set "QA31_EXIT=%errorlevel%"
popd
pause
exit /b %QA31_EXIT%
