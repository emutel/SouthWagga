FROM node:20-alpine

# Install Chromium + cron
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    dcron \
    su-exec

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

RUN mkdir -p /cache

# Set up cron schedule:
# - Every 2 hours normally
# - Every hour on Saturdays and Sundays (game days) from 12pm–10pm
RUN echo "0 */2 * * 1-5   CACHE_DIR=/cache /usr/bin/node /app/scraper.js >> /var/log/dribl.log 2>&1" > /etc/crontabs/root && \
    echo "0 12-22 * * 6,0  CACHE_DIR=/cache /usr/bin/node /app/scraper.js >> /var/log/dribl.log 2>&1" >> /etc/crontabs/root

# Initial run + start cron
CMD sh -c "CACHE_DIR=/cache node /app/scraper.js >> /var/log/dribl.log 2>&1 && crond -f -l 8"
