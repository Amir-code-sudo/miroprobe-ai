/**
 * MiroProbe AI — Anti-Bot & Fingerprinting Verification Test
 * Tests how MiroProbe Stealth & Human Biometrics bypasses bot detection mechanisms.
 */
import { test, expect } from '@playwright/test';
import { applyMiroProbeStealth } from './stealth-engine';
import { humanMove, humanClick } from './human-biometrics';

const LOCAL_SERVER = process.env.LOCAL_SERVER || 'http://localhost:3000';

test.describe('MiroProbe AI Stealth & Biometrics Verification', () => {
  test('Persona 1 (MiroProbe Stealth Enabled): Should bypass all bot checks and pass as 100% Human', async ({ page }) => {
    // 1. Apply MiroProbe Stealth Engine (RTX 3070 profile)
    await applyMiroProbeStealth(page, 'desktop_nvidia');

    // 2. Open Local Anti-Bot Audit Suite
    await page.goto(`${LOCAL_SERVER}/bot-audit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 3. Verify navigator.webdriver is undefined (not true!)
    const webdriverVal = await page.evaluate(() => navigator.webdriver);
    console.log(`[STEALTH CHECK] navigator.webdriver: ${webdriverVal}`);
    expect(webdriverVal).toBeUndefined();

    // 4. Verify WebGL Renderer is spoofed to realistic NVIDIA GPU
    const rendererVal = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl');
      if (!gl) return '';
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    });
    console.log(`[STEALTH CHECK] WebGL Renderer: ${rendererVal}`);
    expect(rendererVal).toContain('NVIDIA');

    // 5. Test Bézier Mouse Movement inside the Biometrics Canvas
    const canvas = page.locator('#mouseCanvas');
    const box = await canvas.boundingBox();
    if (box) {
      console.log('[BIOMETRICS CHECK] Performing Cubic Bézier Mouse Trajectory...');
      // Start from top-left of canvas and curve smoothly to bottom-right
      await page.mouse.move(box.x + 30, box.y + 30);
      await page.waitForTimeout(150);
      await humanMove(page, box.x + box.width - 40, box.y + box.height - 40, { steps: 35 });
      await page.waitForTimeout(800);
    }

    // 6. Verify the verdict badge says Verified Human
    const verdictText = await page.locator('#verdictBadge').textContent();
    console.log(`[FINAL VERDICT] ${verdictText}`);
    expect(verdictText).toContain('100% VERIFIED HUMAN');

    // 7. Verify Multi-Region Geo Emulation (Timezone & Locale)
    const tzVal = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log(`[GEO CHECK] Emulated Timezone: ${tzVal}`);
    expect(tzVal).toBe('Asia/Riyadh');

    await page.waitForTimeout(2000);
  });
});
