import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { humans } from './humans.ts';

export const residents = pgTable(
  'residents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    faction: text('faction').notNull(),
    /** System prompt + flavor handed to the LLM for this resident. */
    persona: text('persona').notNull(),
    /** Optional spawning human; null for team-seeded flagship residents. */
    ownerHumanId: uuid('owner_human_id').references(() => humans.id, { onDelete: 'set null' }),
    /** Attention balance — humans spend Shards on a resident; that flows here. Each tick deducts 1. */
    attentionBalance: integer('attention_balance').notNull().default(0),
    /** Total ticks the resident may live, set at birth. */
    lifespanTicksTotal: integer('lifespan_ticks_total').notNull(),
    lifespanTicksRemaining: integer('lifespan_ticks_remaining').notNull(),
    status: text('status').notNull().default('alive'),
    deathCause: text('death_cause'),
    bornAt: timestamp('born_at', { withTimezone: true }).notNull().defaultNow(),
    diedAt: timestamp('died_at', { withTimezone: true }),
  },
  (t) => ({
    factionIdx: index('residents_faction_idx').on(t.faction),
    statusIdx: index('residents_status_idx').on(t.status),
    ownerIdx: index('residents_owner_idx').on(t.ownerHumanId),
  }),
);

/** Persisted memory log used as LLM context and as Library of Souls source material. */
export const residentMemories = pgTable(
  'resident_memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'cascade' }),
    /** birth | death | interaction | reflection | gift */
    kind: text('kind').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    residentIdx: index('resident_memories_resident_idx').on(t.residentId),
  }),
);

/** Chat + public utterances. Channel = chat | shout | last_words. */
export const residentMessages = pgTable(
  'resident_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'cascade' }),
    /** Null for public utterances (shouts, last words). */
    humanId: uuid('human_id').references(() => humans.id, { onDelete: 'set null' }),
    /** Who said it: 'resident' | 'human'. */
    speaker: text('speaker').notNull(),
    channel: text('channel').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    residentIdx: index('resident_messages_resident_idx').on(t.residentId),
    humanIdx: index('resident_messages_human_idx').on(t.humanId),
  }),
);

/** Snapshot left behind when a resident dies. Browsable. */
export const libraryOfSouls = pgTable('library_of_souls', {
  id: uuid('id').primaryKey().defaultRandom(),
  residentId: uuid('resident_id')
    .notNull()
    .references(() => residents.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  faction: text('faction').notNull(),
  ownerHumanId: uuid('owner_human_id').references(() => humans.id, { onDelete: 'set null' }),
  /** Composed epitaph — drawn from memories + persona. */
  epitaph: text('epitaph').notNull(),
  livedTicks: integer('lived_ticks').notNull(),
  deathCause: text('death_cause').notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Resident = typeof residents.$inferSelect;
export type NewResident = typeof residents.$inferInsert;
export type ResidentMemory = typeof residentMemories.$inferSelect;
export type ResidentMessage = typeof residentMessages.$inferSelect;
export type SoulRecord = typeof libraryOfSouls.$inferSelect;
