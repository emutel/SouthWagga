/**
 * server.js
 * ─────────────────────────────────────────────────────────────
 * Railway entry point for the Warriors Dribl scraper.
 *
 * - Keeps the process alive as an HTTP server (Railway requirement)
 * - Runs the scraper on startup and on a cron schedule
 * - After each successful scrape, commits JSON cache to GitHub
 *   → GitHub push triggers Vercel rebuild automatically
 * - Also fires a Vercel deploy hook as a belt-and-braces trigger
 *
 * ENV VARS REQUIRED ON RAILWAY:
 *   DRIBL_CLUB_ID          Your club ID in Dribl (find via --discover)
 *   DRIBL_SEASON_ID        Current season ID (e.g. njdyzW6m5x)
 *   GITHUB_TOKEN           Fine-grained PAT with Contents write on emutel/SouthWagga
 *   GITHUB_REPO            emutel/SouthWagga
 *   VERCEL_DEPLOY_HOOK_URL Vercel deploy hook URL (Settings → Git → Deploy Hooks)
 *   PORT                   Set automatically by Railway
 */

const express  = require('express');
const cron     = require('node-cron');
const fetch    = require('node-fetch');
const fs       = require('fs');
const path     = require('path');
const { scrape } = require('./scraper');

const CACHE_DIR   = process.env.CACHE_DIR || path.join(__dirname, 'cache');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO  = process.env.GITHUB_REPO  || 'emutel/SouthWagga';
const DEPLOY_HOOK  = process.env.VERCEL_DEPLOY_HOOK_URL || '';

// ── HTTP SERVER ───────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (_req, res) => {
  res.json({ ok: true, scraperLastRun: global.lastRun || null });
});

// Serve cache files directly (useful for debugging)
app.get('/cache/:file', (req, res) => {
  const filePath = path.join(CACHE_DIR, req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'not found' });
  res.setHeader('Content-Type', 'application/json');
  res.send(fs.readFileSync(filePath, 'utf8'));
});

// Discovery endpoint — sets DISCOVER env var and runs scraper once
app.post('/discover', async (_req, res) => {
  if (global.scrapeRunning) return res.json({ ok: false, message: 'Scraper already running' });
  res.json({ ok: true, message: 'Discovery started — check /cache/discovery-dump.json in ~60s' });
  process.env.DRIBL_DISCOVER = 'true';
  try {
    await scrape();
  } catch (err) {
    console.error('[discover] Error:', err.message);
  } finally {
    delete process.env.DRIBL_DISCOVER;
  }
});

// Manual scrape trigger
app.post('/scrape', async (_req, res) => {
  if (global.scrapeRunning) return res.json({ ok: false, message: 'Scraper already running' });
  res.json({ ok: true, message: 'Scrape started — check /cache/fixtures.json in ~60s' });
  runScraper();
});

app.listen(PORT, () => console.log(`[server] Listening on port ${PORT}`));

// ── SCRAPE + PUBLISH ─────────────────────────────────────────
async function runScraper() {
  console.log(`[cron] Starting scrape at ${new Date().toISOString()}`);
  try {
    await scrape();
    global.lastRun = new Date().toISOString();
    console.log('[cron] Scrape complete. Committing to GitHub...');
    await commitCacheToGitHub();
    await triggerVercelDeploy();
    console.log('[cron] Done.');
  } catch (err) {
    console.error('[cron] Scrape failed:', err.message);
  }
}

// ── GITHUB COMMIT ─────────────────────────────────────────────
const CACHE_FILES = ['results.json', 'fixtures.json', 'standings.json', 'scorers.json', 'discovery-dump.json'];

async function commitCacheToGitHub() {
  if (!GITHUB_TOKEN) {
    console.warn('[github] No GITHUB_TOKEN set — skipping commit.');
    return;
  }

  const baseUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/scraper/cache`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };

  for (const filename of CACHE_FILES) {
    const localPath = path.join(CACHE_DIR, filename);
    if (!fs.existsSync(localPath)) continue;

    const content = fs.readFileSync(localPath);
    const encoded = content.toString('base64');
    const apiUrl  = `${baseUrl}/${filename}`;

    // Get current SHA (needed to update existing file)
    let sha;
    try {
      const getRes = await fetch(apiUrl, { headers });
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }
    } catch {}

    const body = {
      message: `chore: update Dribl cache [skip ci][skip railway]`,
      content: encoded,
      ...(sha ? { sha } : {}),
    };

    const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (putRes.ok) {
      console.log(`[github] Committed ${filename}`);
    } else {
      const err = await putRes.text();
      console.error(`[github] Failed to commit ${filename}:`, err.substring(0, 200));
    }
  }
}

// ── VERCEL DEPLOY HOOK ────────────────────────────────────────
async function triggerVercelDeploy() {
  if (!DEPLOY_HOOK) {
    console.warn('[vercel] No VERCEL_DEPLOY_HOOK_URL set — skipping.');
    return;
  }
  try {
    await fetch(DEPLOY_HOOK, { method: 'POST' });
    console.log('[vercel] Deploy hook triggered.');
  } catch (err) {
    console.error('[vercel] Deploy hook failed:', err.message);
  }
}

// ── SCHEDULE ─────────────────────────────────────────────────
// Every 2h on weekdays (AEST = UTC+10, so shift accordingly)
cron.schedule('0 */2 * * 1-5', runScraper, { timezone: 'Australia/Sydney' });
// Every hour Sat/Sun 8am–10pm AEST
cron.schedule('0 8-22 * * 6,0',  runScraper, { timezone: 'Australia/Sydney' });

// Run immediately on startup
runScraper();
