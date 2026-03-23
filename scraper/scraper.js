#!/usr/bin/env node
/**
 * dribl-scraper.js
 * ─────────────────────────────────────────────────────────────
 * Headless Chrome scraper for fww.dribl.com
 * Intercepts the XHR/fetch calls the React SPA makes and
 * caches results as JSON for the WordPress plugin to consume.
 *
 * HOW IT WORKS:
 *   1. Launches headless Chrome via Puppeteer
 *   2. Navigates to fww.dribl.com/clubs/{clubId} (your team page)
 *   3. Intercepts all JSON API responses as the SPA loads
 *   4. Identifies fixtures, results, and standings payloads
 *   5. Writes clean JSON cache files
 *   6. WordPress plugin reads these cache files (no browser needed on WP side)
 *
 * USAGE:
 *   node dribl-scraper.js                    # run once
 *   node dribl-scraper.js --discover         # find your club/team IDs
 *
 * CRON (run every 2 hours):
 *   0 *\/2 * * * /usr/bin/node /path/to/dribl-scraper.js >> /var/log/dribl-scraper.log 2>&1
 *
 * INSTALL:
 *   npm install puppeteer
 *
 * ─────────────────────────────────────────────────────────────
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

// ── CONFIG ────────────────────────────────────────────────────
const CONFIG = {
  driblBase:    'https://fww.dribl.com',
  clubName:     'South Wagga Warriors',        // used for matching in responses
  clubId:       process.env.DRIBL_CLUB_ID || null,   // set after discovery
  teamIds:      (process.env.DRIBL_TEAM_IDS || '').split(',').filter(Boolean),
  cacheDir:     process.env.CACHE_DIR || path.join(__dirname, 'cache'),
  wpCacheDir:   process.env.WP_CACHE_DIR || '/var/www/html/wp-content/uploads/warriors-cache',
  discoverMode: process.argv.includes('--discover') || process.env.DRIBL_DISCOVER === 'true',
  timeout:      30000,
};
// ─────────────────────────────────────────────────────────────

// Ensure cache dirs exist
[CONFIG.cacheDir].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── LOGGING ───────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── WRITE CACHE ───────────────────────────────────────────────
function writeCache(filename, data) {
  const payload = {
    cached_at:   new Date().toISOString(),
    cached_unix: Math.floor(Date.now() / 1000),
    data,
  };

  // Write to local cache
  const localPath = path.join(CONFIG.cacheDir, filename);
  fs.writeFileSync(localPath, JSON.stringify(payload, null, 2));
  log(`Cached: ${localPath}`);

  // Also write to WordPress uploads dir if it exists
  if (fs.existsSync(CONFIG.wpCacheDir)) {
    const wpPath = path.join(CONFIG.wpCacheDir, filename);
    fs.writeFileSync(wpPath, JSON.stringify(payload, null, 2));
    log(`→ WP cache: ${wpPath}`);
  }
}

// ── SCRAPE ────────────────────────────────────────────────────
async function scrape() {
  log('Launching headless Chrome...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();

  // Set a real browser UA so Dribl doesn't reject us
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/121.0.0.0 Safari/537.36'
  );

  // Storage for intercepted API responses
  const intercepted = {
    fixtures:   [],
    results:    [],
    standings:  [],
    clubs:      [],
    teams:      [],
    raw:        [],      // all JSON responses for discovery
  };

  // ── INTERCEPT RESPONSES ──────────────────────────────────────
  await page.setRequestInterception(true);

  page.on('request', req => {
    // Let all requests through (we just want to observe responses)
    req.continue();
  });

  page.on('response', async (response) => {
    const url = response.url();

    // Only intercept JSON from the Dribl domain
    if (!url.includes('dribl.com')) return;

    const contentType = response.headers()['content-type'] || '';
    if (!contentType.includes('json')) return;

    try {
      const body = await response.json();

      // Store ALL for discovery mode
      if (CONFIG.discoverMode) {
        intercepted.raw.push({ url, body });
      }

      const urlLower = url.toLowerCase();

      // ── Classify the response by URL patterns ──
      // These patterns are based on common REST API conventions;
      // the actual Dribl URL structure will be revealed on first run

      if (urlLower.includes('fixture') || urlLower.includes('upcoming') || urlLower.includes('schedule')) {
        log(`  → Fixtures response from: ${url}`);
        intercepted.fixtures.push({ url, body });
      }

      if (urlLower.includes('result') || urlLower.includes('match') || urlLower.includes('score')) {
        log(`  → Results/Match response from: ${url}`);
        intercepted.results.push({ url, body });
      }

      if (urlLower.includes('standing') || urlLower.includes('ladder') || urlLower.includes('table')) {
        log(`  → Standings response from: ${url}`);
        intercepted.standings.push({ url, body });
      }

      if (urlLower.includes('club') || urlLower.includes('organisation')) {
        log(`  → Club response from: ${url}`);
        intercepted.clubs.push({ url, body });
      }

      if (urlLower.includes('team') || urlLower.includes('squad')) {
        log(`  → Team response from: ${url}`);
        intercepted.teams.push({ url, body });
      }

    } catch (e) {
      // Not valid JSON or response body unavailable — skip
    }
  });

  // ── NAVIGATE ─────────────────────────────────────────────────
  const startUrl = CONFIG.clubId
    ? `${CONFIG.driblBase}/clubs/${CONFIG.clubId}`
    : `${CONFIG.driblBase}/`;

  log(`Navigating to: ${startUrl}`);

  try {
    await page.goto(startUrl, {
      waitUntil: 'networkidle2',
      timeout:   CONFIG.timeout,
    });

    // Wait a bit more for lazy-loaded data
    await new Promise(r => setTimeout(r, 3000));

    log(`Page loaded. Intercepted ${intercepted.raw.length} JSON responses.`);

  } catch (e) {
    log(`Navigation error: ${e.message}`);
  }

  // ── DISCOVERY MODE ────────────────────────────────────────────
  if (CONFIG.discoverMode) {
    log('\n=== DISCOVERY MODE ===');
    log(`Found ${intercepted.raw.length} JSON API responses:\n`);

    intercepted.raw.forEach(({ url, body }) => {
      log(`URL: ${url}`);

      // Try to find anything that looks like a club/team name matching Warriors
      const bodyStr = JSON.stringify(body);
      if (bodyStr.toLowerCase().includes('wagga') || bodyStr.toLowerCase().includes('warriors')) {
        log('  *** CONTAINS WARRIORS/WAGGA DATA ***');
      }

      // Show structure summary
      if (Array.isArray(body)) {
        log(`  Array of ${body.length} items. First item keys: ${Object.keys(body[0] || {}).join(', ')}`);
      } else if (typeof body === 'object') {
        log(`  Object keys: ${Object.keys(body).join(', ')}`);
      }
      log('');
    });

    // Save full discovery dump
    writeCache('discovery-dump.json', intercepted.raw);
    log('\nFull dump saved to cache/discovery-dump.json');
    log('Look through it to find your club ID and API URL patterns.');
    log('Then set DRIBL_CLUB_ID and DRIBL_TEAM_IDS in your environment.\n');

    await browser.close();
    return;
  }

  // ── FETCH ALL ROUNDS VIA BROWSER (avoids server-side blocking) ─
  // Use page.evaluate() so requests come from the Chromium browser context
  // with real browser headers/cookies — same as the page itself.
  const TENANT = 'PLBdDg1Kb7';
  const SEASON = process.env.DRIBL_SEASON_ID || 'njdyzW6m5x';
  const TOTAL_ROUNDS = parseInt(process.env.DRIBL_TOTAL_ROUNDS || '18', 10);

  for (let round = 1; round <= TOTAL_ROUNDS; round++) {
    try {
      const url = `https://mc-api.dribl.com/api/fixtures?date_range=default&season=${SEASON}&type_round=roundrobin_${round}&tenant=${TENANT}&timezone=Australia/Sydney`;
      const body = await page.evaluate(async (fetchUrl) => {
        const res = await fetch(fetchUrl, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) return null;
        return res.json();
      }, url);
      if (body && body.data && body.data.length > 0) {
        intercepted.fixtures.push({ url, body });
        const sw = body.data.filter(f => JSON.stringify(f).toLowerCase().includes('south wagga'));
        log(`  → Round ${round}: ${body.data.length} total, ${sw.length} South Wagga`);
      }
    } catch (e) {
      log(`  → Round ${round} fetch failed: ${e.message}`);
    }
  }

  // ── PROCESS & NORMALISE DATA ──────────────────────────────────

  // Normalise fixtures
  const fixtures = normaliseFixtures(intercepted.fixtures);
  if (fixtures.length > 0) {
    writeCache('fixtures.json', fixtures);
    log(`Saved ${fixtures.length} fixtures.`);
  } else {
    log('No fixtures found — may need to navigate to a specific team page.');
  }

  // Normalise results
  const results = normaliseResults(intercepted.results);
  if (results.length > 0) {
    writeCache('results.json', results);
    log(`Saved ${results.length} results.`);
  }

  // Standings
  if (intercepted.standings.length > 0) {
    writeCache('standings.json', intercepted.standings.map(s => s.body));
    log(`Saved standings data.`);
  }

  // Save raw API URLs discovered (useful for direct API calls later)
  const apiUrls = [...new Set([
    ...intercepted.fixtures.map(r => r.url),
    ...intercepted.results.map(r => r.url),
    ...intercepted.standings.map(r => r.url),
  ])];

  if (apiUrls.length > 0) {
    writeCache('api-urls.json', apiUrls);
    log(`\nDiscovered API URLs:\n${apiUrls.join('\n')}`);
    log('\nOnce you have these URLs + any auth tokens, direct API calls');
    log('can replace this headless scraper entirely.\n');
  }

  await browser.close();
  log('Done.');
}

// ── NORMALISE: FIXTURES ───────────────────────────────────────
function normaliseFixtures(responses) {
  const fixtures = [];

  responses.forEach(({ body }) => {
    const items = Array.isArray(body) ? body : (body.data || body.fixtures || body.matches || []);

    items.forEach(item => {
      // Support both flat format and Dribl's JSON:API format (fields under .attributes)
      const a = item.attributes || item;

      const fixture = {
        id:           item.hash_id || item.id || item.match_id || item.fixture_id,
        date:         a.date || a.match_date || a.scheduled_at || a.kickoff,
        home_team:    a.home_team_name || a.home_team?.name || a.home?.name || a.team_home || a.home_club,
        away_team:    a.away_team_name || a.away_team?.name || a.away?.name || a.team_away || a.away_club,
        home_logo:    a.home_logo || null,
        away_logo:    a.away_logo || null,
        venue:        a.ground_name || a.venue?.name || a.ground || a.location,
        field:        a.field_name || null,
        round:        a.full_round || a.round?.name || a.round_number || a.round,
        competition:  a.competition_name || a.league_name || a.competition?.name || a.league?.name || a.division,
        status:       a.status || 'scheduled',
        home_team_id: a.home_team_hash_id || null,
        away_team_id: a.away_team_hash_id || null,
        is_warriors:  false,
      };

      // Mark Warriors games
      const teams = [fixture.home_team, fixture.away_team].join(' ').toLowerCase();
      if (teams.includes('warriors') || teams.includes('south wagga')) {
        fixture.is_warriors = true;
      }

      if (fixture.home_team || fixture.away_team) {
        fixtures.push(fixture);
      }
    });
  });

  // Sort upcoming first
  return fixtures
    .filter(f => f.is_warriors || fixtures.length < 20)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ── NORMALISE: RESULTS ────────────────────────────────────────
function normaliseResults(responses) {
  const results = [];
  const seen    = new Set();

  responses.forEach(({ body }) => {
    const items = Array.isArray(body) ? body : (body.data || body.results || body.matches || []);

    items.forEach(item => {
      // Support both flat format and Dribl's JSON:API format (fields under .attributes)
      const a = item.attributes || item;

      const id = String(item.hash_id || item.id || item.match_id || Math.random());
      if (seen.has(id)) return;
      seen.add(id);

      const homeScore = a.home_score ?? a.home_goals ?? a.score_home ?? a.home?.score;
      const awayScore = a.away_score ?? a.away_goals ?? a.score_away ?? a.away?.score;
      const homeTeam  = a.home_team_name || a.home_team?.name || a.home?.name || a.team_home;
      const awayTeam  = a.away_team_name || a.away_team?.name || a.away?.name || a.team_away;

      if (homeScore == null || awayScore == null) return;

      const teams = [homeTeam, awayTeam].join(' ').toLowerCase();
      const isWarriors  = teams.includes('warriors') || teams.includes('south wagga');
      const warriorsHome = isWarriors && (homeTeam || '').toLowerCase().includes('warriors') || (homeTeam || '').toLowerCase().includes('south wagga');

      const warriorsScore  = warriorsHome ? homeScore : awayScore;
      const opponentScore  = warriorsHome ? awayScore : homeScore;
      const opponent       = warriorsHome ? awayTeam  : homeTeam;

      let outcome = 'draw';
      if (warriorsScore > opponentScore) outcome = 'win';
      if (warriorsScore < opponentScore) outcome = 'loss';

      results.push({
        id,
        date:          a.date || a.match_date || a.played_at,
        home_team:     homeTeam,
        away_team:     awayTeam,
        home_score:    homeScore,
        away_score:    awayScore,
        home_logo:     a.home_logo || null,
        away_logo:     a.away_logo || null,
        venue:         a.ground_name || a.venue?.name || a.ground,
        round:         a.full_round || a.round?.name || a.round_number || a.round,
        competition:   a.competition_name || a.league_name || a.competition?.name || a.league?.name || a.division,
        is_warriors:   isWarriors,
        warriors_score:  isWarriors ? warriorsScore  : null,
        opponent_score:  isWarriors ? opponentScore  : null,
        opponent:        isWarriors ? opponent       : null,
        outcome:         isWarriors ? outcome        : null,
      });
    });
  });

  // Most recent first
  return results.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ── MAIN ──────────────────────────────────────────────────────
module.exports = { scrape };

if (require.main === module) {
  scrape().catch(err => {
    log(`Fatal error: ${err.message}`);
    log(err.stack);
    process.exit(1);
  });
}
