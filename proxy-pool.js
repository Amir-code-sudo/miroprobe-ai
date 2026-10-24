/**
 * MiroProbe AI — Multi-Worker Proxy Rotation Engine
 * Assigns distinct IP addresses to concurrent browser workers.
 * Reads from proxies.txt or miroprobe-config.json.
 * Supports: HTTP, HTTPS, SOCKS5, Residential Proxies (with user:pass).
 */

const fs = require('fs');
const path = require('path');

const PROXIES_FILE = path.join(__dirname, 'proxies.txt');

// Ensure proxies.txt template exists
if (!fs.existsSync(PROXIES_FILE)) {
  const template = `# ============================================================================
# MiroProbe AI — Proxy Pool Configuration
# Add your HTTP or SOCKS5 proxies below (one per line).
# Formats supported:
#   ip:port
#   http://ip:port
#   http://username:password@ip:port
#   socks5://username:password@ip:port
# ============================================================================
# Example:
# http://proxy-user:secret123@us.residential-proxy.io:8080
`;
  fs.writeFileSync(PROXIES_FILE, template, 'utf8');
}

function loadProxies() {
  if (!fs.existsSync(PROXIES_FILE)) return [];
  const lines = fs.readFileSync(PROXIES_FILE, 'utf8')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const parsed = [];
  for (const line of lines) {
    try {
      if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('socks5://')) {
        const u = new URL(line);
        parsed.push({
          server: `${u.protocol}//${u.host}`,
          username: u.username || undefined,
          password: u.password || undefined
        });
      } else if (line.includes('@')) {
        const [auth, server] = line.split('@');
        const [user, pass] = auth.split(':');
        parsed.push({
          server: `http://${server}`,
          username: user,
          password: pass
        });
      } else {
        parsed.push({
          server: `http://${line}`
        });
      }
    } catch (_) {}
  }
  return parsed;
}

let proxyIndex = 0;

function getProxyForWorker(workerIndex = 0) {
  const proxies = loadProxies();
  if (proxies.length === 0) return null;

  const idx = workerIndex % proxies.length;
  return proxies[idx];
}

function getNextRotatingProxy() {
  const proxies = loadProxies();
  if (proxies.length === 0) return null;

  const p = proxies[proxyIndex % proxies.length];
  proxyIndex++;
  return p;
}

module.exports = {
  loadProxies,
  getProxyForWorker,
  getNextRotatingProxy
};
