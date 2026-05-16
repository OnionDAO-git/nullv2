import type { FactionId } from './factions.ts';
import type { ResourceId } from './resources.ts';

export const ACHIEVEMENT_IDS = [
  // Single-faction
  'soldered_halo',
  'hatched_egg',
  'master_key',
  'signed_block',
  // Cross-faction
  'embodied_mind',
  'sealed_sandbox',
  'witnessed_vault',
  'forged_coin',
  // Civic
  'first_shard',
  'morticians_ribbon',
  'founders_stake',
] as const;

export type AchievementId = (typeof ACHIEVEMENT_IDS)[number];
export type AchievementKind = 'single_faction' | 'cross_faction' | 'civic';

export function isAchievementId(value: string): value is AchievementId {
  return (ACHIEVEMENT_IDS as readonly string[]).includes(value);
}

export interface Achievement {
  id: AchievementId;
  kind: AchievementKind;
  name: string;
  /** Factions credited when this is earned (for standing nudges + map color). */
  factions: FactionId[];
  /** Resource cost. Civic achievements have an empty recipe; granted by the embassy. */
  recipe: Partial<Record<ResourceId, number>>;
  flavor: string;
}

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  // ─── Single-faction ──────────────────────────────────────────
  soldered_halo: {
    id: 'soldered_halo',
    kind: 'single_faction',
    name: 'The Soldered Halo',
    factions: ['solder_saints'],
    recipe: { flux_drop: 3, signed_schematic: 1 },
    flavor: 'Awarded to those who made something physical work, then made it work better.',
  },
  hatched_egg: {
    id: 'hatched_egg',
    kind: 'single_faction',
    name: 'The Hatched Egg',
    factions: ['hatchery'],
    recipe: { token_crumb: 3, echo_fragment: 1 },
    flavor: 'You helped raise a mind. It might still be running. It might still remember.',
  },
  master_key: {
    id: 'master_key',
    kind: 'single_faction',
    name: 'The Master Key',
    factions: ['locksmiths'],
    recipe: { tumbler_pin: 3, master_bypass: 1 },
    flavor: 'You found a door, picked it open, and helped fix the lock behind you.',
  },
  signed_block: {
    id: 'signed_block',
    kind: 'single_faction',
    name: 'The Signed Block',
    factions: ['ledgerwrights'],
    recipe: { mempool_mote: 3, block_seal: 1 },
    flavor: 'You stood as a witness. The city will remember whether you’d like it to or not.',
  },

  // ─── Cross-faction ───────────────────────────────────────────
  embodied_mind: {
    id: 'embodied_mind',
    kind: 'cross_faction',
    name: 'The Embodied Mind',
    factions: ['solder_saints', 'hatchery'],
    recipe: { signed_schematic: 1, echo_fragment: 1 },
    flavor: 'A mind, on a board, on a desk. The Saints approve. The Hatchery is nervous.',
  },
  sealed_sandbox: {
    id: 'sealed_sandbox',
    kind: 'cross_faction',
    name: 'The Sealed Sandbox',
    factions: ['hatchery', 'locksmiths'],
    recipe: { echo_fragment: 1, master_bypass: 1 },
    flavor: 'An AI that can’t get out. An AI that probably doesn’t want to.',
  },
  witnessed_vault: {
    id: 'witnessed_vault',
    kind: 'cross_faction',
    name: 'The Witnessed Vault',
    factions: ['locksmiths', 'ledgerwrights'],
    recipe: { master_bypass: 1, block_seal: 1 },
    flavor: 'Everyone agrees the secret exists. Nobody agrees on what it is.',
  },
  forged_coin: {
    id: 'forged_coin',
    kind: 'cross_faction',
    name: 'The Forged Coin',
    factions: ['ledgerwrights', 'solder_saints'],
    recipe: { block_seal: 1, signed_schematic: 1 },
    flavor: 'A token rooted in hardware. Heavy, in every sense.',
  },

  // ─── Civic (granted by embassy, no resource cost) ────────────
  first_shard: {
    id: 'first_shard',
    kind: 'civic',
    name: 'The First Shard',
    factions: [],
    recipe: {},
    flavor: 'The city flaked off a tiny piece of itself when you arrived. It noticed you.',
  },
  morticians_ribbon: {
    id: 'morticians_ribbon',
    kind: 'civic',
    name: 'The Mortician’s Ribbon',
    factions: [],
    recipe: {},
    flavor: 'You were there at the end. Their memory got a little of you in it.',
  },
  founders_stake: {
    id: 'founders_stake',
    kind: 'civic',
    name: 'The Founder’s Stake',
    factions: [],
    recipe: {},
    flavor: 'You didn’t just visit the city. You bent its outline.',
  },
};
