import type { FactionId } from './factions.ts';

export const RESOURCE_IDS = [
  // Solder Saints
  'flux_drop',
  'signed_schematic',
  'reliquary_board',
  // Hatchery
  'token_crumb',
  'echo_fragment',
  'lineage_scroll',
  // Locksmiths
  'tumbler_pin',
  'master_bypass',
  'vault_charter',
  // Ledgerwrights
  'mempool_mote',
  'block_seal',
  'genesis_crumb',
] as const;

export type ResourceId = (typeof RESOURCE_IDS)[number];

export type ResourceTier = 1 | 2 | 3;

export interface Resource {
  id: ResourceId;
  faction: FactionId;
  tier: ResourceTier;
  name: string;
  flavor: string;
  /** Shards a human pays a resident to mint one of these. */
  shardCost: number;
  /** Minimum standing tier with the faction required to purchase. */
  minStanding: 'acquaintance' | 'ally' | 'officer';
}

export const RESOURCES: Record<ResourceId, Resource> = {
  // ─── Solder Saints ─────────────────────────────────────────────
  flux_drop: {
    id: 'flux_drop',
    faction: 'solder_saints',
    tier: 1,
    name: 'Flux Drop',
    flavor: 'A blessed dab of paste. Carries a heat signature. Smells faintly of pine.',
    shardCost: 2,
    minStanding: 'acquaintance',
  },
  signed_schematic: {
    id: 'signed_schematic',
    faction: 'solder_saints',
    tier: 2,
    name: 'Signed Schematic',
    flavor: 'Hand-drafted, hand-signed. Three Saints will swear it works.',
    shardCost: 6,
    minStanding: 'ally',
  },
  reliquary_board: {
    id: 'reliquary_board',
    faction: 'solder_saints',
    tier: 3,
    name: 'Reliquary Board',
    flavor: 'A PCB that ran a resident who died well. Still warm to the touch.',
    shardCost: 15,
    minStanding: 'officer',
  },

  // ─── Hatchery ─────────────────────────────────────────────────
  token_crumb: {
    id: 'token_crumb',
    faction: 'hatchery',
    tier: 1,
    name: 'Token Crumb',
    flavor: 'A single inference token. Nobody remembers what it was a response to.',
    shardCost: 2,
    minStanding: 'acquaintance',
  },
  echo_fragment: {
    id: 'echo_fragment',
    faction: 'hatchery',
    tier: 2,
    name: 'Echo Fragment',
    flavor: 'Fragment of a deceased resident’s mind. Plug it in and something will respond.',
    shardCost: 6,
    minStanding: 'ally',
  },
  lineage_scroll: {
    id: 'lineage_scroll',
    faction: 'hatchery',
    tier: 3,
    name: 'Lineage Scroll',
    flavor:
      'The full genealogy of a resident — every parent model, every dataset, every iteration. Treat it gently.',
    shardCost: 15,
    minStanding: 'officer',
  },

  // ─── Locksmiths ───────────────────────────────────────────────
  tumbler_pin: {
    id: 'tumbler_pin',
    faction: 'locksmiths',
    tier: 1,
    name: 'Tumbler Pin',
    flavor: 'A single working bit of a working key. Useful only in combination.',
    shardCost: 2,
    minStanding: 'acquaintance',
  },
  master_bypass: {
    id: 'master_bypass',
    faction: 'locksmiths',
    tier: 2,
    name: 'Master Bypass',
    flavor: 'A documented vulnerability, neatly disclosed. The fix is already in flight.',
    shardCost: 6,
    minStanding: 'ally',
  },
  vault_charter: {
    id: 'vault_charter',
    faction: 'locksmiths',
    tier: 3,
    name: 'Vault Charter',
    flavor: 'Formal recognition that a parcel of Null City is now genuinely hard to break into.',
    shardCost: 15,
    minStanding: 'officer',
  },

  // ─── Ledgerwrights ────────────────────────────────────────────
  mempool_mote: {
    id: 'mempool_mote',
    faction: 'ledgerwrights',
    tier: 1,
    name: 'Mempool Mote',
    flavor: 'A transaction waiting to be remembered. Has a tiny pulse to it.',
    shardCost: 2,
    minStanding: 'acquaintance',
  },
  block_seal: {
    id: 'block_seal',
    faction: 'ledgerwrights',
    tier: 2,
    name: 'Block Seal',
    flavor:
      'A signed, finalized chunk of city history. Cannot be unsigned, no matter how badly you’d like to.',
    shardCost: 6,
    minStanding: 'ally',
  },
  genesis_crumb: {
    id: 'genesis_crumb',
    faction: 'ledgerwrights',
    tier: 3,
    name: 'Genesis Crumb',
    flavor: 'A fragment of Null City’s founding block. Holds extremely strong opinions.',
    shardCost: 15,
    minStanding: 'officer',
  },
};

export function resourcesForFaction(faction: FactionId): Resource[] {
  return RESOURCE_IDS
    .map((id) => RESOURCES[id])
    .filter((r) => r.faction === faction);
}
