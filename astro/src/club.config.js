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
  name:         'Demo FC',
  shortName:    'Demo FC',
  abbreviation: 'DFC',
  tagline:      "Grassroots football in your community. From Mini Roos to Seniors.",
  description:  "Grassroots football for your community. Juniors, Seniors, Women's and Social football for all.",

  // ── Location ───────────────────────────────────────────────────────────────
  location:          'Your Town NSW',
  homeGround:        'Demo Park',
  homeGroundAddress: 'Demo Park, Your Town NSW 2000',
  geo: {
    lat:  -33.87,
    lng:  151.21,
    // Google Maps embed URL — update with the exact venue pin
    mapEmbed: 'https://maps.google.com/maps?q=Sydney+NSW&z=15&output=embed',
  },
  academyVenue: 'Demo Venue, Your Town',

  // ── Contact ────────────────────────────────────────────────────────────────
  email: 'info@demo-fc.com.au',

  // ── Brand colours ──────────────────────────────────────────────────────────
  // These drive CSS custom properties injected on <html> in the layouts.
  // Update to your club's colours — any valid CSS colour value works.
  colors: {
    primary:       '#1d7a3a',   // --green
    primaryBright: '#25a04c',   // --green-bright  (buttons, labels, accents)
    primaryDark:   '#0d3d1c',   // --green-dark    (hero backgrounds, cards)
    gold:          '#c9a030',   // --gold          (secondary accent, trophies, draw badge)
  },

  // ── Competition ────────────────────────────────────────────────────────────
  competition: 'Your Regional Football Association',
  dribl: {
    baseUrl: 'https://dribl.com',
    label:   'dribl.com',
    // teamPatterns: name fragments that identify your club's teams in Dribl fixture data.
    teamPatterns: ['demo fc', 'demo'],
    // clubPattern: the fragment used to detect the main club name prefix in Dribl.
    clubPattern:  'demo fc',
    // teamLabel: fallback label when the club name appears bare (no suffix).
    teamLabel:    'Demo FC',
  },

  // ── Social ─────────────────────────────────────────────────────────────────
  social: {
    instagram: '@demofc',
  },

  // ── SEO ────────────────────────────────────────────────────────────────────
  seo: {
    titleSuffix: 'Demo FC',
  },

  // ── Integrations ───────────────────────────────────────────────────────────
  square: {
    connected: false,
  },

  meta: {
    instagramConnected: false,
  },

  smtp: {
    fromName:  'Demo FC',
    fromEmail: 'noreply@demo-fc.com.au',
  },

};
