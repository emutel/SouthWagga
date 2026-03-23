/**
 * lib/sessions.js
 * Static coaching session data — provides the same API as directus.js
 * so coaching pages work fully without CMS content.
 */

import { sessions_u5u7 }   from './sessions_u5u7.js';
import { sessions_u8u11 }  from './sessions_u8u11.js';
import { sessions_u12u13 } from './sessions_u12u13.js';
import { sessions_u14u16 } from './sessions_u14u16.js';
// sessions_senior added when file is ready

const ALL_SESSIONS = [
  ...sessions_u5u7,
  ...sessions_u8u11,
  ...sessions_u12u13,
  ...sessions_u14u16,
];

// Map agent age_group keys → page display labels
const AGE_LABELS = {
  'u5-u7':   'MiniRoos 5–7',
  'u8-u11':  'MiniRoos 8–11',
  'u12-u13': 'Youth U12–U13',
  'u14-u16': 'Youth U14–U16',
  'senior':  'Senior / U17–U18',
};

/** Convert nested agent format → flat Directus-compatible shape */
function normalise(s) {
  const p = s.phases || {};
  const arr = (v) => Array.isArray(v) ? v.join('\n') : (v || null);

  // Phase descriptions — handle different phase name conventions
  const welcome    = p.welcome    || p.activation || {};
  const warmup     = p.warmup     || {};
  const pos        = p.positioning_game || p.unit_game || p.positioning || {};
  const gameTraining = p.game_training || p.technical || {};
  const trainingGame = p.big_game || p.main_game || p.training_game || {};
  const warmdown   = p.warmdown   || {};

  return {
    ...s,
    age_label:    AGE_LABELS[s.age_group] || s.age_label || s.age_group,
    objectives:   arr(s.objectives),
    equipment:    arr(s.equipment),
    phase_welcome_notes:               welcome.description || null,
    phase_warmup_description:          [warmup.title, warmup.description, arr(warmup.activities)].filter(Boolean).join('\n\n') || null,
    phase_warmup_coaching_points:      arr(warmup.coaching_points),
    phase_warmup_progressions:         arr(warmup.progressions),
    phase_positioning_description:     [pos.title, pos.description].filter(Boolean).join('\n\n') || null,
    phase_positioning_coaching_points: arr(pos.coaching_points),
    phase_positioning_progressions:    arr(pos.progressions),
    phase_game_training_description:   [gameTraining.title, gameTraining.description].filter(Boolean).join('\n\n') || null,
    phase_game_training_coaching_points: arr(gameTraining.coaching_points),
    phase_game_training_progressions:  arr(gameTraining.progressions),
    phase_training_game_description:   [trainingGame.title, trainingGame.description].filter(Boolean).join('\n\n') || null,
    phase_training_game_rules:         arr(trainingGame.rules),
    phase_training_game_coaching_points: arr(trainingGame.coaching_points),
    phase_warmdown_notes:              warmdown.description || null,
  };
}

const SESSIONS = ALL_SESSIONS.map(normalise);

export function getSessionPlans({ ageGroup, theme, limit = 200 } = {}) {
  let data = SESSIONS;
  if (ageGroup) data = data.filter(s => s.age_group === ageGroup);
  if (theme)    data = data.filter(s => s.theme === theme);
  return data.slice(0, limit);
}

export function getSessionPlan(slug) {
  return SESSIONS.find(s => s.slug === slug) || null;
}

export function getAllSessionPlanSlugs() {
  return SESSIONS.map(s => s.slug);
}
