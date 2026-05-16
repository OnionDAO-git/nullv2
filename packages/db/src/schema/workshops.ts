import { pgTable, uuid, text, integer, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import type { FactionId, WorkshopKind, WorkshopStatus } from '@nullv2/types';
import { humans } from './humans.ts';

export const workshops = pgTable(
  'workshops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    faction: text('faction').$type<FactionId>(),
    /** See @nullv2/types WORKSHOP_KIND_IDS. */
    kind: text('kind').$type<WorkshopKind>().notNull().default('workshop'),
    shardReward: integer('shard_reward').notNull(),
    /** Unique short code embedded in the staff QR. */
    qrCode: text('qr_code').notNull().unique(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    /** See @nullv2/types WORKSHOP_STATUS_IDS. */
    status: text('status').$type<WorkshopStatus>().notNull().default('scheduled'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index('workshops_status_idx').on(t.status),
    scheduledIdx: index('workshops_scheduled_idx').on(t.scheduledAt),
  }),
);

export const workshopAttendance = pgTable(
  'workshop_attendance',
  {
    workshopId: uuid('workshop_id')
      .notNull()
      .references(() => workshops.id, { onDelete: 'cascade' }),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    shardsAwarded: integer('shards_awarded').notNull(),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.workshopId, t.humanId] }),
  }),
);

export type Workshop = typeof workshops.$inferSelect;
export type Attendance = typeof workshopAttendance.$inferSelect;
