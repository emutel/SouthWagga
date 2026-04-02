/**
 * club.config.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all club-specific values.
 * Change this file (and swap /public/logo.svg) to deploy for a new club.
 *
 * SECRETS go in .env — only non-sensitive identity/branding values live here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CLUB = {

  // ── Identity ───────────────────────────────────────────────────────────────
  name:         'Riverside FC',
  shortName:    'Riverside FC',
  abbreviation: 'RFC',
  tagline:      "Grassroots football in Riverside. From Mini Roos to Seniors.",
  description:  "Grassroots football for the Riverside community. Juniors, Seniors, Women's and Social football for all.",
  heroLines:    ['Riverside', 'FC.'],

  // ── Location ───────────────────────────────────────────────────────────────
  location:          'Riverside NSW',
  homeGround:        'Memorial Park',
  homeGroundAddress: 'Memorial Park, Riverside NSW 2000',
  geo: {
    lat:  -33.87,
    lng:  151.21,
    mapEmbed: 'https://maps.google.com/maps?q=Sydney+NSW&z=15&output=embed',
  },
  academyVenue: 'Memorial Park, Riverside',

  // ── Hero title lines ───────────────────────────────────────────────────────
  heroLines: ['South', 'Wagga', 'Warriors.'],

  // ── Logo ───────────────────────────────────────────────────────────────────
  // Path to the club logo in /public. Swap file + update path to rebrand.
  logo: '/logo.png',

  // ── Demo mode ──────────────────────────────────────────────────────────────
  // Set true only for demo/showcase deployments.
  demoMode: false,

  // ── Contact ────────────────────────────────────────────────────────────────
  email: 'info@riverside-fc.com.au',

  // ── Logo ───────────────────────────────────────────────────────────────────
  // Path to the club logo file in /public. Swap file + update this path to rebrand.
  logo: '/logo.svg',

  // ── Demo mode ──────────────────────────────────────────────────────────────
  // When true, academy portals accept any credentials (blank or otherwise).
  // Set to true for demo/showcase deployments only.
  demoMode: true,

  // ── Brand colours ──────────────────────────────────────────────────────────
  // These drive CSS custom properties injected on <html> in the layouts.
  colors: {
    primary:       '#12284C',   // --green       (dark navy)
    primaryBright: '#F3BD48',   // --green-bright (gold — buttons, labels, accents)
    primaryDark:   '#080d18',   // --green-dark   (deep navy — hero backgrounds)
    gold:          '#3F96B4',   // --gold         (chalky blue — secondary accent)

    // Background / surface overrides — swap out the dark-green defaults in global.css
    offBlack: '#080d18',        // --off-black   (page background)
    card:     '#0d1829',        // --card        (card/panel background)
    border:   '#1a2d50',        // --border      (dividers, card borders)
    muted:    '#6a85a8',        // --muted       (secondary text)
  },

  // ── Competition ────────────────────────────────────────────────────────────
  competition: 'Regional Football Association',
  dribl: {
    baseUrl: 'https://dribl.com',
    label:   'dribl.com',
    teamPatterns: ['riverside fc', 'riverside'],
    clubPattern:  'riverside fc',
    teamLabel:    'Riverside FC',
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  social: {
    instagram: '@riversidefc',
  },

  // ── SEO ────────────────────────────────────────────────────────────────────
  seo: {
    titleSuffix: 'Riverside FC',
  },

  // ── Integrations ───────────────────────────────────────────────────────────
  square: {
    connected: false,
  },

  meta: {
    instagramConnected: false,
  },

  smtp: {
    fromName:  'Riverside FC',
    fromEmail: 'noreply@riverside-fc.com.au',
  },

};
