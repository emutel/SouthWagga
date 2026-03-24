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

// Derive a short Warriors team label from a fixture (e.g. "Warriors", "Vikings", "Women's 1st Grade")
function getWarriorsTeamLabel(fixture) {
  const candidates = [
    { name: fixture.home_team, id: fixture.home_team_id },
    { name: fixture.away_team, id: fixture.away_team_id },
  ];
  for (const { name } of candidates) {
    const n = (name || '').toLowerCase();
    if (!n.includes('south wagga') && !n.includes('warriors') && !n.includes('vikings')) continue;
    if (n.includes('south wagga')) {
      const suffix = (name || '')
        .replace(/south wagga football club\s*/i, '')
        .trim();
      if (suffix.toLowerCase().includes('women') || suffix.toLowerCase().includes('female')) {
        if (suffix.toLowerCase().includes('1st') || suffix.toLowerCase().includes('leonard')) return "Women's 1st Grade";
        if (suffix.toLowerCase().includes('2nd') || suffix.toLowerCase().includes('madden'))  return "Women's 2nd Grade";
        return "Women's Team";
      }
      if (suffix) return suffix;  // e.g. "Warriors", "Vikings"
      return 'South Wagga FC';    // bare club name
    }
  }
  return null;
}

export function getFixtures({ limit = 300, division, teamId } = {}) {
  const cache = readCache('fixtures.json');
  if (!cache) return { data: [], cachedAt: null };
  const today = new Date().toISOString().split('T')[0];
  let data = cache.data
    .filter(f => (f.date || '') >= today)
    .map(f => ({ ...f, warriors_team: getWarriorsTeamLabel(f) }));
  if (division) data = data.filter(f =>
    f.warriors_team?.toLowerCase().includes(division.toLowerCase()) ||
    (f.competition || '').toLowerCase().includes(division.toLowerCase())
  );
  if (teamId) data = data.filter(f =>
    f.home_team_id === teamId || f.away_team_id === teamId
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
