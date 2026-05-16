/**
 * SPARK — autonomy framework ported from v1 (see landing-2026/null-wiki/reference/spark-framework.md).
 *
 * v1 specified a four-tier Maslow-inspired hierarchy (hunger / safety /
 * social / purpose) but left the numeric formulas vague. This module
 * commits to concrete formulas so the tick worker + webapp can render
 * needs deterministically. Everything is pure — callers fetch the inputs
 * (resident state, recent activity) and pass them in. No DB.
 *
 * Pressure scale: 0..100. Higher = more pressing.
 * "Urgent" threshold: PRESSURE_URGENT (60). At or above, the resident is
 * agitated enough that this need dominates deliberation.
 */

export const NEED_IDS = ['hunger', 'safety', 'social', 'purpose'] as const;
export type NeedId = (typeof NEED_IDS)[number];

/** Priority order for tie-breaks. Earlier wins. */
export const NEED_PRIORITY: NeedId[] = ['hunger', 'safety', 'social', 'purpose'];

export const PRESSURE_URGENT = 60;

/** Tick budget for "recent". Anything older than this is treated as forgotten. */
export const RECENT_TICKS_WINDOW = 12;

/** Per-tick decay of social calm — climbs by this when nobody is talking to the resident. */
export const SOCIAL_PRESSURE_PER_QUIET_TICK = 10;

/** Per-tick climb of purpose pressure when goals are defined and no goal-relevant action is happening. */
export const PURPOSE_PRESSURE_PER_TICK = 3;

/** Safety pressure per nearby death in window. Stacks linearly, caps at 100. */
export const SAFETY_PRESSURE_PER_DEATH = 30;

/** Attention level below which hunger climbs sharply. */
export const HUNGER_ATTENTION_KNEE = 30;

export interface NeedsInput {
  attentionBalance: number;
  lifespanTicksRemaining: number;
  goals: string;
  /** Timestamp of the most recent line involving this resident (chat or shout). */
  lastInteractionAt: Date | null;
  /** How many residents in this room have died inside RECENT_TICKS_WINDOW. */
  recentDeathsInRoom: number;
  /** Tick interval the city is running at, used to convert wall-clock to tick distance. */
  tickIntervalMs: number;
  /** "Now" for testing. */
  now?: Date;
}

export interface NeedsSnapshot {
  pressures: Record<NeedId, number>;
  dominant: NeedId;
  urgent: boolean;
  /** How "alive" the resident is — sum / 4. 0..100. Drives ambient speak probability. */
  agitation: number;
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

function ticksBetween(a: Date, b: Date | null, tickMs: number): number {
  if (!b) return 999;
  const dt = a.getTime() - b.getTime();
  if (dt <= 0) return 0;
  return Math.floor(dt / tickMs);
}

/**
 * Compute the four pressures + dominant need.
 *
 *  hunger  = max(100 - attention, life_stress)
 *            (life_stress = 100 - lifespan_remaining, when remaining < 100)
 *  safety  = recent_deaths_in_room * SAFETY_PRESSURE_PER_DEATH (cap 100)
 *  social  = ticks_since_interaction * SOCIAL_PRESSURE_PER_QUIET_TICK (cap 100)
 *  purpose = (has_goals ? 30 : 0) + ticks_since_interaction * PURPOSE_PRESSURE_PER_TICK - 20 (cap 0..100)
 *
 * Dominant rule:
 *   1. Find the highest-priority need that is urgent (>= PRESSURE_URGENT).
 *   2. If none urgent, pick the need with the highest pressure;
 *      priority order breaks ties.
 */
export function computeNeeds(input: NeedsInput): NeedsSnapshot {
  const now = input.now ?? new Date();

  // Hunger
  const attentionGap = 100 - clamp(input.attentionBalance, 0, 100);
  const lifeStress = Math.max(0, 100 - clamp(input.lifespanTicksRemaining, 0, 100));
  // Knee: amplify attention gap once attention is low.
  const hungerAmp = input.attentionBalance < HUNGER_ATTENTION_KNEE ? 20 : 0;
  const hunger = clamp(Math.max(attentionGap, lifeStress) + hungerAmp, 0, 100);

  // Safety
  const safety = clamp(input.recentDeathsInRoom * SAFETY_PRESSURE_PER_DEATH, 0, 100);

  // Social
  const ticksQuiet = ticksBetween(now, input.lastInteractionAt, input.tickIntervalMs);
  const social = clamp(ticksQuiet * SOCIAL_PRESSURE_PER_QUIET_TICK, 0, 100);

  // Purpose
  const hasGoals = input.goals.trim().length > 0;
  const purpose = hasGoals
    ? clamp(30 + ticksQuiet * PURPOSE_PRESSURE_PER_TICK - 20, 0, 100)
    : 0;

  const pressures: Record<NeedId, number> = {
    hunger,
    safety,
    social,
    purpose,
  };

  const dominant = pickDominant(pressures);
  const urgent = pressures[dominant] >= PRESSURE_URGENT;
  const agitation = clamp(
    Math.round((hunger + safety + social + purpose) / 4),
    0,
    100,
  );

  return { pressures, dominant, urgent, agitation };
}

function pickDominant(pressures: Record<NeedId, number>): NeedId {
  // First urgent in priority order.
  for (const id of NEED_PRIORITY) {
    if (pressures[id] >= PRESSURE_URGENT) return id;
  }
  // Otherwise highest absolute, priority breaks ties.
  let best: NeedId = 'hunger';
  for (const id of NEED_PRIORITY) {
    if (pressures[id] > pressures[best]) best = id;
  }
  return best;
}

/**
 * Probability the resident speaks this tick, given current agitation.
 * Baseline 10% rises toward ~60% as agitation hits 100.
 */
export function ambientSpeakProbability(agitation: number): number {
  return clamp(0.1 + agitation / 200, 0, 1);
}

/** Short human-facing description of why this need is loud. Used in prompts + UI tooltips. */
export const NEED_BLURB: Record<NeedId, string> = {
  hunger: 'attention is thinning. they fear going still.',
  safety: 'the room has lost residents lately. they are watchful.',
  social: 'nobody has spoken to them. the silence is loud.',
  purpose: 'their goals are unfinished. they feel the unfinishedness.',
};
