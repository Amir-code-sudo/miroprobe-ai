/**
 * MiroProbe AI — Multi-Region Geo Diversity & International Traffic Engine
 * Emulates realistic visitors across multiple countries (USA, UK, Saudi Arabia, Egypt, UAE, Germany).
 * Controls: Locale, Accept-Language, Timezone, Geolocation GPS, and Upstream IP Headers.
 */

const GEO_PROFILES = {
  SA: {
    id: 'SA',
    countryNameAr: 'المملكة العربية السعودية',
    countryNameEn: 'Saudi Arabia',
    cityNameAr: 'الرياض',
    flag: '🇸🇦',
    locale: 'ar-SA',
    languages: ['ar-SA', 'ar', 'en-US', 'en'],
    acceptLanguage: 'ar-SA,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    timezoneId: 'Asia/Riyadh',
    timezoneOffset: -180,
    latitude: 24.7136,
    longitude: 46.6753,
    sampleIp: '212.118.140.89',
    isp: 'STC (Saudi Telecom Company)',
    trafficWeight: 0.35
  },
  EG: {
    id: 'EG',
    countryNameAr: 'جمهورية مصر العربية',
    countryNameEn: 'Egypt',
    cityNameAr: 'القاهرة',
    flag: '🇪🇬',
    locale: 'ar-EG',
    languages: ['ar-EG', 'ar', 'en-US', 'en'],
    acceptLanguage: 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    timezoneId: 'Africa/Cairo',
    timezoneOffset: -180,
    latitude: 30.0444,
    longitude: 31.2357,
    sampleIp: '156.210.12.45',
    isp: 'Telecom Egypt (WE)',
    trafficWeight: 0.30
  },
  US: {
    id: 'US',
    countryNameAr: 'الولايات المتحدة الأمريكية',
    countryNameEn: 'United States',
    cityNameAr: 'نيويورك',
    flag: '🇺🇸',
    locale: 'en-US',
    languages: ['en-US', 'en'],
    acceptLanguage: 'en-US,en;q=0.9',
    timezoneId: 'America/New_York',
    timezoneOffset: 300,
    latitude: 40.7128,
    longitude: -74.0060,
    sampleIp: '104.28.19.78',
    isp: 'Cloudflare / US Residential Broadband',
    trafficWeight: 0.15
  },
  GB: {
    id: 'GB',
    countryNameAr: 'المملكة المتحدة (بريطانيا)',
    countryNameEn: 'United Kingdom',
    cityNameAr: 'لندن',
    flag: '🇬🇧',
    locale: 'en-GB',
    languages: ['en-GB', 'en-US', 'en'],
    acceptLanguage: 'en-GB,en;q=0.9,en-US;q=0.8',
    timezoneId: 'Europe/London',
    timezoneOffset: 0,
    latitude: 51.5074,
    longitude: -0.1278,
    sampleIp: '185.125.190.34',
    isp: 'BT / Virgin Media UK',
    trafficWeight: 0.10
  },
  AE: {
    id: 'AE',
    countryNameAr: 'الإمارات العربية المتحدة',
    countryNameEn: 'United Arab Emirates',
    cityNameAr: 'دبي',
    flag: '🇦🇪',
    locale: 'ar-AE',
    languages: ['ar-AE', 'ar', 'en-US', 'en'],
    acceptLanguage: 'ar-AE,ar;q=0.9,en-US;q=0.8,en;q=0.7',
    timezoneId: 'Asia/Dubai',
    timezoneOffset: -240,
    latitude: 25.2048,
    longitude: 55.2708,
    sampleIp: '94.200.10.12',
    isp: 'e& (Etisalat UAE)',
    trafficWeight: 0.05
  },
  DE: {
    id: 'DE',
    countryNameAr: 'ألمانيا (الاتحاد الأوروبي)',
    countryNameEn: 'Germany',
    cityNameAr: 'فرانكفورت',
    flag: '🇩🇪',
    locale: 'de-DE',
    languages: ['de-DE', 'de', 'en-US', 'en'],
    acceptLanguage: 'de-DE,de;q=0.9,en-US;q=0.8',
    timezoneId: 'Europe/Berlin',
    timezoneOffset: -60,
    latitude: 50.1109,
    longitude: 8.6821,
    sampleIp: '141.64.12.8',
    isp: 'Deutsche Telekom',
    trafficWeight: 0.05
  }
};

/**
 * Returns a specific Geo Profile by ISO-2 code or defaults to 'SA'
 */
function getGeoProfile(countryCode = 'SA') {
  const code = (countryCode || 'SA').toUpperCase();
  return GEO_PROFILES[code] || GEO_PROFILES.SA;
}

/**
 * Picks a random Geo Profile according to natural traffic distribution weights
 */
function getRandomGeoProfile() {
  const rand = Math.random();
  let cumulative = 0;
  const entries = Object.values(GEO_PROFILES);
  for (const profile of entries) {
    cumulative += profile.trafficWeight;
    if (rand <= cumulative) {
      return profile;
    }
  }
  return entries[0];
}

/**
 * Applies full Geo Emulation to a Playwright Page and its Browser Context
 */
async function applyGeoEmulation(page, countryCode = 'SA') {
  const geo = getGeoProfile(countryCode);

  try {
    // 1. Set Geolocation GPS Coordinates & Permissions
    const context = page.context();
    if (context && context.setGeolocation) {
      await context.setGeolocation({
        latitude: geo.latitude,
        longitude: geo.longitude,
        accuracy: 20
      }).catch(() => {});
      if (context.grantPermissions) {
        await context.grantPermissions(['geolocation']).catch(() => {});
      }
    }

    // 2. Inject Upstream Geo Headers (Compatible with CDNs and Reverse Proxies)
    await page.setExtraHTTPHeaders({
      'Accept-Language': geo.acceptLanguage,
      'X-Forwarded-For': geo.sampleIp,
      'X-Real-IP': geo.sampleIp,
      'X-Country-Code': geo.id
    }).catch(() => {});

    // 3. Inject Client-side JS Spoofs for Intl Timezone, Locale & GPS
    await page.addInitScript((g) => {
      try {
        // Spoof navigator languages & locale
        Object.defineProperty(navigator, 'language', {
          get: () => g.locale,
          configurable: true
        });
        Object.defineProperty(navigator, 'languages', {
          get: () => g.languages,
          configurable: true
        });

        // Spoof Intl.DateTimeFormat Timezone
        const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
        Intl.DateTimeFormat.prototype.resolvedOptions = function () {
          const opts = originalResolvedOptions.call(this);
          opts.timeZone = g.timezoneId;
          opts.locale = g.locale;
          return opts;
        };

        // Spoof Date.prototype.getTimezoneOffset
        Date.prototype.getTimezoneOffset = function () {
          return g.timezoneOffset;
        };

        // Spoof navigator.geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition = function (success) {
            success({
              coords: {
                latitude: g.latitude,
                longitude: g.longitude,
                accuracy: 18,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null
              },
              timestamp: Date.now()
            });
          };
        }
      } catch (_) {}
    }, geo).catch(() => {});
  } catch (_) {}

  return geo;
}

module.exports = {
  GEO_PROFILES,
  getGeoProfile,
  getRandomGeoProfile,
  applyGeoEmulation
};
