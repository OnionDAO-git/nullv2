import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import type { AchievementId, FactionId } from '@nullv2/types';
import { humans } from './humans.ts';

/**
 * Territory map. Each redeemed achievement ratifies a new parcel for the
 * crediting faction(s). The wall display reads (faction, x, y) tuples to
 * render the city's growing footprint.
 */
export const parcels = pgTable(
  'parcels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    faction: text('faction').$type<FactionId>().notNull(),
    /** Which human witnessed this parcel into existence. */
    ratifiedByHumanId: uuid('ratified_by_human_id').references(() => humans.id, {
      onDelete: 'set null',
    }),
    /** The achievement that minted the parcel, if applicable. */
    achievementId: text('achievement_id').$type<AchievementId>(),
    /** 1..4 for the four event weeks; null for civic parcels. */
    week: integer('week'),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    factionIdx: index('parcels_faction_idx').on(t.faction),
    coordIdx: index('parcels_coord_idx').on(t.x, t.y),
  }),
);

export type Parcel = typeof parcels.$inferSelect;
