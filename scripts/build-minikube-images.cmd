@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-minikube-images.ps1" %*
exit /b %ERRORLEVEL%
