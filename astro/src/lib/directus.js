/**
 * lib/directus.js
 * Shared Directus API client for Astro build-time data fetching
 */

const BASE  = import.meta.env.DIRECTUS_URL  || process.env.DIRECTUS_URL  || 'http://localhost:8055';
const TOKEN = import.meta.env.DIRECTUS_TOKEN || process.env.DIRECTUS_TOKEN || '';

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Content-Type':  'application/json',
};

async function fetchDirectus(path, params = {}) {
  const url    = new URL(`${BASE}${path}`);
  const qp     = new URLSearchParams(params);
  url.search   = qp.toString();

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    console.error(`Directus fetch failed: ${url} → ${res.status}`);
    return null;
  }
  const json = await res.json();
  return json.data ?? json;
}

// ── SITE SETTINGS ───────────────────────────────────────────
export async function getSiteSettings() {
  return fetchDirectus('/items/site_settings');
}

// ── NEWS ────────────────────────────────────────────────────
export async function getNews({ limit = 10, featured } = {}) {
  const filter = { status: { _eq: 'published' } };
  if (featured) filter.featured = { _eq: true };
  return fetchDirectus('/items/news', {
    filter: JSON.stringify(filter),
    sort:   '-date_created',
    limit,
    fields: 'id,title,slug,excerpt,hero_image,date_created,author,tags',
  });
}

export async function getNewsArticle(slug) {
  const data = await fetchDirectus('/items/news', {
    filter: JSON.stringify({ slug: { _eq: slug }, status: { _eq: 'published' } }),
    limit:  1,
    fields: '*',
  });
  return Array.isArray(data) ? data[0] : data;
}

export async function getAllNewsSlugs() {
  const data = await fetchDirectus('/items/news', {
    filter: JSON.stringify({ status: { _eq: 'published' } }),
    fields: 'slug',
  });
  return (data || []).map(n => n.slug);
}

// ── TEAMS ────────────────────────────────────────────────────
export async function getTeams() {
  return fetchDirectus('/items/teams', {
    filter: JSON.stringify({ status: { _eq: 'active' } }),
    sort:   'sort_order',
    fields: 'id,name,short_name,slug,division,season,team_photo,coach,manager,description,color_accent',
  });
}

export async function getTeam(slug) {
  const data = await fetchDirectus('/items/teams', {
    filter: JSON.stringify({ slug: { _eq: slug }, status: { _eq: 'active' } }),
    limit:  1,
    fields: '*',
  });
  return Array.isArray(data) ? data[0] : null;
}

export async function getAllTeamSlugs() {
  const data = await fetchDirectus('/items/teams', {
    filter: JSON.stringify({ status: { _eq: 'active' } }),
    fields: 'slug',
  });
  return (data || []).map(t => t.slug);
}

// ── PLAYERS ──────────────────────────────────────────────────
export async function getPlayersByTeam(teamId) {
  return fetchDirectus('/items/players', {
    filter: JSON.stringify({ team: { _eq: teamId }, status: { _eq: 'active' } }),
    sort:   'last_name',
    fields: 'id,first_name,last_name,photo,jersey_number,position,is_captain,bio',
  });
}

// ── SPONSORS ─────────────────────────────────────────────────
export async function getGlobalSponsors() {
  return fetchDirectus('/items/sponsors', {
    filter: JSON.stringify({ status: { _eq: 'active' }, is_global: { _eq: true } }),
    sort:   'tier,name',
    fields: 'id,name,logo,website,tier,description',
  });
}

export async function getTeamSponsors(teamId) {
  // Fetch via junction table
  const junctions = await fetchDirectus('/items/team_sponsors', {
    filter: JSON.stringify({ teams_id: { _eq: teamId } }),
    fields: 'sponsors_id.*',
  });
  if (!junctions) return [];
  return junctions
    .map(j => j.sponsors_id)
    .filter(s => s && s.status === 'active');
}

// ── GALLERY ──────────────────────────────────────────────────
export async function getGalleryAlbums({ limit = 20 } = {}) {
  return fetchDirectus('/items/gallery_albums', {
    filter: JSON.stringify({ status: { _eq: 'published' } }),
    sort:   '-date',
    limit,
    fields: 'id,title,date,cover_photo,description',
  });
}

export async function getAlbumPhotos(albumId) {
  return fetchDirectus('/items/gallery_photos', {
    filter: JSON.stringify({ album: { _eq: albumId } }),
    sort:   'sort',
    fields: 'id,image,caption',
  });
}

// ── ACADEMY ──────────────────────────────────────────────────
export async function getAcademyPrograms() {
  return fetchDirectus('/items/academy_programs', {
    filter: JSON.stringify({ status: { _nin: ['inactive'] } }),
    sort:   'sort',
    fields: '*',
  });
}

// ── SHOP ─────────────────────────────────────────────────────
export async function getShopItems({ category } = {}) {
  const filter = { status: { _nin: ['hidden'] } };
  if (category) filter.category = { _eq: category };
  return fetchDirectus('/items/shop_items', {
    filter: JSON.stringify(filter),
    sort:   'sort',
    fields: '*',
  });
}

// ── EVENTS ───────────────────────────────────────────────────
export async function getEvents({ upcomingOnly = true } = {}) {
  const filter = { status: { _eq: 'published' } };
  if (upcomingOnly) filter.date = { _gte: new Date().toISOString() };
  return fetchDirectus('/items/events', {
    filter: JSON.stringify(filter),
    sort:   'date',
    fields: '*',
  });
}

// ── DIRECTUS FILE URL ────────────────────────────────────────
export function fileUrl(fileId, { width, height, quality = 80, format = 'webp' } = {}) {
  if (!fileId) return null;
  const params = new URLSearchParams({ format, quality });
  if (width)  params.set('width',  width);
  if (height) params.set('height', height);
  return `${BASE}/assets/${fileId}?${params}`;
}
