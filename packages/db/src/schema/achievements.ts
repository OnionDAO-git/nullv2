import { pgTable, uuid, text, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { AchievementId, PrintJobStatus } from '@nullv2/types';
import { humans } from './humans.ts';

/** Earned achievements per human. */
export const humanAchievements = pgTable(
  'human_achievements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').$type<AchievementId>().notNull(),
    earnedAt: timestamp('earned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('human_achievements_uniq').on(t.humanId, t.achievementId),
  }),
);

/** Queue of 3D-print jobs for the embassy print shop. */
export const printJobs = pgTable(
  'print_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    humanId: uuid('human_id')
      .notNull()
      .references(() => humans.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').$type<AchievementId>().notNull(),
    /** See @nullv2/types PRINT_JOB_STATUS_IDS. */
    status: text('status').$type<PrintJobStatus>().notNull().default('queued'),
    /** Short human-readable code for in-person claim at the print desk. */
    claimCode: text('claim_code').notNull().unique(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    statusIdx: index('print_jobs_status_idx').on(t.status),
    humanIdx: index('print_jobs_human_idx').on(t.humanId),
  }),
);

export type HumanAchievement = typeof humanAchievements.$inferSelect;
export type PrintJob = typeof printJobs.$inferSelect;
