import { defineConfig, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// MiroProbe Dynamic Proxy Gateway
let activeProxy: any = undefined;
try {
  const cfgPath = path.join(__dirname, 'miroprobe-config.json');
  if (fs.existsSync(cfgPath)) {
    const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
    if (cfg.proxyServer && cfg.proxyServer.trim() !== '') {
      activeProxy = {
        server: cfg.proxyServer.trim(),
        username: cfg.proxyUsername || undefined,
        password: cfg.proxyPassword || undefined
      };
    }
  }
} catch (_) {}

if (process.env.PROXY_SERVER) {
  activeProxy = {
    server: process.env.PROXY_SERVER.trim(),
    username: process.env.PROXY_USERNAME || undefined,
    password: process.env.PROXY_PASSWORD || undefined
  };
}

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  timeout: 90000,
  fullyParallel: true,
  retries: 1,
  reporter: 'list',
  use: {
    headless: process.env.HEADED === 'true' ? false : (process.env.HEADLESS === 'true' || process.env.CI || process.env.DOCKER === 'true' || (!process.env.DISPLAY && process.platform !== 'win32')),
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    trace: 'off',
    proxy: activeProxy,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
