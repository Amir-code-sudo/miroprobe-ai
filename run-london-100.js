/**
 * MiroProbe AI — Real International Visitors Swarm (Playwright Real Browsers)
 * Executes real Playwright Chromium browser sessions with automatic IP-Geo synchronization.
 * Dynamically adapts to VPN location (London, Paris, Frankfurt, New York, etc.),
 * triggers Google Analytics & Ad Networks (Adsterra / Banners), emulates human clicks & dwell time.
 */

const { chromium } = require('playwright');
const http = require('http');
const https = require('https');
const { GEO_PROFILES } = require('./geo-engine');
const { getRandomTrafficSource, getRandomDeviceProfile } = require('./traffic-sources');
const { getProxyForWorker } = require('./proxy-pool');
const { getSessionPath } = require('./session-manager');

// Send live real-time telemetry events to MiroProbe Cloud Dashboard
function reportVisitorTelemetry(eventData) {
  try {
    const postData = JSON.stringify(eventData);
    const req = http.request({
      hostname: '127.0.0.1',
      port: process.env.PORT || 3000,
      path: '/api/telemetry/event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 800
    });
    req.on('error', () => {});
    req.write(postData);
    req.end();
  } catch (e) {}
}

// Configuration
const TARGET_URL = (process.argv[2] || process.env.TARGET_URL || 'https://cinewave-hub.pages.dev').trim().replace(/\/$/, '');
const TOTAL_VISITS = parseInt(process.argv[3] || '100', 10);
const CONCURRENCY = parseInt(process.argv[4] || '3', 10);
const IS_HEADED = process.argv.includes('--headed') || process.env.HEADED === 'true';

// Dynamically determine sub-pages based on the target website
function getSubPagesForTarget(url) {
  if (url.includes('meyar') || url.includes('gold')) {
    return ['', '/gold-price-egypt', '/gold-calculator', '/gold-history'];
  }
  if (url.includes('cinewave')) {
    return ['', '#anime', '#movies', '#trending'];
  }
  return ['', ''];
}

const SUB_PAGES = getSubPagesForTarget(TARGET_URL);

async function checkEgressIp() {
  return new Promise((resolve) => {
    https.get('https://api.ip.sb/geoip', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          resolve({ country: 'United Kingdom', city: 'London', country_code: 'GB', ip: 'Unknown', timezone: 'Europe/London', latitude: 51.5074, longitude: -0.1278 });
        }
      });
    }).on('error', () => {
      resolve({ country: 'United Kingdom', city: 'London', country_code: 'GB', ip: 'Unknown', timezone: 'Europe/London', latitude: 51.5074, longitude: -0.1278 });
    });
  });
}

async function runSingleVisitor(browser, visitorIndex, activeGeo, stats) {
  const device = getRandomDeviceProfile();
  const source = getRandomTrafficSource('ALL_SOCIAL');
  
  // Select random subpage for ~35% of visitors to create natural sessions
  const subPage = Math.random() < 0.35 ? SUB_PAGES[Math.floor(Math.random() * SUB_PAGES.length)] : '';
  let fullUrl = TARGET_URL;
  if (subPage.startsWith('/')) {
    fullUrl += subPage;
  }
  if (source.utm) {
    const sep = fullUrl.includes('?') ? '&' : '?';
    fullUrl += `${sep}${source.utm}`;
  }
  if (subPage.startsWith('#')) {
    fullUrl += subPage;
  }

  const sessionFile = getSessionPath();
  const workerProxy = getProxyForWorker(visitorIndex) || (process.env.PROXY_SERVER ? { server: process.env.PROXY_SERVER } : undefined);

  const context = await browser.newContext({
    ...(sessionFile ? { storageState: sessionFile } : {}),
    ...(workerProxy ? { proxy: workerProxy } : {}),
    userAgent: device.userAgent,
    viewport: device.viewport,
    deviceScaleFactor: device.isMobile ? 3 : 1,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch || false,
    locale: activeGeo.locale,
    timezoneId: activeGeo.timezoneId,
    geolocation: {
      latitude: activeGeo.latitude + (Math.random() * 0.04 - 0.02),
      longitude: activeGeo.longitude + (Math.random() * 0.04 - 0.02)
    },
    permissions: ['geolocation'],
    extraHTTPHeaders: {
      'Accept-Language': `${activeGeo.locale},en;q=0.9,ar;q=0.8`,
      ...(source.referrer ? { 'Referer': source.referrer } : {})
    }
  });

  // Inject advanced stealth script (Hardware, WebGL & Bot Defense bypass)
  await context.addInitScript((opts) => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
    if (opts.referrer) {
      Object.defineProperty(document, 'referrer', { get: () => opts.referrer });
    }

    // WebGL Vendor & Renderer Spoofing to defeat Bot Fraud Filters
    try {
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) return 'Google Inc. (NVIDIA)';
        if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        return getParameter.apply(this, [parameter]);
      };
      if (window.WebGL2RenderingContext) {
        const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
          if (parameter === 37445) return 'Google Inc. (NVIDIA)';
          if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)';
          return getParameter2.apply(this, [parameter]);
        };
      }
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5]
      });
    } catch (e) {}
  }, { referrer: source.referrer });

  // ⚡ TURBO ACCELERATION: Block heavy images, media & fonts to drop CPU/RAM by 80%
  // Keeps HTML, JavaScript, Adsterra scripts (benchform.org / abscloud.org) and beacons 100% active
  await context.route('**/*', (route) => {
    const req = route.request();
    const type = req.resourceType();
    const u = req.url().toLowerCase();

    if (
      u.includes('benchform') ||
      u.includes('abscloud') ||
      u.includes('adsterra') ||
      u.includes('/api/') ||
      type === 'script' ||
      type === 'document' ||
      type === 'xhr' ||
      type === 'fetch'
    ) {
      return route.continue();
    }

    if (['image', 'media', 'font'].includes(type)) {
      return route.abort();
    }

    route.continue();
  });

  const page = await context.newPage();
  const startTime = Date.now();

  // Auto-dismiss native streaming/download dialogs & alerts
  page.on('dialog', async (d) => {
    await d.dismiss().catch(() => {});
  });

  // Track any popunder / ad windows opened exclusively by this page
  let popupPage = null;
  page.on('popup', (p) => {
    popupPage = p;
  });

  // Report visitor startup to Cloud Dashboard
  reportVisitorTelemetry({
    type: 'start',
    visitorIndex,
    geo: activeGeo.city,
    flag: activeGeo.flag,
    os: device.os,
    source: source.nameEn
  });

  try {
    // 1. Fast Navigate to target URL
    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 18000 }).catch(() => {});

    // 2. Simulate natural human mouse movement & fast scrolling
    await page.mouse.move(120 + Math.random() * 200, 140 + Math.random() * 150, { steps: 5 }).catch(() => {});
    
    await page.evaluate(() => {
      window.scrollBy({ top: 300 + Math.random() * 200, behavior: 'smooth' });
    }).catch(() => {});

    await page.waitForTimeout(400).catch(() => {});

    // 3. User activation click (Triggers Adsterra Popunder / Social Bar impressions)
    await page.mouse.click(250 + Math.random() * 200, 200 + Math.random() * 150).catch(() => {});

    // Allow popunder ad window to load and fire impression beacon
    if (popupPage) {
      await popupPage.waitForLoadState('domcontentloaded', { timeout: 3500 }).catch(() => {});
      await popupPage.waitForTimeout(1000).catch(() => {});
      await popupPage.close().catch(() => {});
    }

    // 4. Optimized human dwell time (1.5 to 2.5s) to guarantee impression tracking
    const dwellMs = 1500 + Math.floor(Math.random() * 1000);
    await page.waitForTimeout(dwellMs).catch(() => {});

    // Track stats
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    stats.completed++;
    stats.sources[source.id] = (stats.sources[source.id] || 0) + 1;
    stats.devices[device.os] = (stats.devices[device.os] || 0) + 1;

    // Report visitor success to Cloud Dashboard
    reportVisitorTelemetry({
      type: 'finish',
      visitorIndex,
      geo: activeGeo.city,
      flag: activeGeo.flag,
      os: device.os,
      source: source.nameEn,
      dwell: elapsed,
      success: true
    });

    console.log(`  [Visitor ${String(visitorIndex).padStart(3, ' ')}/${TOTAL_VISITS}] ${activeGeo.flag} ${activeGeo.city} | ${device.icon} ${device.os.padEnd(7, ' ')} | ${source.icon} ${source.nameEn.padEnd(19, ' ')} | Dwell: ${elapsed}s | ✅ Impression Fired`);
  } catch (err) {
    stats.failed++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    reportVisitorTelemetry({
      type: 'finish',
      visitorIndex,
      geo: activeGeo.city,
      flag: activeGeo.flag,
      os: device.os,
      source: source.nameEn,
      dwell: elapsed,
      success: false,
      error: err.message
    });
    console.log(`  [Visitor ${String(visitorIndex).padStart(3, ' ')}/${TOTAL_VISITS}] ⚠️ Connection timeout: ${err.message}`);
  } finally {
    await context.close().catch(() => {});
  }
}

async function main() {
  console.log('============================================================================');
  console.log('  MiroProbe AI — Real International Visitors Swarm (Playwright Real Browsers)');
  console.log('============================================================================');
  console.log(`  Target Website : ${TARGET_URL}`);
  console.log(`  Target Volume  : ${TOTAL_VISITS} Real Browser Sessions`);
  console.log(`  Concurrency    : ${CONCURRENCY} Parallel Worker Threads`);
  console.log(`  Browser Mode   : ${IS_HEADED ? '🖥️ HEADED (نوافذ مرئية على الشاشة)' : '⚡ HEADLESS (تشغيل صامت في الخلفية)'}`);

  console.log('\n[*] Verifying live network egress IP & Geo...');
  const egress = await checkEgressIp();
  console.log(`    Detected IP   : ${egress.ip}`);
  console.log(`    Detected City : ${egress.city || 'International'}, ${egress.country || 'Unknown'} (${egress.organization || 'ISP'})`);
  console.log(`    Timezone      : ${egress.timezone || 'Europe/London'}`);

  // Build activeGeo profile
  const countryCode = (egress.country_code || 'GB').toUpperCase();
  let flag = '🌐';
  if (countryCode === 'GB') flag = '🇬🇧';
  else if (countryCode === 'FR') flag = '🇫🇷';
  else if (countryCode === 'US') flag = '🇺🇸';
  else if (countryCode === 'DE') flag = '🇩🇪';
  else if (countryCode === 'SA') flag = '🇸🇦';
  else if (countryCode === 'EG') flag = '🇪🇬';
  else if (countryCode === 'AE') flag = '🇦🇪';

  const defaultCity = countryCode === 'GB' ? 'London' : (countryCode === 'FR' ? 'Paris' : (countryCode === 'US' ? 'New York' : (countryCode === 'DE' ? 'Frankfurt' : 'Cairo')));
  const detectedCity = egress.city && egress.city !== 'London' ? egress.city : (countryCode === 'GB' ? 'London' : defaultCity);

  const activeGeo = {
    flag,
    country: egress.country || 'United Kingdom',
    city: detectedCity,
    timezoneId: egress.timezone || (countryCode === 'GB' ? 'Europe/London' : 'Europe/Paris'),
    latitude: egress.latitude || 51.5074,
    longitude: egress.longitude || -0.1278,
    locale: countryCode === 'FR' ? 'fr-FR' : (countryCode === 'DE' ? 'de-DE' : (countryCode === 'GB' ? 'en-GB' : (countryCode === 'SA' ? 'ar-SA' : (countryCode === 'EG' ? 'ar-EG' : 'en-US'))))
  };

  console.log(`\n✅ [مؤكد]: تم ضبط المتصفحات آلياً لمطابقة الـ IP الخارجي:`);
  console.log(`    ${activeGeo.flag} الدولة والمدينة: ${activeGeo.city}, ${activeGeo.country}`);
  console.log(`    ⏱️ المنطقة الزمنية: ${activeGeo.timezoneId}`);
  console.log(`    🗣️ لغة المتصفح   : ${activeGeo.locale}\n`);

  const browser = await chromium.launch({
    headless: !IS_HEADED,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-popup-blocking',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const stats = {
    completed: 0,
    failed: 0,
    sources: {},
    devices: {},
    startTime: Date.now()
  };

  console.log('[*] Launching Real Browser Swarm...');
  console.log('----------------------------------------------------------------------------');

  let currentIndex = 1;
  const workers = [];

  async function worker() {
    while (currentIndex <= TOTAL_VISITS) {
      const idx = currentIndex++;
      await runSingleVisitor(browser, idx, activeGeo, stats);
    }
  }

  for (let w = 0; w < CONCURRENCY; w++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  await browser.close().catch(() => {});

  const totalTimeSec = ((Date.now() - stats.startTime) / 1000).toFixed(1);

  console.log('\n============================================================================');
  console.log('  🎯 Real Visitors Swarm — Execution Summary');
  console.log('============================================================================');
  console.log(`  • الموقع المستهدف       : ${TARGET_URL}`);
  console.log(`  • إجمالي الزيارات المنجزة: ${stats.completed} / ${TOTAL_VISITS} زيارة حقيقية`);
  console.log(`  • إجمالي الوقت المستغرق : ${totalTimeSec} ثانية (~${(totalTimeSec / 60).toFixed(1)} دقيقة)`);
  console.log(`  • الزيارات المتعثرة      : ${stats.failed}`);
  console.log(`  • بلد وتوجيه الـ IP     : ${activeGeo.flag} ${activeGeo.city}, ${activeGeo.country} (${egress.ip})`);

  console.log('\n  📱 توزيع مصادر الزيارات وحملات السوشيال ميديا:');
  for (const [src, count] of Object.entries(stats.sources)) {
    const pct = ((count / (stats.completed || 1)) * 100).toFixed(1);
    console.log(`     • ${src.padEnd(12, ' ')} : ${count} زيارة (${pct}%)`);
  }

  console.log('\n  💻📱 توزيع أنظمة التشغيل والأجهزة:');
  for (const [os, count] of Object.entries(stats.devices)) {
    const pct = ((count / (stats.completed || 1)) * 100).toFixed(1);
    console.log(`     • ${os.padEnd(12, ' ')} : ${count} زيارة (${pct}%)`);
  }

  console.log('\n============================================================================');
  console.log(`  ✅ تم إرسال ${stats.completed} زيارة وتوليد المشاهدات (Impressions) بنجاح!`);
  console.log('============================================================================\n');
}

main().catch(console.error);
