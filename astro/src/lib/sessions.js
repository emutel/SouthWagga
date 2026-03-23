/**
 * lib/sessions.js
 * Static coaching session data — provides the same API as directus.js
 * so coaching pages work fully without CMS content.
 */

import { sessions_u5u7 }   from './sessions_u5u7.js';
import { sessions_u8u11 }  from './sessions_u8u11.js';
import { sessions_u12u13 } from './sessions_u12u13.js';
import { sessions_u14u16 } from './sessions_u14u16.js';
import { sessions_senior } from './sessions_senior.js';

const ALL_SESSIONS = [
  ...sessions_u5u7,
  ...sessions_u8u11,
  ...sessions_u12u13,
  ...sessions_u14u16,
  ...sessions_senior,
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
  // For older groups (u14/senior) that have both 'technical' and 'unit_game':
  //   technical  → positioning slot  (focused drill)
  //   unit_game  → game_training slot (conditioned game)
  //   game_training → training_game slot (culminating 11v11)
  const hasTechAndUnit = !!(p.technical && p.unit_game);
  const welcome    = p.welcome    || p.activation || {};
  const warmup     = p.warmup     || {};
  const pos        = p.positioning_game
    || (hasTechAndUnit ? p.technical : p.unit_game)
    || p.positioning
    || {};
  const gameTraining = hasTechAndUnit
    ? p.unit_game
    : (p.game_training || p.technical || {});
  const trainingGame = hasTechAndUnit
    ? (p.game_training || p.main_game || p.big_game || p.training_game || {})
    : (p.big_game || p.main_game || p.training_game || {});
  const warmdown   = p.warmdown   || {};

  return {
    ...s,
    age_label:    AGE_LABELS[s.age_group] || s.age_label || s.age_group,
    objectives:   arr(s.objectives),
    equipment:    arr(s.equipment),
    phase_welcome_notes:               welcome.description || null,
    phase_warmup_title:                warmup.title || null,
    phase_warmup_description:          warmup.description || null,
    phase_warmup_activities:           arr(warmup.activities),
    phase_warmup_setup:                warmup.setup || null,
    phase_warmup_coaching_points:      warmup.coaching_points || null,
    phase_warmup_progressions:         arr(warmup.progressions),
    phase_positioning_title:           pos.title || null,
    phase_positioning_description:     pos.description || null,
    phase_positioning_setup:           pos.setup || null,
    phase_positioning_coaching_points: pos.coaching_points || null,
    phase_positioning_progressions:    arr(pos.progressions),
    phase_positioning_rules:           arr(pos.rules),
    phase_game_training_title:         gameTraining.title || null,
    phase_game_training_description:   gameTraining.description || null,
    phase_game_training_setup:         gameTraining.setup || null,
    phase_game_training_coaching_points: gameTraining.coaching_points || null,
    phase_game_training_progressions:  arr(gameTraining.progressions),
    phase_game_training_rules:         arr(gameTraining.rules),
    phase_training_game_title:         trainingGame.title || null,
    phase_training_game_description:   trainingGame.description || null,
    phase_training_game_rules:         arr(trainingGame.rules),
    phase_training_game_coaching_points: trainingGame.coaching_points || null,
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
