/**
 * lib/dribl.js
 * Reads the Dribl scraper cache files at build time
 */

import fs   from 'fs';
import path from 'path';

const CACHE_DIR = process.env.DRIBL_CACHE_DIR || './scraper/cache';

function readCache(filename) {
  const filePath = path.join(CACHE_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return { data: raw.data || [], cachedAt: raw.cached_at };
  } catch {
    return null;
  }
}

export function getResults({ limit = 20, division } = {}) {
  const cache = readCache('results.json');
  if (!cache) return { data: [], cachedAt: null };
  let data = cache.data.filter(r => r.is_warriors);
  if (division) data = data.filter(r =>
    (r.competition || '').toLowerCase().includes(division.toLowerCase())
  );
  return { data: data.slice(0, limit), cachedAt: cache.cachedAt };
}

export function getFixtures({ limit = 10, division } = {}) {
  const cache = readCache('fixtures.json');
  if (!cache) return { data: [], cachedAt: null };
  const today = new Date().toISOString().split('T')[0];
  let data = cache.data.filter(f => (f.date || '') >= today);
  if (division) data = data.filter(f =>
    (f.competition || '').toLowerCase().includes(division.toLowerCase())
  );
  return { data: data.slice(0, limit), cachedAt: cache.cachedAt };
}

export function getStandings() {
  const cache = readCache('standings.json');
  return cache || { data: [], cachedAt: null };
}

export function getAllResults() {
  return readCache('results.json') || { data: [], cachedAt: null };
}

export function formatScore(result) {
  if (!result) return '';
  return `${result.home_score ?? '?'} – ${result.away_score ?? '?'}`;
}

export function outcomeClass(outcome) {
  return { win: 'outcome-win', loss: 'outcome-loss', draw: 'outcome-draw' }[outcome] || '';
}
