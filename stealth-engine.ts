/**
 * MiroProbe AI — Stealth & Anti-Fingerprinting Engine
 * Defeats modern WAF / Anti-Bot platforms (Cloudflare Turnstile, Datadome, Akamai, Imperva)
 * Spoofs: Canvas, WebGL, AudioContext, navigator.webdriver, Hardware Concurrency, TLS & Screen.
 */
import { Page, BrowserContext } from '@playwright/test';
import { applyGeoEmulation, getGeoProfile } from './geo-engine';
import { getRandomTrafficSource, TRAFFIC_SOURCES, TrafficSource } from './traffic-sources';

export interface HardwareProfile {
  vendor: string;
  renderer: string;
  hardwareConcurrency: number;
  deviceMemory: number;
  platform: string;
  languages: string[];
  screenResolution: { width: number; height: number };
}

export const REALISTIC_PROFILES: Record<string, HardwareProfile> = {
  desktop_nvidia: {
    vendor: 'Google Inc. (NVIDIA)',
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    hardwareConcurrency: 12,
    deviceMemory: 16,
    platform: 'Win32',
    languages: ['ar-EG', 'ar', 'en-US', 'en'],
    screenResolution: { width: 1920, height: 1080 }
  },
  desktop_intel: {
    vendor: 'Google Inc. (Intel)',
    renderer: 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    platform: 'Win32',
    languages: ['ar', 'en-US', 'en'],
    screenResolution: { width: 1536, height: 864 }
  },
  mac_m_series: {
    vendor: 'Apple Inc.',
    renderer: 'Apple M2 Pro',
    hardwareConcurrency: 10,
    deviceMemory: 16,
    platform: 'MacIntel',
    languages: ['en-US', 'en', 'ar'],
    screenResolution: { width: 1728, height: 1117 }
  },
  mobile_android: {
    vendor: 'Qualcomm',
    renderer: 'Adreno (TM) 730',
    hardwareConcurrency: 8,
    deviceMemory: 8,
    platform: 'Linux armv8l',
    languages: ['ar-EG', 'ar', 'en'],
    screenResolution: { width: 412, height: 915 }
  }
};

/**
 * Injects low-level stealth script into the browser context BEFORE any page script loads.
 */
export async function applyMiroProbeStealth(
  page: Page,
  profileKey: keyof typeof REALISTIC_PROFILES = 'desktop_nvidia',
  geoKey: string = 'SA',
  trafficSourceKey?: string
): Promise<TrafficSource> {
  const profile = REALISTIC_PROFILES[profileKey] || REALISTIC_PROFILES.desktop_nvidia;
  const trafficSource = trafficSourceKey && TRAFFIC_SOURCES[trafficSourceKey.toUpperCase()]
    ? TRAFFIC_SOURCES[trafficSourceKey.toUpperCase()]
    : getRandomTrafficSource();

  // 1. Apply Multi-Region Geo Emulation (Locale, GPS Geolocation, Timezone, and Upstream IP headers)
  await applyGeoEmulation(page, geoKey);

  // 2. Set Social Media Referrer Header if applicable
  if (trafficSource && trafficSource.referrer) {
    await page.setExtraHTTPHeaders({
      'Referer': trafficSource.referrer
    }).catch(() => {});
  }

  await page.addInitScript(({ prof, ref }) => {
    // 0. Spoof document.referrer (Social / Search campaign attribution)
    if (ref) {
      try {
        Object.defineProperty(document, 'referrer', {
          get: () => ref,
          configurable: true
        });
      } catch (_) {}
    }

    // 1. Strip navigator.webdriver (Standard Playwright/Puppeteer tell)
    try {
      const newProto = Object.getPrototypeOf(navigator);
      delete (newProto as any).webdriver;
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
    } catch (_) {}

    // 2. Spoof Hardware Concurrency & Device Memory
    try {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => prof.hardwareConcurrency,
        configurable: true
      });
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => prof.deviceMemory,
        configurable: true
      });
      Object.defineProperty(navigator, 'platform', {
        get: () => prof.platform,
        configurable: true
      });
      Object.defineProperty(navigator, 'languages', {
        get: () => prof.languages,
        configurable: true
      });
    } catch (_) {}

    // 3. Emulate window.chrome (Present in real Chrome, absent in naive bots)
    try {
      if (!(window as any).chrome) {
        (window as any).chrome = {
          app: { isInstalled: false, InstallState: { DISABLED: 'disabled' }, RunningState: { CANNOT_RUN: 'cannot_run' } },
          runtime: {
            OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update' },
            PlatformOs: { MAC: 'mac', WIN: 'win', ANDROID: 'android', CROS: 'cros', LINUX: 'linux', OPENBSD: 'openbsd' }
          },
          loadTimes: function () {},
          csi: function () {}
        };
      }
    } catch (_) {}

    // 4. Spoof WebGL Vendor and Renderer (Eliminates SwiftShader/llvmpipe bot signatures)
    const getParameterProxy = function (this: any, param: number) {
      // UNMASKED_VENDOR_WEBGL (0x9245)
      if (param === 37445) {
        return prof.vendor;
      }
      // UNMASKED_RENDERER_WEBGL (0x9246)
      if (param === 37446) {
        return prof.renderer;
      }
      return this.__origGetParameter(param);
    };

    try {
      if ((window as any).WebGLRenderingContext) {
        const proto = (window as any).WebGLRenderingContext.prototype;
        if (!proto.__origGetParameter) {
          proto.__origGetParameter = proto.getParameter;
          proto.getParameter = getParameterProxy;
        }
      }
      if ((window as any).WebGL2RenderingContext) {
        const proto2 = (window as any).WebGL2RenderingContext.prototype;
        if (!proto2.__origGetParameter) {
          proto2.__origGetParameter = proto2.getParameter;
          proto2.getParameter = getParameterProxy;
        }
      }
    } catch (_) {}

    // 5. Canvas Micro-Noise Injection (Defeats Canvas Hash Fingerprinting)
    // Injects an imperceptible +/- 0.0001 perturbation to pixel RGBA channels
    try {
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;

      HTMLCanvasElement.prototype.toDataURL = function (...args) {
        const context = this.getContext('2d');
        if (context) {
          try {
            const shift = (Math.random() - 0.5) * 0.001;
            context.fillStyle = `rgba(255,255,255,${0.0001 + Math.abs(shift)})`;
            context.fillRect(0, 0, 1, 1);
          } catch (_) {}
        }
        return origToDataURL.apply(this, args);
      };

      CanvasRenderingContext2D.prototype.getImageData = function (...args) {
        const imgData = origGetImageData.apply(this, args);
        // Slightly perturb single pixel channel to ensure non-identical hash across bots
        if (imgData.data.length > 4) {
          imgData.data[0] = (imgData.data[0] ^ 1);
        }
        return imgData;
      };
    } catch (_) {}

    // 6. AudioContext Fingerprint Perturbation
    try {
      const origGetChannelData = AudioBuffer.prototype.getChannelData;
      AudioBuffer.prototype.getChannelData = function (channel: number) {
        const data = origGetChannelData.call(this, channel);
        for (let i = 0; i < Math.min(data.length, 10); i++) {
          data[i] += (Math.random() - 0.5) * 0.0000001;
        }
        return data;
      };
    } catch (_) {}

    // 7. Permissions Query Mocking (Avoids 'prompt' / 'denied' leak)
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const origQuery = navigator.permissions.query;
        navigator.permissions.query = function (parameters: any) {
          if (parameters.name === 'notifications') {
            return Promise.resolve({
              state: 'denied',
              name: 'notifications',
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false
            } as any);
          }
          return origQuery.apply(this, arguments as any);
        };
      }
    } catch (_) {}
  }, { prof: profile, ref: trafficSource ? trafficSource.referrer : '' });

  return trafficSource;
}

/**
 * MiroProbe AI — Smart Consent & Overlay Bypass Engine
 * Automatically detects and dismisses Cookie Banners, GDPR Consents, and Modal Overlays
 * across languages (Arabic, English, German, French) to unlock interactive page elements.
 */
export async function handleConsentAndOverlays(page: Page): Promise<boolean> {
  try {
    // 1. Try Playwright Native Pointer Clicks on Known Cookie & Consent Selectors
    const candidateSelectors = [
      'button:has-text("Allow all cookies")',
      'button:has-text("Alle Cookies erlauben")',
      'button:has-text("Allow all")',
      'button:has-text("Accept all")',
      'button:has-text("Accept cookies")',
      'button:has-text("قبول الكل")',
      'button:has-text("الموافقة على الكل")',
      'button:has-text("موافق")',
      'button:has-text("Zustimmen")',
      'button:has-text("Accepter tout")'
    ];

    for (const selector of candidateSelectors) {
      const loc = page.locator(selector).first();
      if (await loc.isVisible({ timeout: 600 }).catch(() => false)) {
        await loc.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(1000);
        return true;
      }
    }

    // 2. Fallback to DOM Evaluation
    const clickedText = await page.evaluate(() => {
      const keywords = [
        'alle cookies erlauben', 'allow all cookies', 'accept all', 'accept cookies',
        'agree', 'i agree', 'zustimmen', 'akzeptieren', 'قبول الكل', 'الموافقة على الكل',
        'موافق', 'سماح', 'got it', 'dismiss', 'schließen', 'close', 'accepter tout'
      ];

      // Check all buttons
      const buttons = Array.from(document.querySelectorAll('button, a, div[role="button"]'));
      for (const btn of buttons) {
        const text = (btn.textContent || '').trim().toLowerCase();
        if (keywords.some(k => text.includes(k))) {
          (btn as HTMLElement).click();
          return text;
        }
      }

      // Check common cookie IDs / classes
      const selectors = [
        '[id*="cookie"] button', '[class*="cookie"] button',
        '[aria-label*="cookie" i]', '[data-testid*="cookie" i]',
        'button[class*="accept" i]', 'button[id*="accept" i]'
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el && typeof el.click === 'function') {
          el.click();
          return sel;
        }
      }
      return null;
    });

    if (clickedText) {
      await page.waitForTimeout(1000);
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * MiroProbe AI — Media Playback & Rich Engagement Simulator
 * Detects HTML5 video/audio elements (Reels, TikToks, YouTube embeds, streaming media),
 * activates playback, simulates human watch loops, sound toggling, and comment exploration.
 */
export async function engageWithMediaPlayback(page: Page, minSeconds: number = 8): Promise<{ played: boolean, seconds: number }> {
  try {
    const hasMedia = await page.evaluate(() => !!document.querySelector('video, audio'));
    if (!hasMedia) return { played: false, seconds: 0 };

    // 1. Scroll media into view and trigger play
    await page.evaluate(() => {
      const v = document.querySelector('video') as HTMLVideoElement | null;
      if (v) {
        v.scrollIntoView({ behavior: 'smooth', block: 'center' });
        v.muted = true; // Avoid browser autoplay restriction
        if (v.paused) {
          v.play().catch(() => {});
        }
      }
    });

    // 2. Human mouse interaction over the video canvas
    await page.mouse.move(250 + Math.random() * 100, 300 + Math.random() * 100, { steps: 8 }).catch(() => {});
    await page.waitForTimeout(2000);

    // 3. Try to click mute/unmute toggle or caption to simulate engagement
    const soundToggle = page.locator('button[aria-label*="Audio"], button[aria-label*="Sound"], svg[aria-label*="Audio"]').first();
    if (await soundToggle.isVisible({ timeout: 500 }).catch(() => false)) {
      await soundToggle.click().catch(() => {});
    }

    // 4. Human watch duration (e.g. 8 to 14 seconds)
    const watchDuration = Math.max(minSeconds, 8);
    await page.waitForTimeout(watchDuration * 1000);

    // 5. Try exploring comments or metadata
    const commentBtn = page.locator('svg[aria-label*="Comment"], svg[aria-label*="تعليق"], [aria-label*="Comments"]').first();
    if (await commentBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await commentBtn.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    const playedTime = await page.evaluate(() => {
      const v = document.querySelector('video') as HTMLVideoElement | null;
      return v ? v.currentTime : 0;
    });

    return { played: playedTime > 0, seconds: Math.round(playedTime) };
  } catch (_) {
    return { played: false, seconds: 0 };
  }
}
