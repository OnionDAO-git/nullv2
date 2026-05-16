import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import type {
  AttentionLedgerReason,
  RefKind,
  ResourceId,
  ShardLedgerReason,
} from '@nullv2/types';
import { humans } from './humans.ts';
import { residents } from './residents.ts';

/** Append-only audit log of every shard movement (earn or spend). */
export const shardLedger = pgTable(
  'shard_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    /** Positive on earn, negative on spend. */
    delta: integer('delta').notNull(),
    /** See @nullv2/types SHARD_LEDGER_REASON_IDS. */
    reason: text('reason').$type<ShardLedgerReason>().notNull(),
    refKind: text('ref_kind').$type<RefKind>(),
    refId: text('ref_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    humanIdx: index('shard_ledger_human_idx').on(t.humanId),
    createdIdx: index('shard_ledger_created_idx').on(t.createdAt),
  }),
);

/** Append-only audit of attention flow into a resident. */
export const attentionLedger = pgTable(
  'attention_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    sourceHumanId: uuid('source_human_id').references(() => humans.id, { onDelete: 'set null' }),
    /** See @nullv2/types ATTENTION_LEDGER_REASON_IDS. */
    reason: text('reason').$type<AttentionLedgerReason>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    residentIdx: index('attention_ledger_resident_idx').on(t.residentId),
  }),
);

/** A resident issuing a faction resource to a human in exchange for Shards. */
export const resourceGrants = pgTable(
  'resource_grants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'restrict' }),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').$type<ResourceId>().notNull(),
    quantity: integer('quantity').notNull(),
    shardsPaid: integer('shards_paid').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    humanIdx: index('resource_grants_human_idx').on(t.humanId),
    residentIdx: index('resource_grants_resident_idx').on(t.residentId),
  }),
);

export type ShardLedgerRow = typeof shardLedger.$inferSelect;
export type AttentionLedgerRow = typeof attentionLedger.$inferSelect;
export type ResourceGrant = typeof resourceGrants.$inferSelect;
