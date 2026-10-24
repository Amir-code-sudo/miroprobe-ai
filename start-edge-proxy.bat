@echo off
chcp 65001 >nul
title MiroProbe AI - Residential Edge Proxy Node
cls
echo ============================================================================
echo   MiroProbe AI - Residential Edge Gateway (0.0.0.0:8888)
echo ============================================================================
echo   Local Proxy Node is starting...
echo ============================================================================
echo.
node edge-proxy.js
pause
