#!/bin/bash
# MiroProbe AI — Cloud Linux Interactive Control Console (Codespaces / Ubuntu)

TARGET_URL="https://cinewave-hub.pages.dev"
TOTAL_VISITS="20"
WORKERS_COUNT="3"
SELECTED_WORKER="0"
TARGET_VPM="1000"
TEST_DURATION="30s"
TARGET_GEO="ALL"
TRAFFIC_SOURCE="ALL_SOCIAL"
DEVICE_MIX="BALANCED"

update_config_vars() {
  if [ "$SELECTED_WORKER" = "1" ]; then
    WORKER_NAME="Worker 1: [EG] Trend & Anime Explorer (الأكثر رواجاً والأنمي)"
    PW_FILTER="Persona.1"
    SIM_PERSONA="1"
    REPEAT_WAVES=$TOTAL_VISITS
    CALC_WAVES=$(( (TOTAL_VISITS + WORKERS_COUNT - 1) / WORKERS_COUNT ))
  elif [ "$SELECTED_WORKER" = "2" ]; then
    WORKER_NAME="Worker 2: [SA] Cinema & Server Streamer (مشاهدة وسيرفرات البث)"
    PW_FILTER="Persona.2"
    SIM_PERSONA="2"
    REPEAT_WAVES=$TOTAL_VISITS
    CALC_WAVES=$(( (TOTAL_VISITS + WORKERS_COUNT - 1) / WORKERS_COUNT ))
  elif [ "$SELECTED_WORKER" = "3" ]; then
    WORKER_NAME="Worker 3: [US] Search & IMDb Filter (البحث المباشر والتقييم)"
    PW_FILTER="Persona.3"
    SIM_PERSONA="3"
    REPEAT_WAVES=$TOTAL_VISITS
    CALC_WAVES=$(( (TOTAL_VISITS + WORKERS_COUNT - 1) / WORKERS_COUNT ))
  elif [ "$SELECTED_WORKER" = "4" ]; then
    WORKER_NAME="Worker 4: [GB] Mobile Binge Streamer (تصفح الموبايل والأجهزة الذكية)"
    PW_FILTER="Persona.4"
    SIM_PERSONA="4"
    REPEAT_WAVES=$TOTAL_VISITS
    CALC_WAVES=$(( (TOTAL_VISITS + WORKERS_COUNT - 1) / WORKERS_COUNT ))
  else
    SELECTED_WORKER="0"
    WORKER_NAME="All Personas (خليط ذكي متوازن من كافة الشخصيات 1 و 2 و 3 و 4)"
    PW_FILTER="Persona"
    SIM_PERSONA="ALL"
    REPEAT_WAVES=$(( TOTAL_VISITS / 4 ))
    if [ "$REPEAT_WAVES" -lt 1 ]; then REPEAT_WAVES=1; fi
    CALC_TOTAL=$(( REPEAT_WAVES * 4 ))
    CALC_WAVES=$(( (CALC_TOTAL + WORKERS_COUNT - 1) / WORKERS_COUNT ))
  fi
}

setup_residential_gateway() {
  if [ -n "$PROXY_SERVER" ]; then
    GATEWAY_STATUS="🌐 نشط ($PROXY_SERVER)"
  else
    GATEWAY_STATUS="⚡ مباشر (Direct Azure Cloud IP)"
  fi
}

setup_residential_gateway
update_config_vars

while true; do
  update_config_vars
  echo ""
  echo "============================================================================"
  echo "  MiroProbe AI Cloud Studio (Microsoft Azure Linux Cloud Runner)"
  echo "============================================================================"
  echo "  Active Target URL : $TARGET_URL"
  echo "  Target Volume     : $TOTAL_VISITS Visits | VPM: $TARGET_VPM | Duration: $TEST_DURATION"
  echo "  Active Worker     : $WORKER_NAME"
  echo "  Safe Concurrency  : $WORKERS_COUNT Parallel Workers | Batch Waves: $CALC_WAVES"
  echo "  Target Country    : $TARGET_GEO | Source: $TRAFFIC_SOURCE"
  echo "  Device Profiles   : $DEVICE_MIX"
  echo "  Egress Gateway    : $GATEWAY_STATUS"
  echo "----------------------------------------------------------------------------"
  echo "Select Operation Mode:"
  echo "  [1] Show Cloud Dashboard URL"
  echo "  [2] Run Single Headless Visitor ($WORKER_NAME)"
  echo "  [3] Run Multi-Visitor Concurrent Wave ($TOTAL_VISITS Visits / $WORKERS_COUNT Parallel)"
  echo "  [4] Change Target Website (CineWave / Meyar Gold / Custom)"
  echo "  [5] Configure Volume, Worker Type, Geo Country & Traffic Sources"
  echo "  [6] Run High-Scale Behavioral Load Simulation ($TARGET_VPM Visitors/Min)"
  echo "  [7] Run Real Visitors Swarm ($TOTAL_VISITS Visits / $WORKERS_COUNT Parallel)"
  echo "  [8] Run Anti-Bot & Biometrics Verification Suite"
  echo "  [9] Exit"
  echo ""
  read -p "Enter option number (1-9): " choice

  case "$choice" in
    1)
      echo ""
      echo "Cloud Dashboard running locally on http://0.0.0.0:3000"
      echo "Open the 'Ports' / 'المنافذ' tab in Codespaces to open public HTTPS link."
      read -p "Press Enter to return..."
      ;;
    2)
      echo ""
      echo "Running Single Visitor Persona ($WORKER_NAME) in Cloud Headless mode..."
      TARGET_URL="$TARGET_URL" PROXY_SERVER="$PROXY_SERVER" HEADLESS=true npx playwright test playwright-personas.spec.ts --workers=1 -g "$PW_FILTER"
      read -p "Press Enter to continue..."
      ;;
    3)
      echo ""
      echo "Launching $WORKERS_COUNT Parallel Cloud Browsers over $CALC_WAVES Waves..."
      echo "Target: $TARGET_URL | Visits: $TOTAL_VISITS | Gateway: $GATEWAY_STATUS"
      TARGET_URL="$TARGET_URL" PROXY_SERVER="$PROXY_SERVER" HEADLESS=true npx playwright test playwright-personas.spec.ts --workers="$WORKERS_COUNT" --repeat-each="$REPEAT_WAVES" -g "$PW_FILTER"
      read -p "Press Enter to continue..."
      ;;
    4)
      echo ""
      echo "Select Target Website to test:"
      echo "  [1] 🎬 سينما ويف (https://cinewave-hub.pages.dev)"
      echo "  [2] 💰 معيار الذهب في مصر (https://meyar-gold-egypt.pages.dev)"
      echo "  [3] كتابة رابط مخصص آخر"
      read -p "Enter choice (1-3, default 1): " site_choice
      if [ "$site_choice" = "2" ]; then
        TARGET_URL="https://meyar-gold-egypt.pages.dev"
      elif [ "$site_choice" = "3" ]; then
        read -p "Enter custom URL: " custom_target
        if [ -n "$custom_target" ]; then TARGET_URL="$custom_target"; fi
      else
        TARGET_URL="https://cinewave-hub.pages.dev"
      fi
      echo "✅ Active Target URL set to: $TARGET_URL"
      read -p "Press Enter to continue..."
      ;;
    5)
      echo ""
      echo "============================================================================"
      echo "  Configure Volume, Worker Type & Traffic Settings"
      echo "============================================================================"
      read -p "  Enter Target Website URL (Current: $TARGET_URL): " in_url
      if [ -n "$in_url" ]; then
        TARGET_URL="$in_url"
      fi

      read -p "  Enter Total Desired Visits (Current: $TOTAL_VISITS): " in_total
      if [ -n "$in_total" ]; then
        TOTAL_VISITS="$in_total"
        TARGET_VPM="$in_total"
      fi
      echo ""
      echo "  Select Worker Persona:"
      echo "    [0] All Personas (خليط متوازن)"
      echo "    [1] Worker 1: 🇪🇬 الأكثر رواجاً والأنمي"
      echo "    [2] Worker 2: 🇸🇦 مشاهد الأفلام ومشغل السيرفرات"
      echo "    [3] Worker 3: 🇺🇸 البحث وفرز الجودة بـ IMDb"
      echo "    [4] Worker 4: 🇬🇧 متصفح الموبايل وعاشق الأنمي"
      read -p "  Enter worker type (0-4, Current: $SELECTED_WORKER): " in_w
      if [ -n "$in_w" ]; then SELECTED_WORKER="$in_w"; fi

      echo ""
      read -p "  Enter Safe Concurrency / Parallel Workers (1-8, Current: $WORKERS_COUNT): " in_c
      if [ -n "$in_c" ]; then WORKERS_COUNT="$in_c"; fi

      echo ""
      echo "  Select Traffic Egress Gateway (بوابة خروج الترافيك):"
      echo "    [1] ⚡ مباشر (Direct Azure Cloud IP - Fastest & Recommended)"
      echo "    [2] 🧅 Tor Consumer Network (socks5://127.0.0.1:9050)"
      echo "    [3] 💻 البروكسي المنزلي للابتوب (Laptop Residential Edge Proxy)"
      echo "    [4] تعطيل البروكسي والعودة للمباشر"
      read -p "  Enter gateway choice (1-4, leave blank to keep current): " in_gw
      if [ "$in_gw" = "2" ]; then
        if ! command -v tor &> /dev/null; then
          echo "[*] Installing Tor Gateway..."
          apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq tor >/dev/null 2>&1
        fi
        service tor start >/dev/null 2>&1
        export PROXY_SERVER="socks5://127.0.0.1:9050"
        GATEWAY_STATUS="🧅 نشط (Tor Socks5: 127.0.0.1:9050)"
      elif [ "$in_gw" = "3" ]; then
        read -p "  Enter your Laptop Proxy URL (e.g. http://xyz.loca.lt or http://ip:8888): " in_px
        if [ -n "$in_px" ]; then
          export PROXY_SERVER="$in_px"
          GATEWAY_STATUS="💻 بروكسي اللابتوب المنزلي ($PROXY_SERVER)"
        fi
      elif [ "$in_gw" = "4" ] || [ "$in_gw" = "1" ]; then
        unset PROXY_SERVER
        GATEWAY_STATUS="⚡ مباشر (Direct Azure Cloud IP)"
      fi

      update_config_vars
      echo ""
      echo "  [OK] Target: $TARGET_URL | Visits: $TOTAL_VISITS | Workers: $WORKERS_COUNT"
      read -p "Press Enter to return..."
      ;;
    6)
      echo ""
      echo "Running MiroProbe High-Scale Behavioral Simulation..."
      echo "Target: $TARGET_URL | Rate: $TARGET_VPM VPM | Worker: $SIM_PERSONA"
      node load-engine.js "$TARGET_URL" "$TARGET_VPM" "$TEST_DURATION" "$TARGET_GEO" "$TRAFFIC_SOURCE" "$DEVICE_MIX" "$SIM_PERSONA"
      read -p "Press Enter to continue..."
      ;;
    7)
      echo ""
      echo "Running Real International Visitors Swarm..."
      echo "Target: $TARGET_URL | Visits: $TOTAL_VISITS | Concurrency: $WORKERS_COUNT | Gateway: $GATEWAY_STATUS"
      PROXY_SERVER="$PROXY_SERVER" node run-london-100.js "$TARGET_URL" "$TOTAL_VISITS" "$WORKERS_COUNT"
      read -p "Press Enter to continue..."
      ;;
    8)
      echo ""
      echo "Running Anti-Bot & Biometrics Verification..."
      HEADLESS=true npx playwright test verify-stealth.spec.ts
      read -p "Press Enter to continue..."
      ;;
    9)
      echo "Exiting MiroProbe Console. Dashboard remains active in background."
      exit 0
      ;;
    *)
      echo "Invalid option. Please choose 1-9."
      ;;
  esac
done
