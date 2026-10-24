/**
 * MiroProbe AI — Traffic Sources, Social Media Campaigns & Device Diversity Engine
 * TypeScript Definitions and Helper Module
 */

export interface TrafficSource {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  referrer: string;
  utm: string;
  weight: number;
}

export interface DeviceProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  os: 'Windows' | 'macOS' | 'iOS' | 'Android';
  icon: string;
  platform: string;
  deviceCategory: 'desktop' | 'mobile';
  userAgent: string;
  hardwareProfile: string;
  viewport: { width: number; height: number };
  isMobile: boolean;
  hasTouch?: boolean;
  weight: number;
}

export const TRAFFIC_SOURCES: Record<string, TrafficSource> = {
  FACEBOOK: {
    id: 'FACEBOOK',
    nameAr: 'إعلانات فيسبوك (Facebook Ads)',
    nameEn: 'Facebook Ads',
    icon: '📱',
    referrer: 'https://l.facebook.com/',
    utm: 'utm_source=facebook&utm_medium=cpc&utm_campaign=social_spike_2026&fbclid=IwAR2_MiroProbe',
    weight: 0.25
  },
  INSTAGRAM: {
    id: 'INSTAGRAM',
    nameAr: 'انستغرام (Instagram Stories / Reels)',
    nameEn: 'Instagram Sponsored',
    icon: '📸',
    referrer: 'https://l.instagram.com/',
    utm: 'utm_source=instagram&utm_medium=social_paid&utm_campaign=story_swipeup',
    weight: 0.25
  },
  TIKTOK: {
    id: 'TIKTOK',
    nameAr: 'حملات تيك توك الفيروسية (TikTok Ads)',
    nameEn: 'TikTok Viral Ads',
    icon: '🎵',
    referrer: 'https://www.tiktok.com/',
    utm: 'utm_source=tiktok&utm_medium=video_ad&utm_campaign=viral_pulse&ttclid=E_MiroProbe',
    weight: 0.20
  },
  GOOGLE: {
    id: 'GOOGLE',
    nameAr: 'محرك بحث جوجل (Google Search & Ads)',
    nameEn: 'Google Search / Ads',
    icon: '🔍',
    referrer: 'https://www.google.com/',
    utm: 'utm_source=google&utm_medium=organic',
    weight: 0.15
  },
  DIRECT: {
    id: 'DIRECT',
    nameAr: 'زيارات مباشرة (Direct Navigation)',
    nameEn: 'Direct Navigation',
    icon: '🌐',
    referrer: '',
    utm: '',
    weight: 0.10
  },
  TWITTER: {
    id: 'TWITTER',
    nameAr: 'منصة إكس / تويتر (X / Twitter)',
    nameEn: 'X / Twitter Feed',
    icon: '🐦',
    referrer: 'https://t.co/',
    utm: 'utm_source=twitter&utm_medium=social',
    weight: 0.05
  }
};

export const DEVICE_PROFILES: Record<string, DeviceProfile> = {
  WINDOWS_DESKTOP: {
    id: 'WINDOWS_DESKTOP',
    nameAr: 'ويندوز 11 (Windows 11 Chrome)',
    nameEn: 'Windows 11 PC (Chrome Desktop)',
    os: 'Windows',
    icon: '💻',
    platform: 'Win32',
    deviceCategory: 'desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    hardwareProfile: 'desktop_nvidia',
    viewport: { width: 1920, height: 1080 },
    isMobile: false,
    weight: 0.25
  },
  MAC_DESKTOP: {
    id: 'MAC_DESKTOP',
    nameAr: 'ماك أو إس (macOS Apple Silicon M2)',
    nameEn: 'MacBook Pro (Apple M2 Safari/Chrome)',
    os: 'macOS',
    icon: '🍏',
    platform: 'MacIntel',
    deviceCategory: 'desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    hardwareProfile: 'mac_m_series',
    viewport: { width: 1728, height: 1117 },
    isMobile: false,
    weight: 0.15
  },
  IOS_IPHONE: {
    id: 'IOS_IPHONE',
    nameAr: 'آيفون 15 برو (Apple iOS 17 Safari & In-App)',
    nameEn: 'Apple iPhone 15 Pro (iOS 17)',
    os: 'iOS',
    icon: '📱',
    platform: 'iPhone',
    deviceCategory: 'mobile',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    hardwareProfile: 'mac_m_series',
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    weight: 0.35
  },
  ANDROID_SAMSUNG: {
    id: 'ANDROID_SAMSUNG',
    nameAr: 'سامسونج جالاكسي (Android 14 Chrome & TikTok)',
    nameEn: 'Samsung Galaxy S24 (Android 14)',
    os: 'Android',
    icon: '🤖',
    platform: 'Linux armv8l',
    deviceCategory: 'mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    hardwareProfile: 'mobile_android',
    viewport: { width: 412, height: 915 },
    isMobile: true,
    hasTouch: true,
    weight: 0.25
  }
};

export function getRandomTrafficSource(filter = 'ALL'): TrafficSource {
  const normFilter = (filter || 'ALL').toUpperCase();
  if (normFilter !== 'ALL' && normFilter !== 'ALL_SOCIAL' && TRAFFIC_SOURCES[normFilter]) {
    return TRAFFIC_SOURCES[normFilter];
  }

  const rand = Math.random();
  let cumulative = 0;
  const entries = Object.values(TRAFFIC_SOURCES);
  for (const src of entries) {
    cumulative += src.weight;
    if (rand <= cumulative) {
      return src;
    }
  }
  return entries[0];
}

export function getRandomDeviceProfile(filter = 'BALANCED'): DeviceProfile {
  const normFilter = (filter || 'BALANCED').toUpperCase();

  if (normFilter === 'MOBILE_ONLY') {
    return Math.random() < 0.55 ? DEVICE_PROFILES.IOS_IPHONE : DEVICE_PROFILES.ANDROID_SAMSUNG;
  }
  if (normFilter === 'DESKTOP_ONLY') {
    return Math.random() < 0.65 ? DEVICE_PROFILES.WINDOWS_DESKTOP : DEVICE_PROFILES.MAC_DESKTOP;
  }
  if (DEVICE_PROFILES[normFilter]) {
    return DEVICE_PROFILES[normFilter];
  }

  const rand = Math.random();
  let cumulative = 0;
  const entries = Object.values(DEVICE_PROFILES);
  for (const dev of entries) {
    cumulative += dev.weight;
    if (rand <= cumulative) {
      return dev;
    }
  }
  return entries[0];
}

export function buildUrlWithUtm(baseUrl: string, trafficSource: TrafficSource): string {
  if (!trafficSource || !trafficSource.utm) {
    return baseUrl;
  }
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${trafficSource.utm}`;
}
