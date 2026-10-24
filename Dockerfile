# MiroProbe AI — Production Cloud Dockerfile
# Base: Microsoft Official Playwright with Linux Chromium dependencies
FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

# Cloud Environment Configuration (Port 7860 for Hugging Face Spaces & standard Cloud containers)
ENV PORT=7860
ENV NODE_ENV=production
ENV HEADLESS=true
ENV DOCKER=true

# Install dependencies first for Docker layer caching
COPY package*.json ./
RUN npm install

# Verify Playwright Chromium binary
RUN npx playwright install chromium

# Copy application source code
COPY . .

# Ensure full read/write permissions for Cloud container users
RUN chmod -R 777 /app

# Expose MiroProbe Web Dashboard (Port 7860 for Hugging Face / Cloud)
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http'); http.get('http://localhost:' + (process.env.PORT || 7860), (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1));"

# Launch MiroProbe SaaS Server
CMD ["node", "server.js"]
