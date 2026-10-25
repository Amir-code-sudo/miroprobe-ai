@echo off
chcp 65001 >nul
title MiroProbe AI - Visitor Scenario ^& Load Testing Studio (Graduation Project)
color 0B

:: Auto-unblock files from Internet (Mark-of-the-Web) to suppress Windows Security Warning
powershell -NoProfile -Command "Get-ChildItem -Path '%~dp0' -Recurse | Unblock-File" >nul 2>nul

set "TARGET_URL=https://cinewave-hub.pages.dev"
set "TOTAL_VISITS=20"
set "WORKERS_COUNT=5"
set "SELECTED_WORKER=0"
set "TARGET_VPM=1000"
set "TEST_DURATION=30s"
set "TARGET_GEO=ALL"
set "TRAFFIC_SOURCE=ALL_SOCIAL"
set "DEVICE_MIX=BALANCED"
call :UPDATE_CONFIG_VARS

echo ============================================================================
echo   MiroProbe AI - Autonomous Visitor Scenario Discovery ^& Load Simulator
echo   Target Website : "%TARGET_URL%"
echo   Configured Rate: %TARGET_VPM% Visitors / Minute  ^|  Duration: %TEST_DURATION%
echo ============================================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed on this laptop!
    echo Please install Node.js LTS from https://nodejs.org/ and run this file again.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [1/2] Installing project npm packages...
    call npm install
)

if not exist ".playwright-ready" (
    echo [2/2] Downloading Playwright Chromium browser engine ^(first-time setup^)...
    call npx playwright install chromium
    if %ERRORLEVEL% EQU 0 (
        echo ok > .playwright-ready
    )
)

:: Ensure CineWave streaming portal is running on port 8080 if available
if exist "..\cinewave-hub\serve.js" (
    netstat -ano | findstr :8080 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [*] Starting CineWave Portal on http://localhost:8080 ...
        start "CineWave Portal" /min node "..\cinewave-hub\serve.js"
        timeout /t 1 /nobreak >nul
    )
)

:: Ensure MiroProbe local server is always running on port 3000
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [*] Starting MiroProbe Background Dashboard Server on http://localhost:3000 ...
    start "MiroProbe Server" /min node server.js
    timeout /t 2 /nobreak >nul
)

:MENU
call :UPDATE_CONFIG_VARS
echo.
echo ----------------------------------------------------------------------------
echo   Active Target URL : "%TARGET_URL%"
echo   Target Volume     : %TOTAL_VISITS% Visits  ^|  VPM: %TARGET_VPM%  ^|  Duration: %TEST_DURATION%
echo   Active Worker     : %WORKER_NAME%
echo   Safe Concurrency  : %WORKERS_COUNT% Parallel Windows  ^|  Batch Waves: %CALC_WAVES%
echo   Target Country    : %TARGET_GEO% (Geo-Diversity)  ^|  Source: %TRAFFIC_SOURCE%
echo   Device Profiles   : %DEVICE_MIX%
echo   Local Dashboard   : http://localhost:3000 (Active)
echo ----------------------------------------------------------------------------
echo Select Operation Mode:
echo   [1] Open Interactive Dashboard in Browser (http://localhost:3000)
echo   [2] Run Single Visitor Persona (%WORKER_NAME% - 1 Headed Browser)
echo   [3] Run Multi-Visitor Concurrent Wave (%TOTAL_VISITS% Visits / %WORKERS_COUNT% Parallel Windows)
echo   [4] Enter New Target URL ^& Run Autonomous AI Discovery (Scrapes DOM ^& Generates Tests)
echo   [5] Configure Volume, Worker Type, Geo Country ^& Traffic Sources
echo   [6] Run High-Scale Behavioral Load Simulation (%TARGET_VPM% Visitors/Min)
echo   [7] Run Real Visitors Swarm (%TOTAL_VISITS% Visits / %WORKERS_COUNT% Parallel)
echo   [8] Run Anti-Bot ^& Biometrics Live Verification (Headed Stealth Audit)
echo   [9] Open Anti-Bot Lab in Browser (http://localhost:3000/bot-audit)
echo   [10] Authenticate User Session (Login once to Instagram or Web App to Save State)
echo   [11] Exit
echo.
set /p choice="Enter option number (1-11): "

if "%choice%"=="1" goto RUN_DASHBOARD
if "%choice%"=="2" goto RUN_PLAYWRIGHT
if "%choice%"=="3" goto RUN_PLAYWRIGHT_WAVE
if "%choice%"=="4" goto CHANGE_URL
if "%choice%"=="5" goto CONFIGURE_VOLUME
if "%choice%"=="6" goto RUN_LOAD_ENGINE
if "%choice%"=="7" goto RUN_LONDON_SWARM
if "%choice%"=="8" goto RUN_STEALTH_TEST
if "%choice%"=="9" goto OPEN_BOT_AUDIT
if "%choice%"=="10" goto RECORD_SESSION
if "%choice%"=="11" exit /b 0
goto MENU

:UPDATE_CONFIG_VARS
if "%TOTAL_VISITS%"=="" set "TOTAL_VISITS=20"
if "%WORKERS_COUNT%"=="" set "WORKERS_COUNT=5"

if "%SELECTED_WORKER%"=="1" goto SET_W1
if "%SELECTED_WORKER%"=="2" goto SET_W2
if "%SELECTED_WORKER%"=="3" goto SET_W3
if "%SELECTED_WORKER%"=="4" goto SET_W4
goto SET_WALL

:SET_W1
set "WORKER_NAME=Worker 1: [EG] Trend & Anime Explorer (الأكثر رواجاً والأنمي)"
set "PW_WAVE_FILTER=Persona.1"
set "SIM_PERSONA=1"
set "REPEAT_WAVES=%TOTAL_VISITS%"
set /a CALC_WAVES=TOTAL_VISITS + WORKERS_COUNT - 1 >nul 2>&1
set /a CALC_WAVES/=WORKERS_COUNT >nul 2>&1
exit /b 0

:SET_W2
set "WORKER_NAME=Worker 2: [SA] Cinema & Server Streamer (مشاهدة وسيرفرات البث)"
set "PW_WAVE_FILTER=Persona.2"
set "SIM_PERSONA=2"
set "REPEAT_WAVES=%TOTAL_VISITS%"
set /a CALC_WAVES=TOTAL_VISITS + WORKERS_COUNT - 1 >nul 2>&1
set /a CALC_WAVES/=WORKERS_COUNT >nul 2>&1
exit /b 0

:SET_W3
set "WORKER_NAME=Worker 3: [US] Search & IMDb Filter (البحث المباشر والتقييم)"
set "PW_WAVE_FILTER=Persona.3"
set "SIM_PERSONA=3"
set "REPEAT_WAVES=%TOTAL_VISITS%"
set /a CALC_WAVES=TOTAL_VISITS + WORKERS_COUNT - 1 >nul 2>&1
set /a CALC_WAVES/=WORKERS_COUNT >nul 2>&1
exit /b 0

:SET_W4
set "WORKER_NAME=Worker 4: [GB] Mobile Binge Streamer (تصفح الموبايل والأجهزة الذكية)"
set "PW_WAVE_FILTER=Persona.4"
set "SIM_PERSONA=4"
set "REPEAT_WAVES=%TOTAL_VISITS%"
set /a CALC_WAVES=TOTAL_VISITS + WORKERS_COUNT - 1 >nul 2>&1
set /a CALC_WAVES/=WORKERS_COUNT >nul 2>&1
exit /b 0

:SET_WALL
set "SELECTED_WORKER=0"
set "WORKER_NAME=All Personas (خليط ذكي متوازن من كافة الشخصيات 1 و 2 و 3 و 4)"
set "PW_WAVE_FILTER=Persona"
set "SIM_PERSONA=ALL"
set /a REPEAT_WAVES=TOTAL_VISITS / 4 >nul 2>&1
if "%REPEAT_WAVES%"=="" set "REPEAT_WAVES=1"
if "%REPEAT_WAVES%"=="0" set "REPEAT_WAVES=1"
set /a CALC_TOTAL=REPEAT_WAVES * 4 >nul 2>&1
set /a CALC_WAVES=CALC_TOTAL + WORKERS_COUNT - 1 >nul 2>&1
set /a CALC_WAVES/=WORKERS_COUNT >nul 2>&1
exit /b 0

:CHANGE_URL
echo.
set "NEW_URL="
set /p "NEW_URL=Paste the target website URL: "
if defined NEW_URL set "TARGET_URL=%NEW_URL%"
echo.
echo ============================================================================
echo   Running MiroProbe AI Autonomous Crawler
echo ============================================================================
call node ai-crawler.js "%TARGET_URL%"
pause
goto MENU

:CONFIGURE_VOLUME
echo.
echo ============================================================================
echo   Visitor Volume, Worker Type, Geo Country ^& Traffic Configuration
echo   (تحديد إجمالي عدد الزوار، نوع الـ Worker، وتقسيم الدفعات لحماية الجهاز)
echo ============================================================================
echo.
echo [1] إجمالي عدد الزيارات المستهدفة (Total Desired Visits):
echo     (مثال: 20 أو 50 لمتصفحات الشاشة الحقيقية، أو 500 أو 1000 لمحاكاة الضغط)
set /p NEW_TOTAL="  Enter Total Visits (Current: %TOTAL_VISITS%): "
if not "%NEW_TOTAL%"=="" (
    set "TOTAL_VISITS=%NEW_TOTAL%"
    set "TARGET_VPM=%NEW_TOTAL%"
)

echo.
echo [2] اختيار نوع الـ Worker المنفذ للزيارات (Worker Persona Selection):
echo     [0] All Personas (خليط ذكي متوازن من كافة الشخصيات 1 و 2 و 3 و 4)
echo     [1] Worker 1: 🇪🇬 الأكثر رواجاً والأنمي (Trending ^& Anime Explorer)
echo     [2] Worker 2: 🇸🇦 مشاهد الأفلام ومشغل السيرفرات (Cinema Streamer ^& Modal Watcher)
echo     [3] Worker 3: 🇺🇸 الباحث المباشر ومفرز الجودة بـ IMDb (Search Bar ^& Rating Filter)
echo     [4] Worker 4: 🇬🇧 متصفح الموبايل وعاشق الأنمي (Mobile Binge Streamer)
set /p NEW_WORKER_TYPE="  Enter worker type (0-4, Current: %SELECTED_WORKER%): "
if not "%NEW_WORKER_TYPE%"=="" set "SELECTED_WORKER=%NEW_WORKER_TYPE%"

echo.
echo [3] أقصى عدد نوافذ كروم متوازية في نفس اللحظة (Safe Concurrency Limit):
echo     (يحمي اللابتوب والمعالج من الانهيار والتهنيج - الافتراضي والموصى به: 5 نوافذ)
set /p NEW_WORKERS="  Enter max parallel windows (1 to 10, Current: %WORKERS_COUNT%): "
if not "%NEW_WORKERS%"=="" set "WORKERS_COUNT=%NEW_WORKERS%"

call :UPDATE_CONFIG_VARS

echo.
echo ----------------------------------------------------------------------------
echo   🛡️ خطة التشغيل والتقسيم الذكية (Smart Execution Plan):
echo   • إجمالي الزيارات المطلوب تنفيذها: %TOTAL_VISITS% زيارة
echo   • نوع الـ Worker المختار         : %WORKER_NAME%
echo   • النوافذ المتزامنة في اللحظة    : %WORKERS_COUNT% نوافذ كحد أقصى (لحماية الرامات)
echo   • عدد الدفعات المتعاقبة (Waves)  : حوالي %CALC_WAVES% دفعات متتالية
echo   • نتيجة الأمان                   : الجهاز يعمل بسلاسة 100%% بدون تهنيج أو سقوط!
echo ----------------------------------------------------------------------------
echo.
echo [4] مدة الفحص السريع لمحاكي التحمل (Test Duration for High-Scale Simulation):
set /p NEW_DUR="  Enter test duration (e.g. 30s, 1m, 2m, Current: %TEST_DURATION%): "
if not "%NEW_DUR%"=="" set "TEST_DURATION=%NEW_DUR%"

echo.
echo [5] الدولة والمنطقة الجغرافية (Target Country ^& Multi-Region Geo):
echo     Options: ALL (Multi-Region Mix), SA (Saudi), EG (Egypt), US (USA), GB (UK), AE (UAE), DE (Germany)
set /p NEW_GEO="  Enter target country (Current: %TARGET_GEO%): "
if not "%NEW_GEO%"=="" set "TARGET_GEO=%NEW_GEO%"

echo.
echo [6] مصدر الزيارات وحملات السوشيال ميديا (Traffic Source ^& Social Campaigns):
echo     Options: ALL_SOCIAL, FACEBOOK, INSTAGRAM, TIKTOK, GOOGLE, DIRECT
set /p NEW_SRC="  Enter traffic source (Current: %TRAFFIC_SOURCE%): "
if not "%NEW_SRC%"=="" set "TRAFFIC_SOURCE=%NEW_SRC%"

echo.
echo [7] ملف الأجهزة وأنظمة التشغيل (Operating System ^& Device Profile):
echo     Options: BALANCED (Windows, Mac, iOS, Android), MOBILE_ONLY, DESKTOP_ONLY
set /p NEW_DEV="  Enter device mix (Current: %DEVICE_MIX%): "
if not "%NEW_DEV%"=="" set "DEVICE_MIX=%NEW_DEV%"

:: Persist changes to miroprobe-config.json
node -e "const fs = require('fs'); const p = './miroprobe-config.json'; let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(p, 'utf8')); } catch(_) {} cfg.targetUrl = '%TARGET_URL%'; cfg.totalVisits = %TOTAL_VISITS%; cfg.visitorsPerMinute = %TARGET_VPM%; cfg.parallelWorkers = %WORKERS_COUNT%; cfg.selectedWorker = '%SELECTED_WORKER%'; cfg.repeatWaves = %REPEAT_WAVES%; cfg.targetGeo = '%TARGET_GEO%'; cfg.trafficSource = '%TRAFFIC_SOURCE%'; cfg.deviceMix = '%DEVICE_MIX%'; fs.writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');" >nul 2>&1

echo.
echo [OK] تم حفظ الإعدادات وتقسيم الدفعات بنجاح!
pause
goto MENU

:RUN_DASHBOARD
echo.
echo Opening MiroProbe Dashboard in your browser...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    start "MiroProbe Server" /min node server.js
    timeout /t 2 /nobreak >nul
)
start http://localhost:3000
goto MENU

:RUN_PLAYWRIGHT
call :UPDATE_CONFIG_VARS
echo.
echo ============================================================================
echo   Run Single Visitor Persona (1 Real Headed Browser Window)
echo   Current Configured Worker: %WORKER_NAME%
echo ============================================================================
echo   [1] Start Execution Now (%WORKER_NAME%)
echo   [2] Select Different Worker for this Run
echo   [B] Back to Main Menu
echo.
set "single_choice=1"
set /p "single_choice=Enter choice (1, 2, or B, default 1): "
if /i "%single_choice%"=="B" goto MENU
if "%single_choice%"=="2" (
    echo.
    echo Select Worker:
    echo   [0] Run ALL Personas in Sequence (1 by 1)
    echo   [1] Worker 1: 🇪🇬 الأكثر رواجاً والأنمي
    echo   [2] Worker 2: 🇸🇦 مشاهد الأفلام ومشغل السيرفرات
    echo   [3] Worker 3: 🇺🇸 الباحث المباشر ومفرز الجودة بـ IMDb
    echo   [4] Worker 4: 🇬🇧 متصفح الموبايل وعاشق الأنمي
    set /p "sw_choice=Enter worker (0-4): "
    if not "%sw_choice%"=="" (
        set "SELECTED_WORKER=%sw_choice%"
        call :UPDATE_CONFIG_VARS
    )
)
echo.
echo Launching 1 Visible Chromium Window for: %WORKER_NAME% ...
set "TARGET_URL=%TARGET_URL%"
set "TARGET_GEO=%TARGET_GEO%"
set "TRAFFIC_SOURCE=%TRAFFIC_SOURCE%"
set "DEVICE_MIX=%DEVICE_MIX%"
call npx playwright test playwright-personas.spec.ts --headed --workers=1 -g %PW_WAVE_FILTER%
pause
goto MENU

:RUN_PLAYWRIGHT_WAVE
call :UPDATE_CONFIG_VARS
echo.
echo ============================================================================
echo   Running Multi-Visitor Concurrent Wave (Playwright Real Headed Browsers)
echo   Target Volume  : %TOTAL_VISITS% Total Real Visits
echo   Active Worker  : %WORKER_NAME%
echo   Safe Limit     : %WORKERS_COUNT% Parallel Windows (Batching over %CALC_WAVES% Waves)
echo ============================================================================
echo   [1] Start Execution with Configured Worker (%WORKER_NAME%)
echo   [2] Change Worker Type for this Run Only
echo   [B] Back to Main Menu
echo.
set "wave_choice=1"
set /p "wave_choice=Enter choice (1, 2, or B, default 1): "
if /i "%wave_choice%"=="B" goto MENU
if "%wave_choice%"=="2" (
    echo.
    echo Select Worker Persona for this run:
    echo   [0] All Personas (خليط متوازن)
    echo   [1] Worker 1: 🇪🇬 الأكثر رواجاً والأنمي
    echo   [2] Worker 2: 🇸🇦 مشاهد الأفلام ومشغل السيرفرات
    echo   [3] Worker 3: 🇺🇸 البحث وفرز الجودة بـ IMDb
    echo   [4] Worker 4: 🇬🇧 متصفح الموبايل وعاشق الأنمي
    set /p "sub_w=Enter worker (0-4): "
    if not "%sub_w%"=="" (
        set "SELECTED_WORKER=%sub_w%"
        call :UPDATE_CONFIG_VARS
    )
)

echo.
echo [*] Launching %WORKERS_COUNT% Parallel Chromium Browsers in Safe Batching Waves...
echo [*] Total Visits to complete: %TOTAL_VISITS% (Safe waves: %CALC_WAVES%) ...
set "TARGET_GEO=%TARGET_GEO%"
set "TRAFFIC_SOURCE=%TRAFFIC_SOURCE%"
set "DEVICE_MIX=%DEVICE_MIX%"
call npx playwright test playwright-personas.spec.ts --headed --workers=%WORKERS_COUNT% --repeat-each=%REPEAT_WAVES% -g %PW_WAVE_FILTER%
pause
goto MENU

:RUN_STEALTH_TEST
echo.
echo ============================================================================
echo   Running MiroProbe AI Anti-Bot ^& Biometrics Verification Suite
echo   (Testing navigator.webdriver, WebGL GPU Spoofing, Canvas Noise, Bézier Curves)
echo ============================================================================
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    start "MiroProbe Server" /min node server.js
    timeout /t 2 /nobreak >nul
)
call npx playwright test verify-stealth.spec.ts --headed
pause
goto MENU

:OPEN_BOT_AUDIT
echo.
echo Opening Anti-Bot ^& Fingerprint Verification Lab in your browser...
netstat -ano | findstr :3000 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    start "MiroProbe Server" /min node server.js
    timeout /t 2 /nobreak >nul
)
start http://localhost:3000/bot-audit
goto MENU

:RUN_LOAD_ENGINE
call :UPDATE_CONFIG_VARS
echo.
echo ============================================================================
echo   MiroProbe AI High-Scale Behavioral Load Simulation
echo   Target : "%TARGET_URL%"  ^|  Rate: %TARGET_VPM% VPM  ^|  Duration: %TEST_DURATION%
echo   Worker : %WORKER_NAME% (Persona %SIM_PERSONA%)
echo   Region : %TARGET_GEO%  ^|  Source: %TRAFFIC_SOURCE%  ^|  Device: %DEVICE_MIX%
echo ============================================================================
echo   [1] Start Simulation Now
echo   [2] Change Worker or Volume for this run
echo   [B] Back to Main Menu
echo.
set "sim_choice=1"
set /p "sim_choice=Enter choice (1, 2, or B, default 1): "
if /i "%sim_choice%"=="B" goto MENU
if "%sim_choice%"=="2" (
    echo.
    set /p "new_vpm=Enter Visitors Per Minute (current: %TARGET_VPM%): "
    if not "%new_vpm%"=="" set "TARGET_VPM=%new_vpm%"
    echo Select Worker:
    echo   [0] Balanced Mix of All Personas
    echo   [1] Dedicated Worker 1: 🇪🇬 الأكثر رواجاً والأنمي
    echo   [2] Dedicated Worker 2: 🇸🇦 مشاهد الأفلام ومشغل السيرفرات
    echo   [3] Dedicated Worker 3: 🇺🇸 الباحث المباشر ومفرز الجودة بـ IMDb
    echo   [4] Dedicated Worker 4: 🇬🇧 متصفح الموبايل وعاشق الأنمي
    set /p "sub_s=Enter worker (0-4): "
    if not "%sub_s%"=="" (
        set "SELECTED_WORKER=%sub_s%"
        call :UPDATE_CONFIG_VARS
    )
)
echo.
echo Running High-Scale Load Simulation...
call node load-engine.js "%TARGET_URL%" %TARGET_VPM% "%TEST_DURATION%" "%TARGET_GEO%" "%TRAFFIC_SOURCE%" "%DEVICE_MIX%" "%SIM_PERSONA%"
pause
goto MENU

:RUN_LONDON_SWARM
call :UPDATE_CONFIG_VARS
echo.
echo ============================================================================
echo   Running Real International Visitors Swarm (Playwright Real Browsers)
echo   Target Volume  : %TOTAL_VISITS% Real Visits
echo   Concurrency    : %WORKERS_COUNT% Parallel Windows
echo   Target Website : "%TARGET_URL%"
echo ============================================================================
echo.
set "custom_vol="
set /p custom_vol="Enter visits count (Press Enter to keep %TOTAL_VISITS%): "
if not "%custom_vol%"=="" set "TOTAL_VISITS=%custom_vol%"
echo.
echo Select Execution Engine:
echo   [1] ⚡ Extreme Turbo Engine (أسرع 10 أضعاف + توفير 80%% رامات ومعالج + خروج ذكي بعد إشعار الإعلان)
echo   [2] 🖥️ Visible Chrome Windows on Screen (Headed - ترى المتصفحات تتحرك أمامك)
echo   [3] ⚡ Standard Headless Swarm
echo.
set "swarm_mode=1"
set /p swarm_mode="Enter choice (1-3, default is 1): "
if "%swarm_mode%"=="2" (
    call node run-london-100.js "%TARGET_URL%" %TOTAL_VISITS% %WORKERS_COUNT% --headed
) else if "%swarm_mode%"=="3" (
    call node run-london-100.js "%TARGET_URL%" %TOTAL_VISITS% %WORKERS_COUNT%
) else (
    call node turbo-engine.js "%TARGET_URL%" %TOTAL_VISITS% %WORKERS_COUNT%
)
pause
goto MENU

:RECORD_SESSION
echo.
echo ============================================================================
echo   MiroProbe AI — Authenticated Session Recorder
echo   Target: %TARGET_URL%
echo ============================================================================
call node session-manager.js "%TARGET_URL%"
pause
goto MENU
