@echo off
chcp 65001 >nul
title MiroProbe AI - Residential Edge Proxy Node
cls
echo ============================================================================
echo   MiroProbe AI — بوابة البروكسي المنزلي للابتوب (Residential Edge Gateway)
echo ============================================================================
echo   تقوم هذه البوابة بتحويل جهازك إلى نقطة خروج سكنية (Residential Node)
echo   تسمح للسحابة (Codespaces / Azure) بتوجيه الترافيك عبر اتصالك المنزلي
echo ============================================================================
echo.
echo [*] جاري تشغيل خادم البروكسي المحلي على المنفذ 8888...
echo.
node edge-proxy.js
pause
