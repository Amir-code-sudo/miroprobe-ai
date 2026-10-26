/**
 * MiroProbe AI — Multi-Worker Proxy Rotation Engine with Transparent SOCKS5 Bridge
 * Assigns distinct IP addresses to concurrent browser workers.
 * Reads from proxies.txt or Webshare configurations.
 * Supports: HTTP, HTTPS, SOCKS5 (with username & password).
 * 
 * SOCKS5 Authentication Bridge:
 * Chromium does not natively support username/password for SOCKS5 proxies.
 * For authenticated SOCKS5 proxies, this module automatically spins up lightweight
 * local HTTP CONNECT bridges on ephemeral ports (port: 0), enabling 100% native
 * compatibility with Playwright and Chromium without any port collisions.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const net = require('net');

const PROXIES_FILE = path.join(__dirname, 'proxies.txt');

// Store active local bridges: index -> { server, port, host }
const activeBridges = new Map();

function createSocksBridge(socksHost, socksPort, username, password) {
  function socksConnect(targetHost, targetPort, cb) {
    const s = new net.Socket();
    s.setTimeout(15000, () => {
      s.destroy();
      cb(new Error('SOCKS5 connection timeout'));
    });

    s.connect(socksPort, socksHost, () => {
      // Step 1: Greeting (VER=5, 1 Method, Method 0x02 = User/Pass)
      s.write(Buffer.from([0x05, 0x01, 0x02]));
    });

    let state = 0; // 0: greeting, 1: auth, 2: connect

    const onData = (data) => {
      if (state === 0) {
        if (data[0] === 0x05 && data[1] === 0x02) {
          state = 1;
          const uBuf = Buffer.from(username);
          const pBuf = Buffer.from(password);
          s.write(Buffer.concat([
            Buffer.from([0x01, uBuf.length]),
            uBuf,
            Buffer.from([pBuf.length]),
            pBuf
          ]));
        } else {
          s.destroy();
          cb(new Error('SOCKS5 auth negotiation failed: method rejected'));
        }
      } else if (state === 1) {
        if (data[1] === 0x00) {
          state = 2;
          const hBuf = Buffer.from(targetHost);
          const pBuf = Buffer.alloc(2);
          pBuf.writeUInt16BE(targetPort, 0);
          s.write(Buffer.concat([
            Buffer.from([0x05, 0x01, 0x00, 0x03, hBuf.length]),
            hBuf,
            pBuf
          ]));
        } else {
          s.destroy();
          cb(new Error('SOCKS5 credentials rejected'));
        }
      } else if (state === 2) {
        if (data[1] === 0x00) {
          let replyLen = 10;
          if (data[3] === 0x03) replyLen = 4 + 1 + data[4] + 2;
          else if (data[3] === 0x04) replyLen = 4 + 16 + 2;

          s.removeListener('data', onData);
          s.setTimeout(0); // clear timeout once connected
          cb(null, s, data.slice(replyLen));
        } else {
          s.destroy();
          cb(new Error(`SOCKS5 connect command failed with code ${data[1]}`));
        }
      }
    };

    s.on('data', onData);
    s.on('error', err => cb(err));
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.writeHead(405);
      res.end('MiroProbe Bridge: Use HTTP CONNECT');
    });

    server.on('connect', (req, clientSocket, head) => {
      const parts = req.url.split(':');
      const targetHost = parts[0];
      const targetPort = parseInt(parts[1] || '443', 10);

      clientSocket.pause();

      socksConnect(targetHost, targetPort, (err, socksSocket, leftover) => {
        if (err) {
          try { clientSocket.destroy(); } catch (_) {}
          return;
        }

        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n', () => {
          if (leftover && leftover.length) {
            clientSocket.write(leftover);
          }
          if (head && head.length) {
            socksSocket.write(head);
          }
          clientSocket.resume();
          socksSocket.pipe(clientSocket);
          clientSocket.pipe(socksSocket);
        });

        const closeSockets = () => {
          try { socksSocket.destroy(); } catch (_) {}
          try { clientSocket.destroy(); } catch (_) {}
        };

        socksSocket.on('error', closeSockets);
        clientSocket.on('error', closeSockets);
      });
    });

    server.on('error', reject);

    // Listen on port 0: OS dynamically assigns an available ephemeral port
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
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
      if (line.startsWith('socks5://') || line.startsWith('http://') || line.startsWith('https://')) {
        const u = new URL(line);
        parsed.push({
          type: u.protocol.replace(':', ''),
          host: u.hostname,
          port: parseInt(u.port, 10),
          username: u.username ? decodeURIComponent(u.username) : undefined,
          password: u.password ? decodeURIComponent(u.password) : undefined,
          raw: line
        });
      } else if (line.split(':').length === 4) {
        // Format: ip:port:user:pass (Webshare standard)
        const [ip, portStr, user, pass] = line.split(':');
        parsed.push({
          type: 'socks5',
          host: ip,
          port: parseInt(portStr, 10),
          username: user,
          password: pass,
          raw: `socks5://${user}:${pass}@${ip}:${portStr}`
        });
      } else if (line.includes('@')) {
        const [auth, server] = line.split('@');
        const [user, pass] = auth.split(':');
        const [host, port] = server.split(':');
        parsed.push({
          type: 'http',
          host,
          port: parseInt(port, 10),
          username: user,
          password: pass,
          raw: `http://${user}:${pass}@${server}`
        });
      } else {
        const [host, port] = line.split(':');
        parsed.push({
          type: 'http',
          host,
          port: parseInt(port || '80', 10),
          raw: `http://${line}`
        });
      }
    } catch (_) {}
  }
  return parsed;
}

let proxyIndex = 0;

/**
 * Returns a Playwright-compatible proxy object for a given worker index.
 * If the proxy is SOCKS5 with authentication, this starts an internal HTTP CONNECT
 * bridge on 127.0.0.1 and returns { server: 'http://127.0.0.1:port' }.
 */
async function getProxyForWorker(workerIndex = 0) {
  const proxies = loadProxies();
  if (proxies.length === 0) return null;

  const idx = workerIndex % proxies.length;
  const p = proxies[idx];

  // If SOCKS5 with authentication, Chromium cannot authenticate directly.
  // Spin up or reuse our internal local bridge on an ephemeral port!
  if (p.type === 'socks5' && p.username && p.password) {
    if (!activeBridges.has(idx)) {
      try {
        const server = await createSocksBridge(p.host, p.port, p.username, p.password);
        const assignedPort = server.address().port;
        activeBridges.set(idx, { server, port: assignedPort, host: p.host });
      } catch (err) {
        console.error(`[MiroProbe Bridge Error] Worker ${workerIndex} (${p.host}:${p.port}): ${err.message}`);
        return null;
      }
    }
    const bridgeInfo = activeBridges.get(idx);
    return {
      server: `http://127.0.0.1:${bridgeInfo.port}`,
      actualIp: p.host
    };
  }

  // Standard HTTP or unauthenticated SOCKS5
  return {
    server: `${p.type}://${p.host}:${p.port}`,
    username: p.username || undefined,
    password: p.password || undefined,
    actualIp: p.host
  };
}

/**
 * Rotates to the next proxy in sequence.
 */
async function getNextRotatingProxy() {
  const p = await getProxyForWorker(proxyIndex);
  proxyIndex++;
  return p;
}

function closeAllBridges() {
  for (const [idx, b] of activeBridges.entries()) {
    try {
      b.server.close();
    } catch (_) {}
  }
  activeBridges.clear();
}

// Auto-cleanup on process termination
process.on('exit', closeAllBridges);
process.on('SIGINT', () => { closeAllBridges(); process.exit(); });
process.on('SIGTERM', () => { closeAllBridges(); process.exit(); });

module.exports = {
  loadProxies,
  getProxyForWorker,
  getNextRotatingProxy,
  closeAllBridges
};
