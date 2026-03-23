FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g astro

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build the site initially
RUN npm run build

# ── RUNTIME: serve static output + webhook listener ──────────
FROM node:20-alpine AS runtime
WORKDIR /app

RUN npm install -g serve

COPY --from=base /app/dist /output
COPY --from=base /app /app

# Simple webhook server that triggers a rebuild
COPY webhook-server.js /webhook-server.js

EXPOSE 4321

CMD ["node", "/webhook-server.js"]
