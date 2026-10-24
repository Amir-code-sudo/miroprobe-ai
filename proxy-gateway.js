/**
 * MiroProbe AI — Dynamic Proxy Gateway & Multi-Egress Manager
 * Provides Layer-4 IP routing, regional proxy pool failover, and auto-fallback.
 */
const fs = require('fs');
const path = require('path');

function getActiveProxyConfig(countryCode = 'ALL') {
  try {
    const configPath = path.join(__dirname, 'miroprobe-config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.proxyServer) {
        return {
          server: cfg.proxyServer,
          username: cfg.proxyUsername || undefined,
          password: cfg.proxyPassword || undefined
        };
      }
    }
  } catch (_) {}

  // Optional environment variable override
  if (process.env.PROXY_SERVER) {
    return {
      server: process.env.PROXY_SERVER,
      username: process.env.PROXY_USERNAME || undefined,
      password: process.env.PROXY_PASSWORD || undefined
    };
  }

  return null;
}

module.exports = {
  getActiveProxyConfig
};
