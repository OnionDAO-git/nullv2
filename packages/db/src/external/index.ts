/**
 * Tables owned by landing-2026 (Onion DAO main app).
 *
 * Declared here for type-safe reads against the shared Postgres instance.
 * They are intentionally NOT in the drizzle.config.ts schema path, so
 * drizzle-kit will never generate migrations against them. The source of
 * truth for these tables lives in landing-2026/scripts/schema.sql.
 */
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  isAdmin: boolean('is_admin').default(false),
  org: text('org'),
  city: text('city'),
  bio: text('bio'),
  link: text('link'),
  profileClaimed: boolean('profile_claimed').default(false),
  notionId: text('notion_id'),
  handle: text('handle'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
