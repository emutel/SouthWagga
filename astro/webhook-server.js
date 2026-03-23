/**
 * webhook-server.js
 * Listens for POST /rebuild from Directus
 * Triggers astro build → copies to nginx output volume
 */
const http  = require('http');
const { execSync } = require('child_process');
const fs    = require('fs');

const PORT       = 4321;
const OUTPUT_DIR = '/output';
let   building   = false;

function rebuild() {
  if (building) {
    console.log('[webhook] Build already in progress, skipping.');
    return;
  }
  building = true;
  console.log('[webhook] Rebuild triggered...');
  try {
    execSync('npm run build --prefix /app', { stdio: 'inherit' });
    // Sync to nginx volume
    execSync(`cp -r /app/dist/. ${OUTPUT_DIR}/`, { stdio: 'inherit' });
    console.log('[webhook] Build complete ✓');
  } catch (e) {
    console.error('[webhook] Build failed:', e.message);
  } finally {
    building = false;
  }
}

// Run initial build on startup
rebuild();

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/rebuild') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, building }));
    // Debounce — wait 2s in case multiple saves fire at once
    setTimeout(rebuild, 2000);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[webhook] Listening on :${PORT}`);
});
