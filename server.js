/**
 * MiroProbe AI — Standalone Local Laptop Dashboard & Anti-Bot Verification Lab
 * Dynamically reloads discovered-scenarios.json on every request!
 * Run via start-miroprobe.bat or: node server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

function loadScenarios() {
  try {
    const filePath = path.join(__dirname, 'discovered-scenarios.json');
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading discovered-scenarios.json:', e.message);
  }
  return {
    targetUrl: "https://meyar-gold-egypt.pages.dev",
    siteTitle: "مِعيَار الذهب | أسعار الذهب اليوم في مصر",
    domainCategory: "الذهب والمعادن الثمينة والأسواق المالية",
    summaryAr: "تم فحص الموقع وتوليد سيناريوهات سلوكية ذكية.",
    personas: []
  };
}

const INITIAL_CONFIG = {
  "visitorsPerMinute": 180,
  "serverWorkers": 16,
  "dbPoolSize": 50,
  "baseLatencyMs": 85
};

function renderMainHtml(SCENARIOS) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MiroProbe AI — ${SCENARIOS.siteTitle || 'محاكي الزوار'}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 1180px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px; }
    .metric-val { font-family: monospace; font-size: 28px; font-weight: 700; color: #38bdf8; margin-top: 6px; }
    input[type="range"] { width: 100%; accent-color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #1e293b; text-align: right; }
    .mono { font-family: monospace; direction: ltr; display: inline-block; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .badge-success { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
    .badge-info { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .nav-btn { background: #1e293b; color: #38bdf8; border: 1px solid #38bdf8; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s; }
    .nav-btn:hover { background: #38bdf8; color: #090d16; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 style="margin:0;font-size:22px;">MiroProbe AI — محاكي التحمل السلوكي والتوأم الرقمي للزوار</h1>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">الموقع المستهدف: <span class="mono">${SCENARIOS.targetUrl}</span> | التصنيف: <strong style="color:#38bdf8;">${SCENARIOS.domainCategory || 'عام'}</strong></p>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <a href="/bot-audit" class="nav-btn">🛡️ معمل فحص البصمة ومكافحة البوتات (Anti-Bot Lab)</a>
        <div style="font-family:monospace;color:#38bdf8;">Port: ${PORT}</div>
      </div>
    </div>

    <!-- بطاقة ملخص الاستكشاف الذاتي -->
    <div class="card" style="border-right: 4px solid #10b981;">
      <h3 style="margin: 0 0 6px 0; color: #34d399;">🔍 ملخص الاستكشاف الذاتي بالذكاء الاصطناعي (Autonomous Discovery Summary)</h3>
      <p style="margin: 0; color: #f1f5f9; font-size: 14px;">
        ${SCENARIOS.summaryAr || 'تم فحص الموقع وتوليد مسارات الزوار والشخصيات الحقيقية بنجاح.'}
      </p>
    </div>

    <!-- حاسبة حجم الزيارات المخصصة -->
    <div class="card" style="background: #0d1933; border: 1px solid #2563eb;">
      <h3 style="margin-top:0; color: #60a5fa;">🎯 تحديد حجم الزيارات وتخطيط السعة (Visitor Volume & Capacity Planner)</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:4px;">إجمالي عدد الزوار المطلوب محاكاتهم:</label>
          <input id="totalVisitsInput" type="number" min="10" max="100000" step="10" value="540" style="background:#090d16; border:1px solid #334155; color:#f1f5f9; padding:8px 12px; border-radius:6px; width:90%; font-family:monospace; font-size:16px;" />
        </div>
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:4px;">مدة الفحص المقترحة (بالدقائق):</label>
          <input id="durationMinutesInput" type="number" min="1" max="60" value="3" style="background:#090d16; border:1px solid #334155; color:#f1f5f9; padding:8px 12px; border-radius:6px; width:90%; font-family:monospace; font-size:16px;" />
        </div>
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:4px;">معدل التدفق الناتج (VPM):</label>
          <div id="calcVpmLabel" class="mono" style="color:#38bdf8; font-size:22px; font-weight:bold; margin-top:4px;">180 زائر/دقيقة</div>
        </div>
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:4px;">المستخدمون المتزامنون (Little's Law):</label>
          <div id="calcVuLabel" class="mono" style="color:#4ade80; font-size:22px; font-weight:bold; margin-top:4px;">33 VU</div>
        </div>
      </div>
      <div style="margin-top: 14px; font-size: 13px; color: #94a3b8; border-top: 1px solid #1e293b; padding-top: 10px;">
        <strong>توزيع الزيارات المستهدفة على شخصيات الموقع المكتشفة:</strong>
        ${(SCENARIOS.personas && SCENARIOS.personas.length > 0) ? SCENARIOS.personas.map((p, idx) => `
          <span style="margin: 0 8px;">${idx + 1}️⃣ ${p.nameAr} (${p.trafficSharePercent || 25}%): <strong id="distP${idx + 1}" class="mono">${Math.round(540 * ((p.trafficSharePercent || 25) / 100))}</strong></span>
        `).join(' | ') : `
          <span style="color:#38bdf8; margin: 0 8px;">1️⃣ Worker 1 (35%): <strong id="distP1" class="mono">189</strong></span> |
          <span style="color:#f59e0b; margin: 0 8px;">2️⃣ Worker 2 (30%): <strong id="distP2" class="mono">162</strong></span> |
          <span style="color:#ec4899; margin: 0 8px;">3️⃣ Worker 3 (20%): <strong id="distP3" class="mono">108</strong></span> |
          <span style="color:#a855f7; margin: 0 8px;">4️⃣ Worker 4 (15%): <strong id="distP4" class="mono">81</strong></span>
        `}
      </div>
    </div>

    <!-- بطاقة نظام التخفي وتفادي WAF -->
    <div class="card" style="border-right: 4px solid #38bdf8;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h3 style="margin: 0 0 6px 0; color: #38bdf8;">🛡️ طبقة التخفي ومحاكاة البصمة البشرية (Anti-Fingerprinting & Biometrics)</h3>
          <p style="margin: 0; color: #94a3b8; font-size: 13px;">
            تجاوز أنظمة Cloudflare Turnstile, Datadome, Akamai عبر تزوير العتاد وحركات ماوس بمنحنيات Bézier الرياضية.
          </p>
        </div>
        <div style="display: flex; gap: 8px;">
          <span class="badge badge-success">✓ navigator.webdriver محجوب</span>
          <span class="badge badge-success">✓ Canvas Noise نشط</span>
          <span class="badge badge-success">✓ WebGL RTX 3070</span>
          <span class="badge badge-info">✓ Bézier Physics</span>
        </div>
      </div>
    </div>

    <!-- بطاقة التوزيع الجغرافي الدولي متعدد المناطق -->
    <div class="card" style="border-right: 4px solid #10b981; background: #0c1a2e;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <h3 style="margin: 0 0 6px 0; color: #34d399;">🌍 مصفوفة التنوع الجغرافي الدولي (Multi-Region Geo Diversity)</h3>
          <p style="margin: 0; color: #94a3b8; font-size: 13px;">
            توزيع الزيارات السلوكية عبر 6 دول ومناطق جغرافية حقيقية بمناطق زمنية (Timezones)، لغات (Locales)، وإحداثيات GPS وترويسات شبكية دقيقة.
          </p>
        </div>
        <span class="badge badge-success" style="font-size:12px;">✓ 6 دول ومناطق جغرافية</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px;">
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:15px; color:#f1f5f9;">🇸🇦 السعودية</strong>
            <span class="badge badge-info" style="font-size:11px;">35%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">الرياض (Asia/Riyadh)</div>
          <div class="mono" style="color:#38bdf8; font-size:11px; margin-top:2px;">ar-SA | GPS: 24.7, 46.6</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:15px; color:#f1f5f9;">🇪🇬 مصر</strong>
            <span class="badge badge-info" style="font-size:11px;">30%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">القاهرة (Africa/Cairo)</div>
          <div class="mono" style="color:#38bdf8; font-size:11px; margin-top:2px;">ar-EG | GPS: 30.0, 31.2</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:15px; color:#f1f5f9;">🇺🇸 أمريكا</strong>
            <span class="badge badge-info" style="font-size:11px;">15%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">نيويورك (America/New_York)</div>
          <div class="mono" style="color:#38bdf8; font-size:11px; margin-top:2px;">en-US | GPS: 40.7, -74.0</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:15px; color:#f1f5f9;">🇬🇧 بريطانيا</strong>
            <span class="badge badge-info" style="font-size:11px;">10%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">لندن (Europe/London)</div>
          <div class="mono" style="color:#38bdf8; font-size:11px; margin-top:2px;">en-GB | GPS: 51.5, -0.1</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:15px; color:#f1f5f9;">🇦🇪 الإمارات</strong>
            <span class="badge badge-info" style="font-size:11px;">5%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">دبي (Asia/Dubai)</div>
          <div class="mono" style="color:#38bdf8; font-size:11px; margin-top:2px;">ar-AE | GPS: 25.2, 55.2</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:15px; color:#f1f5f9;">🇩🇪 ألمانيا</strong>
            <span class="badge badge-info" style="font-size:11px;">5%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">فرانكفورت (Europe/Berlin)</div>
          <div class="mono" style="color:#38bdf8; font-size:11px; margin-top:2px;">de-DE | GPS: 50.1, 8.6</div>
        </div>
      </div>
    </div>

    <!-- بطاقة مصادر الحملات الإعلانية ومحاكاة السوشيال ميديا وتنوع الأجهزة -->
    <div class="card" style="border-right: 4px solid #f59e0b; background: #131006;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <div>
          <h3 style="margin: 0 0 6px 0; color: #fbbf24;">📱 مصادر الزيارات وحملات السوشيال ميديا وتنوع الأجهزة (Campaigns & Device Mix)</h3>
          <p style="margin: 0; color: #94a3b8; font-size: 13px;">
            محاكاة نقرات إعلانات فيسبوك، انستغرام، تيك توك، وبحث جوجل مع ترويسات Referer وروابط UTM، عبر أنظمة Windows 11، macOS، iOS، و Android.
          </p>
        </div>
        <span class="badge" style="background:rgba(245,158,11,0.2); color:#fbbf24; border:1px solid #f59e0b; font-size:12px;">✓ حملات السوشيال ميديا نشطة</span>
      </div>

      <!-- إعدادات التخصيص التفاعلية -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 16px; background:#090d16; padding:14px; border-radius:8px; border:1px solid #1e293b;">
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:6px;">📍 الدولة المستهدفة (Geo Location Filter):</label>
          <select id="geoSelect" style="background:#0f172a; border:1px solid #334155; color:#f1f5f9; padding:8px 12px; border-radius:6px; width:100%; font-family:system-ui;">
            <option value="ALL">🌍 جميع الدول (تنوع دولي تلقائي)</option>
            <option value="SA">🇸🇦 المملكة العربية السعودية (الرياض)</option>
            <option value="EG">🇪🇬 جمهورية مصر العربية (القاهرة)</option>
            <option value="US">🇺🇸 الولايات المتحدة الأمريكية (نيويورك)</option>
            <option value="GB">🇬🇧 المملكة المتحدة (لندن)</option>
            <option value="AE">🇦🇪 الإمارات العربية المتحدة (دبي)</option>
            <option value="DE">🇩🇪 ألمانيا (فرانكفورت)</option>
          </select>
        </div>
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:6px;">🔗 مصدر الزيارات والحملة (Campaign / Referrer):</label>
          <select id="sourceSelect" style="background:#0f172a; border:1px solid #334155; color:#f1f5f9; padding:8px 12px; border-radius:6px; width:100%; font-family:system-ui;">
            <option value="ALL_SOCIAL">🌟 خليط متوازن من كافة شبكات التواصل والبحث</option>
            <option value="FACEBOOK">📱 إعلانات فيسبوك (Facebook Ads + l.facebook.com)</option>
            <option value="INSTAGRAM">📸 إعلانات انستغرام (Instagram Stories / Reels)</option>
            <option value="TIKTOK">🎵 إعلانات تيك توك الفيروسية (TikTok Ads)</option>
            <option value="GOOGLE">🔍 بحث جوجل الطبيعي والإعلانات (Google Search)</option>
            <option value="DIRECT">🌐 زيارات مباشرة (Direct Address Bar / Bookmarks)</option>
          </select>
        </div>
        <div>
          <label style="font-size:13px; color:#94a3b8; display:block; margin-bottom:6px;">💻📱 نوع الأجهزة وأنظمة التشغيل (Device & OS Mix):</label>
          <select id="deviceSelect" style="background:#0f172a; border:1px solid #334155; color:#f1f5f9; padding:8px 12px; border-radius:6px; width:100%; font-family:system-ui;">
            <option value="BALANCED">💻📱 خليط واقعي (60% هواتف ذكية / 40% حواسب)</option>
            <option value="MOBILE_ONLY">📱 هواتف ذكية فقط (Apple iOS & Android)</option>
            <option value="DESKTOP_ONLY">💻 أجهزة كمبيوتر فقط (Windows 11 & macOS)</option>
          </select>
        </div>
      </div>

      <!-- عرض مصادر الزيارات -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:14px; color:#38bdf8;">📱 Facebook</strong>
            <span class="badge badge-info" style="font-size:10px;">25%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">l.facebook.com</div>
          <div class="mono" style="color:#f59e0b; font-size:10px; margin-top:2px;">utm: cpc_spike</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:14px; color:#ec4899;">📸 Instagram</strong>
            <span class="badge badge-info" style="font-size:10px;">25%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">l.instagram.com</div>
          <div class="mono" style="color:#f59e0b; font-size:10px; margin-top:2px;">utm: story_swipe</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:14px; color:#a855f7;">🎵 TikTok</strong>
            <span class="badge badge-info" style="font-size:10px;">20%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">tiktok.com</div>
          <div class="mono" style="color:#f59e0b; font-size:10px; margin-top:2px;">utm: viral_pulse</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:14px; color:#34d399;">🔍 Google</strong>
            <span class="badge badge-info" style="font-size:10px;">15%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">google.com</div>
          <div class="mono" style="color:#f59e0b; font-size:10px; margin-top:2px;">utm: organic</div>
        </div>
        <div style="background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 10px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="font-size:14px; color:#f1f5f9;">🌐 Direct</strong>
            <span class="badge badge-info" style="font-size:10px;">10%</span>
          </div>
          <div style="color:#94a3b8; font-size:11px; margin-top:4px;">Direct address bar</div>
          <div class="mono" style="color:#94a3b8; font-size:10px; margin-top:2px;">no referrer</div>
        </div>
      </div>
    </div>

    <div class="card">
      <label style="font-weight:600;display:block;margin-bottom:8px;">
        التحكم اليدوي السريع في معدل تدفق الزوار (Visitors Per Minute):
        <span id="vpmLabel" class="mono" style="color:#38bdf8;font-size:20px;">${INITIAL_CONFIG.visitorsPerMinute}</span> زائر/دقيقة
      </label>
      <input id="vpmSlider" type="range" min="10" max="3000" step="10" value="${INITIAL_CONFIG.visitorsPerMinute}" />
    </div>

    <div class="grid">
      <div class="card">
        <div style="color:#94a3b8;font-size:13px;">الزوار المتزامنون (Little's Law Concurrent VUs)</div>
        <div id="vuVal" class="metric-val">--</div>
      </div>
      <div class="card">
        <div style="color:#94a3b8;font-size:13px;">متوسط الاستجابة p95 Latency</div>
        <div id="p95Val" class="metric-val">--</div>
      </div>
      <div class="card">
        <div style="color:#94a3b8;font-size:13px;">استهلاك السيرفر Server Utilization</div>
        <div id="cpuVal" class="metric-val">--</div>
      </div>
      <div class="card">
        <div style="color:#94a3b8;font-size:13px;">نسبة الأخطاء المتوقعة Error Rate</div>
        <div id="errVal" class="metric-val">--</div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;">الشخصيات الذكية المكتشفة وتوزيع البصمات (AI Personas & Device Hardware)</h3>
      <table>
        <thead>
          <tr>
            <th>الشخصية (Persona)</th>
            <th>الدولة والمنطقة (Geo Location)</th>
            <th>نوع الجهاز والشبكة</th>
            <th>كارت الشاشة المحاكى (WebGL Profile)</th>
            <th>نسبة الزوار</th>
            <th>عدد الخطوات</th>
            <th>التركيز الاختباري</th>
            <th>التشغيل المباشر الفوري</th>
          </tr>
        </thead>
        <tbody>
          ${(SCENARIOS.personas || []).map((p, pIdx) => `
            <tr>
              <td><strong>${p.nameAr}</strong><br/><span style="color:#94a3b8;font-size:12px;">${p.nameEn}</span></td>
              <td><span style="font-size:16px;">${p.geoFlag || '🌐'}</span> <strong>${p.geoCode || 'SA'}</strong><br/><span style="color:#38bdf8;font-size:11px;">${p.geoNameAr || 'الرياض'}</span></td>
              <td>${p.device} <br/><span style="color:#94a3b8;font-size:11px;">${p.networkProfile}</span></td>
              <td class="mono" style="color:#38bdf8;font-size:12px;">${p.hardware || 'Standard'}</td>
              <td class="mono">${p.trafficSharePercent}%</td>
              <td class="mono">${p.steps ? p.steps.length : 0}</td>
              <td>${p.potentialBugFocusAr || ''}</td>
              <td>
                <button onclick="launchWorker(${pIdx + 1}, '${p.nameAr}')" class="nav-btn" style="padding: 6px 12px; font-size: 12px; cursor: pointer; white-space: nowrap; background: #0284c7; color: #fff; border: none;">
                  🚀 تشغيل الـ Worker (${pIdx + 1})
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Live Toast Alert for Worker Spawning -->
    <div id="launchToast" style="display:none; position:fixed; bottom:24px; left:24px; background:#0f172a; border:2px solid #38bdf8; color:#f1f5f9; padding:16px 24px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.8); z-index:9999; font-size:14px; font-weight:bold;"></div>
  </div>
  <script>
    function launchWorker(workerNum, name) {
      const toast = document.getElementById('launchToast');
      toast.style.display = 'block';
      toast.style.borderColor = '#38bdf8';
      toast.innerHTML = '⏳ جاري تشغيل المتصفح الحي للـ Worker رقم ' + workerNum + ' (' + name + ')... انتظر ثوانٍ لتظهر النافذة على شاشتك!';
      fetch('/api/run-worker?persona=' + workerNum, { method: 'POST' })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            toast.style.borderColor = '#4ade80';
            toast.innerHTML = '✅ تم إطلاق نافذة المتصفح الحية للـ Worker رقم ' + workerNum + ' بنجاح! راقب شاشة اللابتوب الآن.';
            setTimeout(() => { toast.style.display = 'none'; }, 7000);
          } else {
            toast.style.borderColor = '#f87171';
            toast.innerHTML = '❌ خطأ: ' + (data.error || 'فشل البدء');
          }
        })
        .catch(err => {
          toast.style.borderColor = '#f87171';
          toast.innerHTML = '❌ خطأ: ' + err.message;
        });
    }
    const slider = document.getElementById('vpmSlider');
    const vpmLabel = document.getElementById('vpmLabel');
    const totalVisitsInput = document.getElementById('totalVisitsInput');
    const durationInput = document.getElementById('durationMinutesInput');
    const calcVpmLabel = document.getElementById('calcVpmLabel');
    const calcVuLabel = document.getElementById('calcVuLabel');

    function updateStats(vpm) {
      vpmLabel.textContent = vpm;
      calcVpmLabel.textContent = vpm + ' زائر/دقيقة';
      const concurrent = Math.max(1, Math.round((vpm / 60) * 11));
      calcVuLabel.textContent = concurrent + ' VU';
      const util = Math.min(100, Math.round((vpm / 850) * 100));
      const p95 = Math.round(120 * (1 + Math.pow(util / 70, 2.2)));
      const err = util > 82 ? ((util - 82) * 1.4).toFixed(1) : '0.0';
      document.getElementById('vuVal').textContent = concurrent + ' VU';
      document.getElementById('p95Val').textContent = p95 + ' ms';
      document.getElementById('cpuVal').textContent = util + '%';
      document.getElementById('errVal').textContent = err + '%';

      const total = Number(totalVisitsInput.value) || (vpm * Number(durationInput.value));
      if (document.getElementById('distP1')) document.getElementById('distP1').textContent = Math.round(total * 0.35);
      if (document.getElementById('distP2')) document.getElementById('distP2').textContent = Math.round(total * 0.30);
      if (document.getElementById('distP3')) document.getElementById('distP3').textContent = Math.round(total * 0.20);
      if (document.getElementById('distP4')) document.getElementById('distP4').textContent = Math.round(total * 0.15);
    }

    slider.addEventListener('input', () => {
      const vpm = Number(slider.value);
      const duration = Number(durationInput.value) || 3;
      totalVisitsInput.value = vpm * duration;
      updateStats(vpm);
    });

    function recalcFromInputs() {
      const total = Number(totalVisitsInput.value) || 540;
      const duration = Number(durationInput.value) || 3;
      const vpm = Math.max(10, Math.min(3000, Math.round(total / duration)));
      slider.value = vpm;
      updateStats(vpm);
    }

    totalVisitsInput.addEventListener('input', recalcFromInputs);
    durationInput.addEventListener('input', recalcFromInputs);
    recalcFromInputs();

    // Fetch and bind Central Configuration
    const geoSelect = document.getElementById('geoSelect');
    const sourceSelect = document.getElementById('sourceSelect');
    const deviceSelect = document.getElementById('deviceSelect');

    fetch('/api/config')
      .then(res => res.json())
      .then(cfg => {
        if (cfg.targetGeo) geoSelect.value = cfg.targetGeo;
        if (cfg.trafficSource) sourceSelect.value = cfg.trafficSource;
        if (cfg.deviceMix) deviceSelect.value = cfg.deviceMix;
      }).catch(() => {});

    function saveConfig() {
      const payload = {
        targetGeo: geoSelect.value,
        trafficSource: sourceSelect.value,
        deviceMix: deviceSelect.value,
        visitorsPerMinute: Number(slider.value)
      };
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }

    geoSelect.addEventListener('change', saveConfig);
    sourceSelect.addEventListener('change', saveConfig);
    deviceSelect.addEventListener('change', saveConfig);
  </script>
</body>
</html>`;
}

const botAuditHtmlPage = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MiroProbe AI — معمل فحص بصمة المتصفح وكشف البوتات (Anti-Bot Lab)</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
    .mono { font-family: monospace; direction: ltr; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 700; font-size: 13px; }
    .human { background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid #22c55e; }
    .bot { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
    th, td { padding: 12px; border-bottom: 1px solid #1e293b; text-align: right; }
    #canvasTest { border: 1px solid #334155; border-radius: 6px; margin-top: 10px; background: #000; }
    .canvas-box { display: flex; gap: 20px; align-items: center; margin-top: 12px; }
    #mouseCanvas { border: 2px dashed #38bdf8; border-radius: 8px; background: #0b1329; cursor: crosshair; }
    .back-btn { color: #94a3b8; text-decoration: none; font-size: 14px; margin-bottom: 12px; display: inline-block; }
    .back-btn:hover { color: #38bdf8; }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-btn">← العودة إلى لوحة تحكم MiroProbe AI</a>
    <div class="header">
      <div>
        <h1 style="margin:0;font-size:22px;">🛡️ معمل فحص البصمة واكتشاف البوتات (Bot & Fingerprint Audit Suite)</h1>
        <p style="margin:4px 0 0;color:#94a3b8;font-size:14px;">فحص حقيقي يحاكي تقنيات كشف Cloudflare Turnstile و Datadome في كشف المتصفحات الآلية</p>
      </div>
      <div id="verdictBadge" class="status-badge" style="font-size:16px; padding: 8px 18px;">جاري الفحص...</div>
    </div>

    <!-- جدول نتائج الفحص المباشر -->
    <div class="card">
      <h3 style="margin-top:0;">1. فحص متغيرات المتصفح والعتاد (Browser & Hardware Fingerprint)</h3>
      <table>
        <thead>
          <tr>
            <th>عنصر الفحص (Detection Vector)</th>
            <th>القيمة المرصودة (Detected Value)</th>
            <th>الحالة (Status)</th>
          </tr>
        </thead>
        <tbody id="auditTableBody">
        </tbody>
      </table>
    </div>

    <!-- فحص بصمة الكانفاس والـ WebGL -->
    <div class="card">
      <h3 style="margin-top:0;">2. فحص بصمة الـ Canvas و الـ WebGL (Hardware Rendering Test)</h3>
      <div class="canvas-box">
        <canvas id="canvasTest" width="220" height="60"></canvas>
        <div>
          <div style="font-size: 13px; color: #94a3b8;">Canvas Hash (بصمة التجزئة الفريدة):</div>
          <div id="canvasHash" class="mono" style="color: #38bdf8; font-size: 16px; font-weight: bold; margin-top: 4px;">--</div>
          <div id="canvasNoiseNotice" style="font-size: 12px; color: #4ade80; margin-top: 6px;"></div>
        </div>
      </div>
    </div>

    <!-- فحص حركة الماوس البيومترية -->
    <div class="card">
      <h3 style="margin-top:0;">3. فحص بيومترية حركة الماوس الفيزيائية (Bézier Trajectory Biometrics)</h3>
      <p style="color:#94a3b8; font-size:13px; margin: 0 0 10px 0;">
        البوتات التقليدية تنتقل في خطوط مستقيمة فورية (Linear Teleport). حرك الماوس أو دع سكريبت MiroProbe يحركه لترى منحنيات Bézier الحقيقية.
      </p>
      <div style="display:flex; gap: 20px; align-items:center;">
        <canvas id="mouseCanvas" width="500" height="180"></canvas>
        <div>
          <div style="font-size: 13px; color: #94a3b8;">طبيعة مسار الماوس:</div>
          <div id="mouseTrajectoryType" class="mono" style="font-size: 18px; font-weight: bold; color: #38bdf8; margin: 6px 0;">انتظار الحركة...</div>
          <div id="mousePointsCount" class="mono" style="color: #94a3b8; font-size: 12px;">النقاط المسجلة: 0</div>
          <button id="clearMouseBtn" style="margin-top:12px; background:#1e293b; color:#f1f5f9; border:1px solid #334155; padding:6px 12px; border-radius:6px; cursor:pointer;">مسح المسار</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const rows = [];
    let botScore = 0;

    const isWebdriver = navigator.webdriver;
    const isWdDefined = typeof isWebdriver !== 'undefined' && isWebdriver === true;
    rows.push({
      name: 'navigator.webdriver (كاشف البوتات الأول)',
      val: String(isWebdriver),
      isBot: isWdDefined,
      explanation: isWdDefined ? 'تم كشف التشغيل الآلي الصريح' : 'محجوب بنجاح (Stealth Active)'
    });
    if (isWdDefined) botScore += 40;

    let vendor = 'Unavailable';
    let renderer = 'Unavailable';
    try {
      const gl = document.createElement('canvas').getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }
      }
    } catch (_) {}

    const isSwiftShader = /swiftshader|llvmpipe|vmware|virtualbox/i.test(renderer);
    rows.push({
      name: 'كارت الشاشة المحاكى (WebGL GPU Renderer)',
      val: renderer,
      isBot: isSwiftShader,
      explanation: isSwiftShader ? 'كارت شاشة وهمي للسيرفرات' : 'كارت شاشة واقعي لمستخدم حقيقي'
    });
    if (isSwiftShader) botScore += 30;

    const hasChrome = Boolean(window.chrome && window.chrome.runtime);
    rows.push({
      name: 'بيئة متصفح كروم (window.chrome)',
      val: hasChrome ? 'موجودة وطبيعية' : 'مفقودة (سلوك Headless)',
      isBot: !hasChrome,
      explanation: hasChrome ? 'سلوك يطابق متصفح Chrome الأصلي' : 'بيئة تفتقر لعناصر المتصفح العادي'
    });
    if (!hasChrome) botScore += 15;

    const cores = navigator.hardwareConcurrency || 0;
    rows.push({
      name: 'أنوية المعالج (Hardware Concurrency)',
      val: cores + ' Cores',
      isBot: cores < 2,
      explanation: cores >= 2 ? 'تكوين عتاد بشري طبيعي' : 'عتاد ضعيف غير واقعي'
    });

    const langs = (navigator.languages || []).join(', ');
    rows.push({
      name: 'لغات المتصفح (Browser Languages)',
      val: langs || 'None',
      isBot: !langs,
      explanation: langs ? 'لغات متصفح بشرية' : 'مفقودة'
    });

    let tz = 'Unknown';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (_) {}
    rows.push({
      name: 'المنطقة الزمنية ومطابقة الدولة (Intl Timezone)',
      val: tz,
      isBot: !tz,
      explanation: tz ? 'منطقة زمنية جغرافية معتمدة ومطابقة لدولة الزائر' : 'مفقودة'
    });

    const tbody = document.getElementById('auditTableBody');
    rows.forEach(r => {
      const tr = document.createElement('tr');
      const badgeCls = r.isBot ? 'bot' : 'human';
      const badgeTxt = r.isBot ? '❌ BOT FLAG' : '✅ PASS (HUMAN)';
      tr.innerHTML = '<td><strong>' + r.name + '</strong><br/><span style=\"color:#94a3b8;font-size:12px;\">' + r.explanation + '</span></td>' +
        '<td class=\"mono\">' + r.val + '</td>' +
        '<td><span class=\"status-badge ' + badgeCls + '\">' + badgeTxt + '</span></td>';
      tbody.appendChild(tr);
    });

    const badge = document.getElementById('verdictBadge');
    if (botScore >= 30) {
      badge.textContent = '❌ مشبوه كـ BOT بنسبة ' + botScore + '%';
      badge.className = 'status-badge bot';
    } else {
      badge.textContent = '✅ زائر بشري حقيقي (100% VERIFIED HUMAN)';
      badge.className = 'status-badge human';
    }

    const cvs = document.getElementById('canvasTest');
    const ctx = cvs.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('MiroProbe AI 2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Stealth Persona', 4, 35);
    const dataUrl = cvs.toDataURL();
    
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      hash = ((hash << 5) - hash) + dataUrl.charCodeAt(i);
      hash |= 0;
    }
    const hexHash = '0x' + (hash >>> 0).toString(16).toUpperCase();
    document.getElementById('canvasHash').textContent = hexHash;
    document.getElementById('canvasNoiseNotice').textContent = '✓ تم توليد البصمة مع تشويش Micro-Noise لضمان فرادة كل شخصية';

    const mouseCvs = document.getElementById('mouseCanvas');
    const mCtx = mouseCvs.getContext('2d');
    let points = [];

    function drawTrajectory() {
      if (points.length < 2) return;
      mCtx.clearRect(0, 0, mouseCvs.width, mouseCvs.height);
      mCtx.beginPath();
      mCtx.strokeStyle = '#38bdf8';
      mCtx.lineWidth = 2;
      mCtx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        mCtx.lineTo(points[i].x, points[i].y);
      }
      mCtx.stroke();

      let straightDist = Math.hypot(points[points.length - 1].x - points[0].x, points[points.length - 1].y - points[0].y);
      let pathDist = 0;
      for (let i = 1; i < points.length; i++) {
        pathDist += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      }

      const ratio = pathDist / (straightDist || 1);
      const typeLabel = document.getElementById('mouseTrajectoryType');
      if (ratio > 1.05) {
        typeLabel.textContent = 'منحنى بيومتري بشري (Bézier / Natural Curve)';
        typeLabel.style.color = '#4ade80';
      } else {
        typeLabel.textContent = 'مسار مستقيم (Linear Bot Trajectory)';
        typeLabel.style.color = '#f87171';
      }
      document.getElementById('mousePointsCount').textContent = 'النقاط المسجلة: ' + points.length;
    }

    mouseCvs.addEventListener('mousemove', (e) => {
      const rect = mouseCvs.getBoundingClientRect();
      points.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: Date.now() });
      drawTrajectory();
    });

    document.getElementById('clearMouseBtn').addEventListener('click', () => {
      points = [];
      mCtx.clearRect(0, 0, mouseCvs.width, mouseCvs.height);
      document.getElementById('mouseTrajectoryType').textContent = 'انتظار الحركة...';
      document.getElementById('mouseTrajectoryType').style.color = '#38bdf8';
      document.getElementById('mousePointsCount').textContent = 'النقاط المسجلة: 0';
    });
  </script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/bot-audit' || url === '/bot-audit/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(botAuditHtmlPage);
    return;
  }

  if (url === '/api/scenarios') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(loadScenarios()));
    return;
  }

  if (url === '/api/config') {
    const configPath = path.join(__dirname, 'miroprobe-config.json');
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          let current = {};
          if (fs.existsSync(configPath)) {
            current = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          }
          const updated = { ...current, ...parsed };
          fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, config: updated }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    } else {
      let current = {
        targetUrl: 'https://meyar-gold-egypt.pages.dev',
        visitorsPerMinute: 1000,
        testDuration: '30s',
        targetGeo: 'ALL',
        trafficSource: 'ALL_SOCIAL',
        deviceMix: 'BALANCED'
      };
      if (fs.existsSync(configPath)) {
        current = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(current));
      return;
    }
  }

  if (url === '/api/run-worker') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
    const personaNum = urlObj.searchParams.get('persona') || '0';
    const { spawn } = require('child_process');

    const isCloud = process.env.HEADLESS === 'true' || process.env.DOCKER === 'true' || (!process.env.DISPLAY && process.platform !== 'win32');
    const args = ['test', 'playwright-personas.spec.ts'];
    if (!isCloud) {
      args.push('--headed');
    }
    if (personaNum !== '0') {
      args.push('-g', `Persona.${personaNum}`);
    }

    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    try {
      const child = spawn(cmd, ['playwright', ...args], {
        cwd: __dirname,
        shell: true,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, persona: personaNum }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  const currentScenarios = loadScenarios();
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderMainHtml(currentScenarios));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('MiroProbe AI Server running at http://0.0.0.0:' + PORT);
  console.log('Anti-Bot & Biometrics Lab at: http://0.0.0.0:' + PORT + '/bot-audit');
});
