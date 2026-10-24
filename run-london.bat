@echo off
cd /d "%~dp0"
chcp 65001 >nul
title MiroProbe AI - Real International Visitors Swarm (Headed & Headless)
color 0B

echo ============================================================================
echo   MiroProbe AI - Real International Visitors Swarm (Playwright Real Browsers)
echo   Target Website : https://meyar-gold-egypt.pages.dev
echo ============================================================================
echo.
echo Select Mode:
echo   [1] HEADED (Open Real Chrome Windows on Your Screen - نوافذ كروم حقيقية أمامك)
echo   [2] HEADLESS (Fast Background Mode - تشغيل صامت وسريع في الخلفية)
echo.
set /p mode="Enter mode (1 or 2, default is 1): "

if "%mode%"=="2" (
    echo.
    echo [*] Starting 100 Real Visits in Background Mode (Headless)...
    call node run-london-100.js https://meyar-gold-egypt.pages.dev 100 5
) else (
    echo.
    echo [*] Starting Real Visits in Visible Chrome Window Mode (Headed)...
    call node run-london-100.js https://meyar-gold-egypt.pages.dev 20 2 --headed
)

echo.
echo ============================================================================
echo   Done! Impressions and visits sent.
echo ============================================================================
pause
