/**
 * MiroProbe AI — High-Scale Behavioral Load Testing Engine
 * Native Node.js execution: No external binaries needed (Zero-setup).
 * Simulates thousands of visitors per minute with realistic think times & Little's Law.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { getRandomGeoProfile, getGeoProfile, GEO_PROFILES } = require('./geo-engine');
const { getRandomTrafficSource, getRandomDeviceProfile, buildUrlWithUtm, TRAFFIC_SOURCES, DEVICE_PROFILES } = require('./traffic-sources');

// Load Central Config if available
let appConfig = {};
try {
  const cfgRaw = fs.readFileSync(path.join(__dirname, 'miroprobe-config.json'), 'utf8');
  appConfig = JSON.parse(cfgRaw);
} catch (_) {}

// Load Scenarios
let scenariosData = null;
try {
  const raw = fs.readFileSync(path.join(__dirname, 'discovered-scenarios.json'), 'utf8');
  scenariosData = JSON.parse(raw);
} catch (_) {
  scenariosData = {
    targetUrl: 'https://meyar-gold-egypt.pages.dev',
    siteTitle: 'موقع الذهب',
    personas: []
  };
}

// Parse CLI arguments (supports both named flags like --vpm 1000 --duration 20s and positional arguments)
function getCliArg(flagName, positionalIndex, fallback) {
  const flagIdx = process.argv.indexOf(flagName);
  if (flagIdx !== -1 && process.argv[flagIdx + 1] && !process.argv[flagIdx + 1].startsWith('--')) {
    return process.argv[flagIdx + 1];
  }
  const posVal = process.argv[positionalIndex];
  if (posVal && !posVal.startsWith('--')) {
    return posVal;
  }
  return fallback;
}

const rawTarget = getCliArg('--url', 2, process.env.TARGET_URL || appConfig.targetUrl || scenariosData.targetUrl || 'https://meyar-gold-egypt.pages.dev');
const TARGET_URL = rawTarget.trim().replace(/\/$/, '');

// Parse VPM (default 1000)
const parsedVpm = Number(getCliArg('--vpm', 3, process.env.TARGET_VPM || appConfig.visitorsPerMinute || 1000));
const TARGET_VPM = isNaN(parsedVpm) || parsedVpm <= 0 ? 1000 : parsedVpm;

// Parse Duration in seconds (default 30s)
let durationSec = 30;
const durArg = String(getCliArg('--duration', 4, process.env.TEST_DURATION || appConfig.testDuration || '30s')).toLowerCase();
if (durArg.endsWith('m')) {
  durationSec = (parseInt(durArg, 10) || 1) * 60;
} else if (durArg.endsWith('s')) {
  durationSec = parseInt(durArg, 10) || 30;
} else if (!isNaN(Number(durArg))) {
  const num = Number(durArg);
  durationSec = num <= 10 ? num * 60 : num; // e.g. 5 means 5 minutes (300s)
}

// Configurable Filters (Country, Traffic Source, Device Profile, Worker Persona)
const TARGET_GEO = String(getCliArg('--geo', 5, process.env.TARGET_GEO || appConfig.targetGeo || 'ALL')).toUpperCase();
const TRAFFIC_SOURCE = String(getCliArg('--source', 6, process.env.TRAFFIC_SOURCE || appConfig.trafficSource || 'ALL_SOCIAL')).toUpperCase();
const DEVICE_MIX = String(getCliArg('--device', 7, process.env.DEVICE_MIX || appConfig.deviceMix || 'BALANCED')).toUpperCase();
const TARGET_PERSONA = String(getCliArg('--persona', 8, process.env.TARGET_PERSONA || 'ALL')).toUpperCase();

console.log('============================================================================');
console.log('  MiroProbe AI — High-Scale Behavioral Load Testing Engine');
console.log(`  Target Website : ${TARGET_URL}`);
console.log(`  Configured Rate: ${TARGET_VPM} Visitors / Minute (${(TARGET_VPM / 60).toFixed(1)} Arrivals/sec)`);
console.log(`  Test Duration  : ${durationSec} Seconds (${(durationSec / 60).toFixed(1)} min)`);
console.log(`  Worker Persona : ${TARGET_PERSONA === 'ALL' ? '🌟 Balanced Mix of All Personas' : `👤 Dedicated Worker ${TARGET_PERSONA}`}`);
console.log(`  Target Region  : ${TARGET_GEO === 'ALL' ? '🌍 Multi-Region (SA, EG, US, GB, AE, DE)' : `📍 ${TARGET_GEO}`}`);
console.log(`  Traffic Source : ${TRAFFIC_SOURCE === 'ALL_SOCIAL' ? '📱 Social & Search Campaign Mix (FB, IG, TikTok, Google)' : `🔗 ${TRAFFIC_SOURCE}`}`);
console.log(`  Device Profiles: ${DEVICE_MIX === 'BALANCED' ? '💻📱 Balanced Mix (Windows, Mac, iOS, Android)' : DEVICE_MIX}`);
console.log('============================================================================\n');

// HTTP Agent with keepAlive for high connection pooling
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 300 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 300, rejectUnauthorized: false });

// Telemetry Stats
const stats = {
  totalRequests: 0,
  successRequests: 0,
  failedRequests: 0,
  statusCodes: {},
  geoRequests: {},
  trafficSources: {},
  deviceBreakdown: {},
  latencies: [],
  startTime: Date.now(),
  endTime: null,
};

function sendRequest(pathUrl, geo = getRandomGeoProfile(), trafficSource = getRandomTrafficSource(), device = getRandomDeviceProfile()) {
  return new Promise((resolve) => {
    try {
      const fullUrl = new URL(pathUrl.startsWith('http') ? pathUrl : `${TARGET_URL}${pathUrl.startsWith('/') ? '' : '/'}${pathUrl}`);
      const isHttps = fullUrl.protocol === 'https:';
      const lib = isHttps ? https : http;
      const agent = isHttps ? httpsAgent : httpAgent;

      const headers = {
        'User-Agent': device ? device.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': geo.acceptLanguage,
        'X-Forwarded-For': geo.sampleIp,
        'X-Real-IP': geo.sampleIp,
        'X-Country-Code': geo.id
      };
      if (trafficSource && trafficSource.referrer) {
        headers['Referer'] = trafficSource.referrer;
      }

      const start = Date.now();
      const req = lib.request(fullUrl, {
        method: 'GET',
        agent,
        headers,
        timeout: 10000,
      }, (res) => {
        let bytes = 0;
        res.on('data', (chunk) => { bytes += chunk.length; });
        res.on('end', () => {
          const latency = Date.now() - start;
          stats.totalRequests++;
          stats.statusCodes[res.statusCode] = (stats.statusCodes[res.statusCode] || 0) + 1;
          stats.geoRequests[geo.id] = (stats.geoRequests[geo.id] || 0) + 1;
          if (trafficSource) stats.trafficSources[trafficSource.id] = (stats.trafficSources[trafficSource.id] || 0) + 1;
          if (device) stats.deviceBreakdown[device.os] = (stats.deviceBreakdown[device.os] || 0) + 1;

          if (res.statusCode >= 200 && res.statusCode < 400) {
            stats.successRequests++;
          } else {
            stats.failedRequests++;
          }
          stats.latencies.push(latency);
          resolve();
        });
      });

      req.on('error', () => {
        stats.totalRequests++;
        stats.failedRequests++;
        stats.statusCodes['ERR'] = (stats.statusCodes['ERR'] || 0) + 1;
        stats.geoRequests[geo.id] = (stats.geoRequests[geo.id] || 0) + 1;
        if (trafficSource) stats.trafficSources[trafficSource.id] = (stats.trafficSources[trafficSource.id] || 0) + 1;
        if (device) stats.deviceBreakdown[device.os] = (stats.deviceBreakdown[device.os] || 0) + 1;
        resolve();
      });

      req.on('timeout', () => {
        req.destroy();
        stats.totalRequests++;
        stats.failedRequests++;
        stats.statusCodes['TIMEOUT'] = (stats.statusCodes['TIMEOUT'] || 0) + 1;
        stats.geoRequests[geo.id] = (stats.geoRequests[geo.id] || 0) + 1;
        if (trafficSource) stats.trafficSources[trafficSource.id] = (stats.trafficSources[trafficSource.id] || 0) + 1;
        if (device) stats.deviceBreakdown[device.os] = (stats.deviceBreakdown[device.os] || 0) + 1;
        resolve();
      });

      req.end();
    } catch (_) {
      stats.totalRequests++;
      stats.failedRequests++;
      resolve();
    }
  });
}

// Persona journeys
const endpoints = (scenariosData.detectedEndpoints && scenariosData.detectedEndpoints.length > 0)
  ? scenariosData.detectedEndpoints
  : ['/', '/gold-calculator', '/gold-price-egypt', '/gold-history'];

async function simulatePersonaSession() {
  let geoKey = TARGET_GEO;
  let sourceKey = TRAFFIC_SOURCE;
  let devKey = DEVICE_MIX;

  if (TARGET_PERSONA === '1') {
    if (geoKey === 'ALL') geoKey = 'EG';
    if (sourceKey === 'ALL_SOCIAL') sourceKey = 'GOOGLE';
    if (devKey === 'BALANCED') devKey = 'DESKTOP_ONLY';
  } else if (TARGET_PERSONA === '2') {
    if (geoKey === 'ALL') geoKey = 'SA';
    if (sourceKey === 'ALL_SOCIAL') sourceKey = 'TIKTOK';
    if (devKey === 'BALANCED') devKey = 'DESKTOP_ONLY';
  } else if (TARGET_PERSONA === '3') {
    if (geoKey === 'ALL') geoKey = 'US';
    if (sourceKey === 'ALL_SOCIAL') sourceKey = 'FACEBOOK';
    if (devKey === 'BALANCED') devKey = 'DESKTOP_ONLY';
  } else if (TARGET_PERSONA === '4') {
    if (geoKey === 'ALL') geoKey = 'GB';
    if (sourceKey === 'ALL_SOCIAL') sourceKey = 'INSTAGRAM';
    devKey = 'MOBILE_ONLY';
  }

  const geo = geoKey !== 'ALL' && GEO_PROFILES[geoKey]
    ? getGeoProfile(geoKey)
    : getRandomGeoProfile();

  const trafficSource = getRandomTrafficSource(sourceKey);
  const device = getRandomDeviceProfile(devKey);

  // Initial landing page includes campaign UTM parameters
  const landingPath = buildUrlWithUtm('/', trafficSource);
  const path2 = endpoints[Math.floor(Math.random() * endpoints.length)] || '/';

  await sendRequest(landingPath, geo, trafficSource, device);
  // Human think time (scaled down for protocol simulation)
  await new Promise(r => setTimeout(r, Math.floor(100 + Math.random() * 250)));
  await sendRequest(path2, geo, trafficSource, device);
}

async function runLoadSimulation() {
  console.log('[*] Warming up connection pool & generating behavioral visitor waves...');
  const intervalMs = (60 / TARGET_VPM) * 1000;
  const stopTime = Date.now() + (durationSec * 1000);

  let activeSessions = 0;

  const timer = setInterval(() => {
    if (Date.now() >= stopTime) {
      clearInterval(timer);
      return;
    }

    activeSessions++;
    simulatePersonaSession().finally(() => {
      activeSessions--;
    });
  }, Math.max(15, Math.floor(intervalMs)));

  // Progress Logger every 3 seconds
  const progressTimer = setInterval(() => {
    const elapsedSec = Math.max(1, Math.round((Date.now() - stats.startTime) / 1000));
    const rps = (stats.totalRequests / elapsedSec).toFixed(1);
    const successRate = stats.totalRequests > 0 ? ((stats.successRequests / stats.totalRequests) * 100).toFixed(1) : '100';

    process.stdout.write(`\r  ► [Elapsed: ${elapsedSec}s / ${durationSec}s]  Reqs: ${stats.totalRequests}  |  RPS: ${rps}  |  Success: ${successRate}%  |  Active VUs: ${activeSessions}   `);

    if (Date.now() >= stopTime) {
      clearInterval(progressTimer);
    }
  }, 1000);

  // Wait for test to conclude
  await new Promise(r => setTimeout(r, (durationSec * 1000) + 1500));

  stats.endTime = Date.now();
  printResults();
}

function printResults() {
  console.log('\n\n============================================================================');
  console.log('  🎯 MiroProbe AI — Load Test Execution Benchmark Report');
  console.log('============================================================================');

  const totalTimeSec = ((stats.endTime - stats.startTime) / 1000).toFixed(1);
  const rps = (stats.totalRequests / totalTimeSec).toFixed(1);
  const effectiveVpm = Math.round((stats.totalRequests / 2) * (60 / totalTimeSec));

  stats.latencies.sort((a, b) => a - b);
  const avgLatency = stats.latencies.length > 0 
    ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length) 
    : 0;
  const p50 = stats.latencies[Math.floor(stats.latencies.length * 0.5)] || 0;
  const p90 = stats.latencies[Math.floor(stats.latencies.length * 0.9)] || 0;
  const p95 = stats.latencies[Math.floor(stats.latencies.length * 0.95)] || 0;
  const p99 = stats.latencies[Math.floor(stats.latencies.length * 0.99)] || 0;

  // Calculate Apdex (T = 500ms)
  const satisfied = stats.latencies.filter(l => l <= 500).length;
  const tolerating = stats.latencies.filter(l => l > 500 && l <= 1500).length;
  const apdex = stats.latencies.length > 0 ? ((satisfied + (tolerating / 2)) / stats.latencies.length).toFixed(2) : '1.00';

  console.log(`\n  • الموقع المستهدف      : ${TARGET_URL}`);
  console.log(`  • إجمالي مدة الفحص     : ${totalTimeSec} ثانية`);
  console.log(`  • إجمالي الطلبات       : ${stats.totalRequests} طلب`);
  console.log(`  • الطلبات الناجحة (2xx) : ${stats.successRequests} (${((stats.successRequests / (stats.totalRequests || 1)) * 100).toFixed(1)}%)`);
  console.log(`  • الطلبات المتعثرة     : ${stats.failedRequests}`);
  console.log(`  • معدل الإنجاز الفعلي  : ${rps} طلب/ثانية (~${effectiveVpm} زائر سلوكي/دقيقة)`);
  console.log(`  • مؤشر الجودة (Apdex)   : ${apdex} / 1.00 ${Number(apdex) >= 0.85 ? '✅ (ممتاز)' : '⚠️ (يحتاج تحسين)'}`);

  console.log('\n  📊 أزمنة الاستجابة (Latency Breakdown):');
  console.log(`     - المتوسط (Average) : ${avgLatency} ms`);
  console.log(`     - الوسيط (p50)      : ${p50} ms`);
  console.log(`     - الشريحة p90       : ${p90} ms`);
  console.log(`     - الشريحة p95       : ${p95} ms`);
  console.log(`     - أقصى تأخير p99   : ${p99} ms`);

  console.log('\n  📋 توزيع أكواد الاستجابة (HTTP Status Codes):');
  for (const [code, count] of Object.entries(stats.statusCodes)) {
    console.log(`     - Status [${code}]: ${count} طلب`);
  }

  console.log('\n  🌍 توزيع الزيارات الجغرافية الدولية (Multi-Region Geo Diversity Breakdown):');
  for (const [code, count] of Object.entries(stats.geoRequests)) {
    const geo = GEO_PROFILES[code] || { countryNameAr: code, flag: '🌐', cityNameAr: '' };
    const pct = ((count / (stats.totalRequests || 1)) * 100).toFixed(1);
    console.log(`     • ${geo.flag} ${geo.countryNameAr} (${geo.cityNameAr}) : ${count} طلب (${pct}%)`);
  }

  console.log('\n  📱 مصادر الزيارات وحملات السوشيال ميديا (Traffic Sources & Campaigns):');
  for (const [code, count] of Object.entries(stats.trafficSources)) {
    const src = TRAFFIC_SOURCES[code] || { nameAr: code, icon: '🔗' };
    const pct = ((count / (stats.totalRequests || 1)) * 100).toFixed(1);
    console.log(`     • ${src.icon} ${src.nameAr} : ${count} طلب (${pct}%)`);
  }

  console.log('\n  💻📱 توزيع الأجهزة وأنظمة التشغيل (OS & Device Category Breakdown):');
  for (const [os, count] of Object.entries(stats.deviceBreakdown)) {
    const icon = os === 'iOS' ? '📱' : (os === 'Android' ? '🤖' : (os === 'macOS' ? '🍏' : '💻'));
    const pct = ((count / (stats.totalRequests || 1)) * 100).toFixed(1);
    console.log(`     • ${icon} نظام ${os} : ${count} طلب (${pct}%)`);
  }

  console.log('\n============================================================================');
  console.log('  تم إنهاء محاكاة التحمل السلوكي بنجاح. جاهز للمناقشة!');
  console.log('============================================================================\n');
  process.exit(0);
}

runLoadSimulation();
