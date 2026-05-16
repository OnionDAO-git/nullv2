/**
 * Constants governing visitor-driven resident births (the /rooms/birth ritual).
 *
 * The 24-shard total is split across three named line items in the UI cost
 * card. Keep these in sync with webapp/src/routes/rooms/birth/+page.svelte.
 */
export const BIRTH_QUICKENING = 12;
export const BIRTH_INSCRIPTION = 8;
export const BIRTH_TITHE = 4;
export const BIRTH_TOTAL_COST =
  BIRTH_QUICKENING + BIRTH_INSCRIPTION + BIRTH_TITHE;

/**
 * Seed attention given to a newborn — equal to the total shard cost, mirroring
 * v1's framing: the shards a visitor spends *become* the new resident's first
 * economic life.
 */
export const BIRTH_SEED_ATTENTION = BIRTH_TOTAL_COST;

/** Ticks the resident lives by default (~24h at 5min/tick). */
export const BIRTH_LIFESPAN_TICKS = 288;

/** Cooldown between births from the same human — gate against flooding. */
export const BIRTH_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export const EMOTION_IDS = [
  'stillness',
  'reverie',
  'unease',
  'anguish',
  'fury',
] as const;
export type EmotionId = (typeof EMOTION_IDS)[number];
export function isEmotionId(value: string): value is EmotionId {
  return (EMOTION_IDS as readonly string[]).includes(value);
}

/** Refill mechanic: visitor spends shards to top up a resident's attention. */
export const REFILL_SHARD_COST = 5;
export const REFILL_ATTENTION_GAIN = 10;
