@echo off
title SherpaNav Himalayan Navigation
echo ===================================================
echo   SherpaNav Himalayan Navigation System
echo ===================================================
echo Starting local web server on port 8080...
start "" "http://localhost:8080/"
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 8080
pause
