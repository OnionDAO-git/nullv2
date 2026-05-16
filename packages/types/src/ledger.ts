/**
 * Catalogs for `shard_ledger.reason`, `attention_ledger.reason`, and the
 * polymorphic `ref_kind` field shared by ledgers + letters.
 *
 * Every actual write site in `services/` is reflected here; if a new write
 * shows up that doesn't fit, extend the array rather than passing a stray
 * string literal.
 */

export const SHARD_LEDGER_REASON_IDS = [
  /** Staff scanned a visitor into a workshop. */
  'workshop_attendance',
  /** Visitor paid the birth tithe to spawn a new resident. */
  'spawn_resident',
  /** Visitor topped up a resident's attention without buying anything. */
  'refill_attention',
  /** Visitor purchased a faction resource during a chat. */
  'resource_purchase',
  /** Visitor offered Shards in a chat without requesting a resource. */
  'chat_attention',
] as const;
export type ShardLedgerReason = (typeof SHARD_LEDGER_REASON_IDS)[number];

export const ATTENTION_LEDGER_REASON_IDS = [
  /** Seed attention given at birth or via refill — flows from human to resident. */
  'mentor_gift',
  /** Attention from a chat that purchased a resource. */
  'resource_purchase',
  /** Attention from a chat without a resource request. */
  'chat_attention',
  /** -1 written every tick by the tick worker. */
  'tick_decay',
] as const;
export type AttentionLedgerReason = (typeof ATTENTION_LEDGER_REASON_IDS)[number];

/** Polymorphic pointer kind used by ledger rows and letter rows alike. */
export const REF_KIND_IDS = [
  'workshop',
  'resource',
  'resident',
  'achievement',
  'standing',
  'resident_death',
] as const;
export type RefKind = (typeof REF_KIND_IDS)[number];

export function isShardLedgerReason(value: string): value is ShardLedgerReason {
  return (SHARD_LEDGER_REASON_IDS as readonly string[]).includes(value);
}

export function isAttentionLedgerReason(value: string): value is AttentionLedgerReason {
  return (ATTENTION_LEDGER_REASON_IDS as readonly string[]).includes(value);
}

export function isRefKind(value: string): value is RefKind {
  return (REF_KIND_IDS as readonly string[]).includes(value);
}
