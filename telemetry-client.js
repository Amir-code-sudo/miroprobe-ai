const http = require('http');

function sendTelemetry(eventData) {
  try {
    const postData = JSON.stringify(eventData);
    const req = http.request({
      hostname: '127.0.0.1',
      port: process.env.PORT || 3000,
      path: '/api/telemetry/event',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 1000
    });
    req.on('error', () => {});
    req.write(postData);
    req.end();
  } catch (e) {}
}

module.exports = { sendTelemetry };
