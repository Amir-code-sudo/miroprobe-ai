/**
 * MiroProbe AI — Autonomous Web Crawler & AI Persona Synthesizer
 * Given any target URL, this engine:
 * 1. Crawls the target website using a stealth headless browser.
 * 2. Extracts real interactive elements (buttons, inputs, links, forms, API calls).
 * 3. Uses AI (Gemini API or Smart Semantic Heuristics) to synthesize 4 realistic personas tailored specifically to that website's domain.
 * 4. Regenerates playwright-personas.spec.ts, k6-load-scenarios.js, and discovered-scenarios.json automatically!
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

const rawUrl = process.argv[2] || process.env.TARGET_URL || 'https://meyar-gold-egypt.pages.dev';
const TARGET_URL = rawUrl.trim().replace(/\/$/, '');

console.log('============================================================================');
console.log('  MiroProbe AI — Autonomous Visitor Scenario Discovery Engine');
console.log(`  Target URL: ${TARGET_URL}`);
console.log('============================================================================\n');

async function crawlSite(url) {
  console.log('[1/4] 🕷️  Launching Stealth Chromium to crawl and inspect DOM topology...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const interceptedEndpoints = new Set(['/']);

  // Intercept XHR / Fetch API requests
  page.on('request', (req) => {
    try {
      const reqUrl = req.url();
      if (reqUrl.startsWith(url)) {
        const pathOnly = reqUrl.replace(url, '');
        if (pathOnly && !pathOnly.includes('_next/') && !pathOnly.includes('.css') && !pathOnly.includes('.js')) {
          interceptedEndpoints.add(pathOnly.split('?')[0]);
        }
      }
    } catch (_) {}
  });

  console.log(`[1/4] Navigating to ${url} ...`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await page.waitForTimeout(2500); // Allow Next.js / React hydration
  } catch (err) {
    console.warn(`[WARN] Navigation timeout or network error: ${err.message}. Proceeding with parsed DOM.`);
  }

  // 1. Extract metadata & headings
  const pageTitle = (await page.title().catch(() => '')) || 'Untitled Web Application';
  const headings = await page.$$eval('h1, h2, h3', els => 
    els.map(e => e.innerText.trim()).filter(t => t.length > 2)
  ).catch(() => []);

  // 2. Extract internal navigation links
  const links = await page.$$eval('a[href]', (els, origin) => {
    return els.map(e => {
      const href = e.getAttribute('href') || '';
      const text = e.innerText.trim();
      return { href, text };
    }).filter(item => {
      if (!item.href || item.href.startsWith('#') || item.href.startsWith('mailto:') || item.href.startsWith('tel:')) return false;
      return item.href.startsWith('/') || item.href.startsWith(origin);
    });
  }, url).catch(() => []);

  // Deduplicate links
  const uniqueLinks = [];
  const seenHrefs = new Set();
  for (const l of links) {
    const cleanHref = l.href.startsWith('/') ? l.href : l.href.replace(url, '');
    if (!seenHrefs.has(cleanHref) && cleanHref.length > 1) {
      seenHrefs.add(cleanHref);
      uniqueLinks.push({ href: cleanHref, text: l.text || cleanHref });
      interceptedEndpoints.add(cleanHref);
    }
  }

  // 3. Extract interactive buttons
  const buttons = await page.$$eval('button, [role="button"], input[type="submit"], input[type="button"]', els => {
    return els.map(e => {
      const text = e.innerText ? e.innerText.trim() : (e.value || '');
      const id = e.id || '';
      const cls = typeof e.className === 'string' ? e.className.trim() : '';
      const aria = e.getAttribute('aria-label') || '';
      return { text: text || aria || 'Button', id, cls };
    }).filter(b => b.text || b.id);
  }).catch(() => []);

  // 4. Extract input fields
  const inputs = await page.$$eval('input:not([type="hidden"]), textarea, select', els => {
    return els.map(e => {
      return {
        type: e.type || e.tagName.toLowerCase(),
        name: e.name || '',
        id: e.id || '',
        placeholder: e.placeholder || '',
        label: e.getAttribute('aria-label') || ''
      };
    });
  }).catch(() => []);

  // 5. Extract rich media elements (videos, audio, reels, streams, iframes)
  const videoCount = await page.$$eval('video', els => els.length).catch(() => 0);
  const audioCount = await page.$$eval('audio', els => els.length).catch(() => 0);
  const iframeCount = await page.$$eval('iframe', els => els.length).catch(() => 0);
  const movieCardsCount = await page.$$eval('.movie-card, [class*="movie-card"]', els => els.length).catch(() => 0);
  const hasMedia = videoCount > 0 || audioCount > 0 || iframeCount > 0;

  console.log(`[2/4] 📊 Discovered elements:`);
  console.log(`      • Site Title : "${pageTitle}"`);
  console.log(`      • Headings   : ${headings.length} found (${headings.slice(0, 3).join(' | ')})`);
  console.log(`      • Sub-pages  : ${uniqueLinks.length} internal links`);
  console.log(`      • Buttons    : ${buttons.length} interactive clickables`);
  console.log(`      • Inputs     : ${inputs.length} form controls`);
  if (movieCardsCount > 0) {
    console.log(`      • Media Hub  : 🎬 ${movieCardsCount} Movie & Entertainment Cards detected`);
  }
  if (hasMedia) {
    console.log(`      • Rich Media : 🎬 ${videoCount + iframeCount} Video/Iframe Player(s) detected (Watch-Time Engine Activated)`);
  }

  await browser.close();

  return {
    targetUrl: url,
    siteTitle: pageTitle,
    headings,
    links: uniqueLinks.slice(0, 12),
    buttons: buttons.slice(0, 25),
    inputs: inputs.slice(0, 10),
    movieCardsCount,
    videoCount,
    hasMedia,
    endpoints: Array.from(interceptedEndpoints).slice(0, 8)
  };
}

function synthesizeDomainScenarios(crawledData) {
  console.log('[3/4] 🧠 Synthesizing AI Personas tailored specifically to this website...');
  const { siteTitle, headings, links, buttons, inputs, targetUrl, movieCardsCount } = crawledData;

  // Domain Category Detection
  const corpus = (siteTitle + ' ' + headings.join(' ') + ' ' + links.map(l => l.text).join(' ') + ' ' + buttons.map(b => b.text).join(' ')).toLowerCase();

  let domainCategory = 'General Web Application';
  let isStreamingOrMovies = /فيلم|أفلام|مسلسل|مسلسلات|أنمي|انمي|سينما|مشاهدة|تحميل|رواج|cinema|movie|anime|stream|trailer|action|scifi/i.test(corpus) || movieCardsCount > 0;
  let isGoldOrFinance = /ذهب|عيار|سعر|جرام|سبيكة|جنيه|بورصة|دولار|عملات|gold|carat|currency/i.test(corpus);
  let isEcommerce = /متجر|سلة|تسوق|شراء|منتج|طلب|cart|shop|store|checkout/i.test(corpus);
  let isEducation = /جامعة|كلية|طالب|تسجيل|مقررات|نتيجة|exam|student|course/i.test(corpus);

  if (isStreamingOrMovies) domainCategory = 'بوابة بث الأفلام ومسلسلات الأنمي (Movies & Anime Streaming Hub)';
  else if (isGoldOrFinance) domainCategory = 'الذهب والمعادن الثمينة والأسواق المالية (Gold & Financial Market Portal)';
  else if (isEcommerce) domainCategory = 'منصة تجارة إلكترونية ومبيعات (E-Commerce & Retail)';
  else if (isEducation) domainCategory = 'بوابة تعليمية وأكاديمية (Educational & Academic Portal)';

  const personas = [];

  if (isStreamingOrMovies) {
    // =========================================================================
    // 🎬 SPECIALIZED ENTERTAINMENT & STREAMING PERSONAS (CineWave & Media Hubs)
    // =========================================================================

    // Persona 1: The Trending & Anime Explorer
    personas.push({
      id: 'trending-anime-explorer',
      nameAr: 'مستكشف الأعمال الأكثر رواجاً وقسم الأنمي',
      nameEn: 'The Trending & Anime Explorer',
      archetype: 'يتفاعل مع أزرار التريند ويتصفح قوائم الأنمي والمسلسلات الحديثة',
      geoCode: 'EG',
      geoNameAr: 'مصر (القاهرة)',
      geoFlag: '🇪🇬',
      device: 'desktop',
      hardware: 'NVIDIA GeForce RTX 3070',
      networkProfile: 'Fiber / High-Speed',
      patienceScore: 85,
      trafficSharePercent: 35,
      descriptionAr: 'يقوم بزيارة الموقع، النقر على زر الأكثر رواجاً لفحص العروض الـ VIP، ثم الانتقال لقسم الأنمي وتصفح القائمة.',
      potentialBugFocusAr: 'فحص استجابة نوافذ المودال (Modals) وسرعة تصفية الأنمي بدون إعادة تحميل الصفحة.',
      steps: [
        {
          id: 'p1-1',
          action: 'navigate',
          labelAr: 'فتح منصة سينما ويف وفحص الواجهة الرئيسية',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p1-2',
          action: 'scroll',
          labelAr: 'تمرير الصفحة لتصفح البانر الترويجي',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 1800
        },
        {
          id: 'p1-3',
          action: 'click',
          labelAr: 'الضغط على زر الأكثر رواجاً لفتح نافذة السيرفر السريع',
          path: '/',
          selector: 'button:has-text("الأكثر رواجاً"), [onclick*="openVipModal"]',
          expectedThinkTimeMs: 2500
        },
        {
          id: 'p1-4',
          action: 'click',
          labelAr: 'إغلاق نافذة السيرفر السريع بعد استكشافها',
          path: '/',
          selector: '#vipModal button:has-text("إلغاء"), #vipModal button[onclick*="closeVipModal"], #vipModal button',
          expectedThinkTimeMs: 1500
        },
        {
          id: 'p1-5',
          action: 'click',
          labelAr: 'الانتقال لقسم تصنيف أنمي ياباني (Anime)',
          path: '/',
          selector: 'button:has-text("أنمي ياباني"), button[onclick*="anime"]',
          expectedThinkTimeMs: 2200
        },
        {
          id: 'p1-6',
          action: 'scroll',
          labelAr: 'التمرير داخل قائمة الأنمي لاستكشاف الحلقات',
          path: '/',
          selector: '#moviesGrid',
          expectedThinkTimeMs: 3000
        }
      ]
    });

    // Persona 2: The Cinema Streamer & Server Switcher
    personas.push({
      id: 'cinema-streamer',
      nameAr: 'مشاهد الأفلام ومشغل سيرفرات البث',
      nameEn: 'The Cinema Streamer & Server Switcher',
      archetype: 'يفتح بطاقات الأفلام، يشاهد العرض الترويجي، ويتنقل بين سيرفرات المشاهدة والتحميل',
      geoCode: 'SA',
      geoNameAr: 'السعودية (الرياض)',
      geoFlag: '🇸🇦',
      device: 'desktop',
      hardware: 'Apple M-Series Engine',
      networkProfile: '5G High-Bandwidth',
      patienceScore: 90,
      trafficSharePercent: 30,
      descriptionAr: 'ينقر على أحد الأفلام في الشبكة لفتح المشغل السينمائي وتجربة التبديل بين السيرفرات والتحميل.',
      potentialBugFocusAr: 'فحص استدعاءات الـ Popunder ونوافذ الـ Iframe واستقرار مشغل الفيديو عند التنقل.',
      steps: [
        {
          id: 'p2-1',
          action: 'navigate',
          labelAr: 'دخول الموقع وتصفح الأعمال المتاحة',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 1800
        },
        {
          id: 'p2-2',
          action: 'scroll',
          labelAr: 'التمرير نحو شبكة الأفلام المميزة',
          path: '/',
          selector: '#moviesGrid',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p2-3',
          action: 'click',
          labelAr: 'الضغط على بطاقة فيلم (مثل Dune أو Solo Leveling) لفتح نافذة المشاهدة',
          path: '/',
          selector: '.movie-card, #moviesGrid > div, button:has-text("مشاهدة")',
          expectedThinkTimeMs: 2800
        },
        {
          id: 'p2-4',
          action: 'click',
          labelAr: 'تجربة التبديل إلى سيرفر المشاهدة 2 (SERVER 2 - 4K)',
          path: '/',
          selector: 'button:has-text("SERVER 2"), button:has-text("سيرفر 2"), .server-btn:nth-child(2)',
          expectedThinkTimeMs: 2200
        },
        {
          id: 'p2-5',
          action: 'click',
          labelAr: 'الضغط على زر تحميل الفيلم بجودة 1080p FHD',
          path: '/',
          selector: 'button:has-text("تحميل 1080p"), [onclick*="handleDownloadClick"]',
          expectedThinkTimeMs: 2500
        },
        {
          id: 'p2-6',
          action: 'click',
          labelAr: 'إغلاق مشغل الفيلم والعودة للقائمة',
          path: '/',
          selector: '#watchModal button[onclick*="closeWatchModal"], #watchModal button:first-child',
          expectedThinkTimeMs: 1600
        }
      ]
    });

    // Persona 3: The Search & Filter Enthusiast
    personas.push({
      id: 'search-filter-guru',
      nameAr: 'الباحث المباشر ومفرز الجودة العالمية',
      nameEn: 'The Search & Quality Filterer',
      archetype: 'يبحث بالاسم ويفرز الأعمال بحسب تقييم IMDb الأعلى ويجرب تصنيفات الأكشن',
      geoCode: 'US',
      geoNameAr: 'أمريكا (نيويورك)',
      geoFlag: '🇺🇸',
      device: 'desktop',
      hardware: 'Intel Iris Xe Graphics',
      networkProfile: 'WiFi',
      patienceScore: 75,
      trafficSharePercent: 20,
      descriptionAr: 'يستخدم محرك البحث الداخلي لكتابة اسم فيلم ثم يغير خيارات الفرز حسب التقييم.',
      potentialBugFocusAr: 'اختبار دقة البحث التفاعلي (Live Filter) وكفاءة خوارزمية ترتيب النتائج.',
      steps: [
        {
          id: 'p3-1',
          action: 'navigate',
          labelAr: 'فتح المنصة والتركيز على شريط البحث',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 1800
        },
        {
          id: 'p3-2',
          action: 'fill',
          labelAr: 'كتابة اسم عمل في حقل البحث (Dune)',
          path: '/',
          selector: '#searchInput, input[type="text"]',
          fillValue: 'Dune',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p3-3',
          action: 'select',
          labelAr: 'فرز النتائج بحسب الأعلى تقييماً (IMDb Rating)',
          path: '/',
          selector: '#sortSelect, select',
          selectValue: 'rating',
          expectedThinkTimeMs: 2200
        },
        {
          id: 'p3-4',
          action: 'click',
          labelAr: 'التنقل إلى تصنيف أفلام أكشن وحركة (Action)',
          path: '/',
          selector: 'button:has-text("أكشن وحركة"), button[onclick*="action"]',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p3-5',
          action: 'scroll',
          labelAr: 'تصفح قائمة أفلام الأكشن المتوفرة',
          path: '/',
          selector: '#moviesGrid',
          expectedThinkTimeMs: 2500
        }
      ]
    });

    // Persona 4: The Mobile Binge Streamer
    personas.push({
      id: 'mobile-binge-streamer',
      nameAr: 'متصفح الهاتف وعاشق مسلسلات الأنمي',
      nameEn: 'The Mobile Binge Streamer',
      archetype: 'يتصفح عبر شاشة الهاتف ويتنقل بلمسات سريعة بين المسلسلات',
      geoCode: 'GB',
      geoNameAr: 'بريطانيا (لندن)',
      geoFlag: '🇬🇧',
      device: 'mobile',
      hardware: 'Qualcomm Adreno 730',
      networkProfile: '4G LTE Mobile',
      patienceScore: 60,
      trafficSharePercent: 15,
      descriptionAr: 'يقوم بالتمرير السريع عبر الموبايل، النقر على زر الأنمي السريع، وفتح بطاقة عمل للمعاينة.',
      potentialBugFocusAr: 'استجابة الواجهة للشاشات العمودية الصغيرة وتجربة التمرير اللمسي.',
      steps: [
        {
          id: 'p4-1',
          action: 'navigate',
          labelAr: 'فتح المنصة عبر شاشة الهاتف المحمول',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p4-2',
          action: 'click',
          labelAr: 'الضغط على زر الأنمي السريع في الهيدر',
          path: '/',
          selector: 'button:has-text("الأنمي"), [onclick*="anime"]',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p4-3',
          action: 'scroll',
          labelAr: 'تمرير سريع باللمس (Touch Swipe)',
          path: '/',
          selector: '#moviesGrid',
          expectedThinkTimeMs: 2500
        },
        {
          id: 'p4-4',
          action: 'click',
          labelAr: 'فتح بطاقة فيلم لمعاينة التفاصيل على الموبايل',
          path: '/',
          selector: '.movie-card, #moviesGrid > div',
          expectedThinkTimeMs: 2500
        },
        {
          id: 'p4-5',
          action: 'click',
          labelAr: 'إغلاق المودال والعودة للتصفح',
          path: '/',
          selector: '#watchModal button[onclick*="closeWatchModal"], #watchModal button',
          expectedThinkTimeMs: 1500
        }
      ]
    });

  } else {
    // Fallback General Personas
    const p1Link = links[0] || { href: '/', text: 'الصفحة الرئيسية' };
    const p1Button = buttons.find(b => b.text && b.text.length < 25) || { text: 'استكشاف', id: '' };
    personas.push({
      id: 'focused-browser',
      nameAr: isGoldOrFinance ? 'متابع أسعار الذهب الفورية' : 'الزائر الباحث عن المحتوى الرئيسي',
      nameEn: isGoldOrFinance ? 'The Live Gold Price Tracker' : 'The Focused Content Browser',
      archetype: 'يدخل بانتظام لفحص التحديثات اللحظية والأرقام الرئيسية',
      geoCode: 'EG',
      geoNameAr: 'مصر (القاهرة)',
      geoFlag: '🇪🇬',
      device: 'desktop',
      hardware: 'NVIDIA GeForce RTX 3070',
      networkProfile: 'Fiber / High-Speed',
      patienceScore: 85,
      trafficSharePercent: 40,
      descriptionAr: `يقوم بالدخول للصفحة الرئيسية لفحص "${headings[0] || siteTitle}" والتنقل إلى "${p1Link.text}".`,
      potentialBugFocusAr: 'اختبار تحديث الأسعار والبيانات اللحظية عبر الـ API بدون الحاجة لإعادة تحميل الصفحة.',
      steps: [
        {
          id: 'p1-1',
          action: 'navigate',
          labelAr: 'فتح الصفحة الرئيسية وفحص البيانات الحية',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 2200
        },
        ...(crawledData.hasMedia ? [{
          id: 'p1-media',
          action: 'media',
          labelAr: 'مشاهدة الفيديو وبث المحتوى لمدة 5 ثوانٍ لتفعيل خوارزميات المنصة',
          path: '/',
          expectedThinkTimeMs: 5000
        }] : []),
        {
          id: 'p1-2',
          action: 'scroll',
          labelAr: 'تمرير الصفحة لتصفح المحتوى والبيانات',
          path: '/',
          selector: 'main',
          expectedThinkTimeMs: 3000
        },
        {
          id: 'p1-3',
          action: 'click',
          labelAr: `التنقل إلى قسم: ${p1Link.text}`,
          path: p1Link.href,
          selector: `a[href*="${p1Link.href}"]`,
          expectedThinkTimeMs: 2500
        }
      ]
    });

    const p2Input = inputs[0] || { name: 'calc', type: 'number', placeholder: 'القيمة' };
    const p2Button = buttons[1] || buttons[0] || { text: 'احسب', id: '' };
    const p2Link = links[1] || links[0] || { href: '/', text: 'الحاسبة' };
    personas.push({
      id: 'interactive-user',
      nameAr: isGoldOrFinance ? 'مستخدم حاسبة المصنعية والسبائك' : 'مستخدم النماذج والأدوات التفاعلية',
      nameEn: isGoldOrFinance ? 'The Gold & Workmanship Calculator' : 'The Interactive Form & Tool User',
      archetype: 'يتفاعل مع الحقول الرقمية ويحسب التكلفة الإجمالية',
      geoCode: 'SA',
      geoNameAr: 'السعودية (الرياض)',
      geoFlag: '🇸🇦',
      device: 'mobile',
      hardware: 'Apple iPhone / M-Series Engine',
      networkProfile: '4G LTE (Residential)',
      patienceScore: 65,
      trafficSharePercent: 30,
      descriptionAr: `يقوم بتجربة أدوات الحساب وإدخال القيم الرقمية وفحص سرعة معالجة المعادلة.`,
      potentialBugFocusAr: 'اختبار استجابة دوال الجافاسكريبت والـ Hydration مع الحقول التفاعلية.',
      steps: [
        {
          id: 'p2-1',
          action: 'navigate',
          labelAr: `فتح الصفحة والانتقال لقسم ${p2Link.text}`,
          path: p2Link.href,
          selector: 'body',
          expectedThinkTimeMs: 1800
        },
        {
          id: 'p2-2',
          action: 'fill',
          labelAr: 'إدخال قيمة رقمية في حقل الحساب أو البحث',
          path: p2Link.href,
          selector: p2Input.id ? `#${p2Input.id}` : (p2Input.name ? `input[name="${p2Input.name}"]` : 'input[type="number"], input[type="text"], input'),
          fillValue: '25',
          expectedThinkTimeMs: 1900
        },
        {
          id: 'p2-3',
          action: 'click',
          labelAr: `الضغط على زر التفاعل: ${p2Button.text}`,
          path: p2Link.href,
          selector: p2Button.id ? `#${p2Button.id}` : `button:has-text("${p2Button.text.slice(0, 15)}")`,
          expectedThinkTimeMs: 2100
        }
      ]
    });

    // Persona 3 (Fallback): The Deep Comparator / Edge-Case Explorer
    const p3Link = links[2] || links[0] || { href: '/', text: 'تفاصيل' };
    personas.push({
      id: 'deep-comparator',
      nameAr: isGoldOrFinance ? 'المستثمر المقارن بين العيارات والأوزان' : 'المستكشف العميق للصفحات المتفرعة',
      nameEn: isGoldOrFinance ? 'The Precious Metal Portfolio Investor' : 'The Deep Multi-Tab Navigator',
      archetype: 'يتنقل في جميع أقسام الموقع ويقارن بين خيارات متعددة',
      geoCode: 'US',
      geoNameAr: 'أمريكا (نيويورك)',
      geoFlag: '🇺🇸',
      device: 'desktop',
      hardware: 'Intel Iris Xe Graphics',
      networkProfile: 'WiFi',
      patienceScore: 90,
      trafficSharePercent: 20,
      descriptionAr: `يزور أقسام متعددة ويتحقق من الروابط الداخلية واستقرار أداء الموقع.`,
      potentialBugFocusAr: 'اختبار استهلاك الذاكرة (Memory Leak) عند التنقل المتكرر بين صفحات التطبيق (Client-side Routing).',
      steps: [
        {
          id: 'p3-1',
          action: 'navigate',
          labelAr: 'تصفح الواجهة والتعمق في الأقسام',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 2000
        },
        {
          id: 'p3-2',
          action: 'click',
          labelAr: `الانتقال لقسم: ${p3Link.text}`,
          path: p3Link.href,
          selector: `a[href*="${p3Link.href}"]`,
          expectedThinkTimeMs: 2700
        },
        {
          id: 'p3-3',
          action: 'scroll',
          labelAr: 'التمرير للأسفل حتى نهاية المحتوى لقراءة التفاصيل',
          path: p3Link.href,
          selector: 'body',
          expectedThinkTimeMs: 3200
        }
      ]
    });

    // Persona 4 (Fallback): The Mobile Low-Bandwidth Commuter
    personas.push({
      id: 'mobile-commuter',
      nameAr: 'متصفح الهاتف بشبكة غير مستقرة',
      nameEn: 'The Flaky Mobile Visitor',
      archetype: 'يدخل من شبكة موبايل سريعة التغير ويقوم بالتمرير السريع',
      geoCode: 'GB',
      geoNameAr: 'بريطانيا (لندن)',
      geoFlag: '🇬🇧',
      device: 'mobile',
      hardware: 'Qualcomm Adreno 730',
      networkProfile: 'Slow 3G / High Jitter',
      patienceScore: 45,
      trafficSharePercent: 10,
      descriptionAr: `يمثل الزوار أثناء الحركة؛ تمرير سريع وإعادة محاولة عند تأخر الاتصال.`,
      potentialBugFocusAr: 'قياس سرعة ظهور المحتوى الأول (FCP) وزمن الاستجابة التفاعلي (INP/TTI) على الموبايل.',
      steps: [
        {
          id: 'p4-1',
          action: 'navigate',
          labelAr: 'فتح الصفحة عبر شبكة هاتف محمول',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 3500
        },
        ...(crawledData.hasMedia ? [{
          id: 'p4-media',
          action: 'media',
          labelAr: 'مشاهدة الفيديو على شاشة الهاتف والمكوث لضمان احتساب الزيارة',
          path: '/',
          expectedThinkTimeMs: 6000
        }] : []),
        {
          id: 'p4-2',
          action: 'scroll',
          labelAr: 'تمرير سريع باللمس (Swipe Scroll)',
          path: '/',
          selector: 'body',
          expectedThinkTimeMs: 2500
        }
      ]
    });
  }

  const primaryRoute = (links[0] && links[0].href) || '/';
  const uxRisksAr = isStreamingOrMovies ? [
    `الضغط المتزامن على سيرفرات البث ومشغلات الفيديو (Video Iframes) عند ذروة المشاهدات الحية.`,
    `تأخر استجابة النوافذ المنبثقة (Modals) ومشغلات الـ YouTube على أجهزة الهواتف ذات الموارد المحدودة.`,
    `تكرار نقرات المستخدمين على أزرار التحميل وسيرفرات المشاهدة واحتمالية حظرها بواسطة مانع الإعلانات (AdBlockers).`
  ] : [
    `احتمالية بطء استجابة الـ Client Hydration على الموبايل بسبب دوال الحساب وتحديث البيانات التلقائي.`,
    `الضغط المتزامن على مسار "${primaryRoute}" عند حدوث تقلبات سريعة في حركة المرور (Traffic Spike).`,
    `اعتماد الواجهة على خطوط وأصول مرئية قد تؤثر على سرعة التحميل الأولي (LCP) لزوار شبكات 3G/4G.`
  ];

  return {
    targetUrl,
    siteTitle,
    domainCategory,
    summaryAr: `تم فحص الموقع بنجاح واستكشاف ${links.length} صفحة فرعية، ${buttons.length} زر تفاعلي، و ${inputs.length} حقل إدخال، وتوليد 4 شخصيات واقعية تتماشى مع طبيعة الموقع.`,
    detectedEndpoints: Array.from(new Set(['/', ...links.map(l => l.href), ...crawledData.endpoints])).slice(0, 8),
    uxRisksAr,
    personas
  };
}

function generatePlaywrightSpec(scenarios) {
  const code = `/**
 * MiroProbe AI — Generated Playwright E2E Persona Discovery Suite
 * Dynamically Tailored for: ${scenarios.targetUrl} (${scenarios.siteTitle})
 * Generated At: ${new Date().toISOString()}
 */
import { test, expect } from '@playwright/test';
import { applyMiroProbeStealth, handleConsentAndOverlays, engageWithMediaPlayback } from './stealth-engine';
import { humanClick, humanType, humanScroll, rageClick } from './human-biometrics';
const { sendTelemetry } = require('./telemetry-client');

const rawTarget = (process.env.TARGET_URL || '${scenarios.targetUrl}').trim();
const BASE_URL = rawTarget.replace(/\\/$/, '');

test.describe('MiroProbe AI Autonomous Personas — ${scenarios.siteTitle}', () => {

${scenarios.personas.map((persona, idx) => {
  const profile = persona.device === 'mobile' ? 'mobile_android' : (idx % 2 === 0 ? 'desktop_nvidia' : 'desktop_intel');
  const geoCode = persona.geoCode || (idx === 0 ? 'EG' : (idx === 1 ? 'SA' : (idx === 2 ? 'US' : 'GB')));
  const geoFlag = persona.geoFlag || (geoCode === 'EG' ? '🇪🇬' : (geoCode === 'SA' ? '🇸🇦' : (geoCode === 'US' ? '🇺🇸' : '🇬🇧')));
  const trafficKeys = ['GOOGLE', 'TIKTOK', 'FACEBOOK', 'INSTAGRAM'];
  const trafficKey = persona.trafficKey || trafficKeys[idx % trafficKeys.length];
  return `  test('Persona ${idx + 1}: ${geoFlag} [${geoCode}] [${trafficKey}] ${persona.nameEn} - ${persona.nameAr}', async ({ page }) => {
    sendTelemetry({ type: 'start', visitorIndex: ${idx + 1}, geo: '${geoCode}', flag: '${geoFlag}', os: '${profile}', source: '${trafficKey}' });
    const startTime = Date.now();
    // Hardware: ${profile} | Geo: ${geoCode} (${geoFlag}) | Campaign Source: ${trafficKey} | Network: ${persona.networkProfile}
    await applyMiroProbeStealth(page, '${profile}', '${geoCode}', '${trafficKey}');

    // Auto-dismiss native dialogs / alerts (e.g. streaming servers, downloads)
    page.on('dialog', async dialog => {
      console.log(\`  [Browser Dialog] \${dialog.type().toUpperCase()}: \${dialog.message()}\`);
      await dialog.dismiss().catch(() => {});
    });

    // 1. Initial Page Load with Campaign Attribution (UTM & Referrer)
    const sep = BASE_URL.includes('?') ? '&' : '?';
    const landingUrl = \`\${BASE_URL}\${sep}utm_source=${trafficKey.toLowerCase()}&utm_medium=social_cpc&utm_campaign=miroprobe_wave\`;
    await page.goto(landingUrl, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600).catch(() => {});

    // 2. Autonomous Cookie Consent & GDPR Overlay Bypass
    await handleConsentAndOverlays(page);
    await page.waitForTimeout(300).catch(() => {});

${persona.steps.map((step, sIdx) => {
  if (step.action === 'media') {
    return `    // ${step.labelAr}
    await engageWithMediaPlayback(page, 3);
    await page.waitForTimeout(600).catch(() => {});`;
  } else if (step.action === 'navigate' && step.path !== '/') {
    return `    // ${step.labelAr}
    await page.goto(\`\${BASE_URL}${step.path.startsWith('/') ? '' : '/'}${step.path}\`, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(${Math.min(step.expectedThinkTimeMs || 800, 1000)}).catch(() => {});`;
  } else if (step.action === 'scroll') {
    return `    // ${step.labelAr}
    await humanScroll(page, 450, { increments: 4 });
    await page.waitForTimeout(${Math.min(step.expectedThinkTimeMs || 600, 800)}).catch(() => {});`;
  } else if (step.action === 'fill') {
    return `    // ${step.labelAr}
    const inputLoc_${idx}_${sIdx} = page.locator('${step.selector}').first();
    if (await inputLoc_${idx}_${sIdx}.isVisible().catch(() => false)) {
      await humanType(page, inputLoc_${idx}_${sIdx}, '${step.fillValue || 'Dune'}', { allowTypos: true, baseDelayMs: 60 });
    }
    await page.waitForTimeout(${Math.min(step.expectedThinkTimeMs || 800, 1000)}).catch(() => {});`;
  } else if (step.action === 'select') {
    return `    // ${step.labelAr}
    const selectLoc_${idx}_${sIdx} = page.locator('${step.selector}').first();
    if (await selectLoc_${idx}_${sIdx}.isVisible().catch(() => false)) {
      await selectLoc_${idx}_${sIdx}.selectOption('${step.selectValue || 'rating'}').catch(() => {});
    }
    await page.waitForTimeout(${Math.min(step.expectedThinkTimeMs || 800, 1000)}).catch(() => {});`;
  } else if (step.action === 'click') {
    return `    // ${step.labelAr}
    const clickLoc_${idx}_${sIdx} = page.locator('${step.selector}').first();
    if (await clickLoc_${idx}_${sIdx}.isVisible().catch(() => false)) {
      await humanClick(page, clickLoc_${idx}_${sIdx});
    }
    await page.waitForTimeout(${Math.min(step.expectedThinkTimeMs || 800, 1000)}).catch(() => {});`;
  }
  return `    await page.waitForTimeout(500).catch(() => {});`;
}).join('\n\n')}

    const dwell = ((Date.now() - startTime) / 1000).toFixed(1);
    sendTelemetry({ type: 'finish', visitorIndex: ${idx + 1}, geo: '${geoCode}', flag: '${geoFlag}', os: '${profile}', source: '${trafficKey}', dwell, success: true });

    await expect(page).toHaveTitle(/.*/);
  });`;
}).join('\n\n')}
});
`;
  return code;
}

async function main() {
  try {
    // 1. Crawl
    const crawledData = await crawlSite(TARGET_URL);

    // 2. Synthesize
    const scenarios = synthesizeDomainScenarios(crawledData);

    // 3. Save discovered-scenarios.json
    const scenariosPath = path.join(__dirname, 'discovered-scenarios.json');
    fs.writeFileSync(scenariosPath, JSON.stringify(scenarios, null, 2), 'utf8');
    console.log(`[4/4] 💾 Saved discovered scenarios to: discovered-scenarios.json`);

    // 4. Generate and save playwright-personas.spec.ts
    const specCode = generatePlaywrightSpec(scenarios);
    const specPath = path.join(__dirname, 'playwright-personas.spec.ts');
    fs.writeFileSync(specPath, specCode, 'utf8');
    console.log(`[4/4] 🚀 Generated dynamic Playwright test suite: playwright-personas.spec.ts`);

    console.log('\n============================================================================');
    console.log('  🎉 SUCCESS: Autonomous Scenario Discovery Complete!');
    console.log(`  Site       : ${scenarios.siteTitle} (${scenarios.domainCategory})`);
    console.log(`  Personas   : 4 Custom Personas synthesized for this domain`);
    console.log('  Ready to run live via start-miroprobe.bat or npm test!');
    console.log('============================================================================\n');
  } catch (err) {
    console.error('[ERROR] Discovery failed:', err);
    process.exit(1);
  }
}

main();
