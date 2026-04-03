/**
 * club.config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all club-specific values.
 * Change this file (and swap /public/logo.png) to deploy for a new club.
 *
 * SECRETS go in .env — only non-sensitive identity/branding values live here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CLUB = {

  // ── Identity ───────────────────────────────────────────────────────────────
  name:         'South Wagga Warriors FC',
  shortName:    'Warriors FC',
  abbreviation: 'SWFC',
  tagline:      "Grassroots football in South Wagga. From Mini Roos to Seniors.",
  description:  "Grassroots football in South Wagga. Juniors, Seniors, Women's and Social football for all.",

  // ── Location ───────────────────────────────────────────────────────────────
  location:          'South Wagga NSW',
  homeGround:        'Rawlings Park',
  homeGroundAddress: 'Rawlings Park, South Wagga NSW 2650',
  geo: {
    lat:  -35.12,
    lng:  147.36,
    // Google Maps embed URL — update with the exact venue pin
    mapEmbed: 'https://maps.google.com/maps?q=Rawlings+Park+South+Wagga+NSW&z=15&output=embed',
  },
  academyVenue: 'The Showgrounds, Wagga Wagga',

  // ── Hero title lines ───────────────────────────────────────────────────────
  heroLines: ['South', 'Wagga', 'Warriors.'],

  // ── Logo ───────────────────────────────────────────────────────────────────
  // Path to the club logo in /public. Swap file + update path to rebrand.
  logo: '/logo.png',

  // ── Demo mode ──────────────────────────────────────────────────────────────
  // Set true only for demo/showcase deployments.
  demoMode: false,

  // ── Contact ────────────────────────────────────────────────────────────────
  email: 'info@southwagga.com.au',

  // ── Brand colours ──────────────────────────────────────────────────────────
  // These drive CSS custom properties injected on <html> in the layouts,
  // overriding the fallback values in global.css / portal CSS.
  colors: {
    primary:       '#1d7a3a',   // --green
    primaryBright: '#25a04c',   // --green-bright  (buttons, labels, accents)
    primaryDark:   '#0d3d1c',   // --green-dark    (hero backgrounds, cards)
    gold:          '#c9a030',   // --gold          (secondary accent, trophies, draw badge)
  },

  // ── Competition ────────────────────────────────────────────────────────────
  competition: 'Football Wagga Wiradjuri (FWW)',
  dribl: {
    baseUrl: 'https://fww.dribl.com',
    label:   'fww.dribl.com',
    // teamPatterns: used by dribl.js to identify this club's teams in fixture data.
    // Add any name fragment that appears in your club's team names in Dribl.
    teamPatterns: ['south wagga', 'warriors', 'vikings'],
    // clubPattern: the fragment used to detect the main club name prefix in Dribl.
    clubPattern:  'south wagga',
    // teamLabel: fallback label when the club name appears bare (no suffix).
    teamLabel:    'South Wagga FC',
    // clubId: set DRIBL_CLUB_ID in .env — used if/when Dribl exposes an API.
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  // facebook, instagram, youtube come from the Directus `site_settings` record
  // (so the admin can update them without a redeploy).
  // instagram.handle is also needed server-side for the gallery page template.
  social: {
    instagram: '@southwaggawarriorsfc',
  },

  // ── SEO ────────────────────────────────────────────────────────────────────
  seo: {
    titleSuffix: 'Warriors FC',  // appended to page titles that don't already include it
  },

  // ── Integrations ───────────────────────────────────────────────────────────
  // Credentials live in .env. These flags/settings are safe to commit.

  square: {
    // Set SQUARE_APP_ID, SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID in .env
    // TODO: wire up Square OAuth + product/cart/checkout pages
    connected: false,
  },

  meta: {
    // Set META_APP_ID, INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_USER_ID in .env
    // TODO: implement Meta OAuth flow and gallery photo fetching
    instagramConnected: false,
  },

  smtp: {
    // Set SMTP2GO_API_KEY in .env
    // TODO: build email notification workflows (enrollment, messages, academy)
    fromName:  'South Wagga Warriors FC',
    fromEmail: 'noreply@southwagga.com.au',
  },

};
