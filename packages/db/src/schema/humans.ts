import { pgTable, uuid, text, integer, timestamp, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

/**
 * Game-specific extension of `users` (owned by landing-2026).
 *
 * One row per registered visitor who has entered Null City. We do NOT mirror
 * the user profile here — just gameplay state. `userId` is a soft reference
 * to `users.id` in the shared DB; no FK constraint because the table lives
 * in another logical schema.
 */
export const humans = pgTable(
  'humans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    shardBalance: integer('shard_balance').notNull().default(0),
    badgeId: text('badge_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdUniq: uniqueIndex('humans_user_id_uniq').on(t.userId),
    badgeIdUniq: uniqueIndex('humans_badge_id_uniq').on(t.badgeId),
  }),
);

/** Cumulative points per faction. Drives the standing tier (acquaintance/ally/officer). */
export const factionStanding = pgTable(
  'faction_standing',
  {
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    faction: text('faction').notNull(),
    points: integer('points').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.humanId, t.faction] }),
  }),
);

/** Resource bag per human. quantity may be zero — kept for history. */
export const resourceInventory = pgTable(
  'resource_inventory',
  {
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    resourceId: text('resource_id').notNull(),
    quantity: integer('quantity').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.humanId, t.resourceId] }),
  }),
);

export type Human = typeof humans.$inferSelect;
export type NewHuman = typeof humans.$inferInsert;
export type FactionStanding = typeof factionStanding.$inferSelect;
export type ResourceInventoryRow = typeof resourceInventory.$inferSelect;
