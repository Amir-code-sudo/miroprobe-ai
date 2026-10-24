#!/bin/bash
# MiroProbe AI — Cloud Linux Interactive Control Console (Codespaces / Ubuntu)

TARGET_URL="http://localhost:3000"
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
  echo "----------------------------------------------------------------------------"
  echo "Select Operation Mode:"
  echo "  [1] Show Cloud Dashboard URL"
  echo "  [2] Run Single Headless Visitor ($WORKER_NAME)"
  echo "  [3] Run Multi-Visitor Concurrent Wave ($TOTAL_VISITS Visits / $WORKERS_COUNT Parallel)"
  echo "  [4] Enter New Target URL & Run AI Autonomous Discovery"
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
      HEADLESS=true npx playwright test playwright-personas.spec.ts --workers=1 -g "$PW_FILTER"
      read -p "Press Enter to continue..."
      ;;
    3)
      echo ""
      echo "Launching $WORKERS_COUNT Parallel Cloud Browsers over $CALC_WAVES Waves..."
      echo "Total Visits to execute: $TOTAL_VISITS for $WORKER_NAME"
      HEADLESS=true npx playwright test playwright-personas.spec.ts --workers="$WORKERS_COUNT" --repeat-each="$REPEAT_WAVES" -g "$PW_FILTER"
      read -p "Press Enter to continue..."
      ;;
    4)
      echo ""
      read -p "Enter Target Website URL: " new_target
      if [ -n "$new_target" ]; then
        TARGET_URL="$new_target"
        echo "Running Autonomous AI Crawler against: $TARGET_URL ..."
        HEADLESS=true node ai-crawler.js "$TARGET_URL"
      fi
      read -p "Press Enter to continue..."
      ;;
    5)
      echo ""
      echo "============================================================================"
      echo "  Configure Volume, Worker Type & Traffic Settings"
      echo "============================================================================"
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

      update_config_vars
      echo ""
      echo "  [OK] Updated Configuration: $TOTAL_VISITS visits divided into $CALC_WAVES safe waves for $WORKER_NAME"
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
      node run-london-100.js "$TARGET_URL" "$TOTAL_VISITS" "$WORKERS_COUNT"
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
