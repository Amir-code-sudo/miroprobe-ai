/**
 * MiroProbe AI — PM2 Production Process Manager Configuration
 * For 24/7 continuous operation on Linux Cloud Servers (Ubuntu / Debian).
 * Run with: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'miroprobe-ai',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 3000,
        NODE_ENV: 'production',
        HEADLESS: 'true'
      }
    }
  ]
};
