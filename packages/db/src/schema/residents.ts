import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import type {
  DeathCause,
  EmotionId,
  FactionId,
  MemoryKind,
  MessageChannel,
  ResidentStatus,
  RoomId,
  Speaker,
} from '@nullv2/types';
import { humans } from './humans.ts';

export const residents = pgTable(
  'residents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    faction: text('faction').$type<FactionId>().notNull(),
    /** System prompt + flavor handed to the LLM for this resident. */
    persona: text('persona').notNull(),
    /** Emotion preset. See @nullv2/types EMOTION_IDS. Drives avatar tint + ambient tone. */
    emotion: text('emotion').$type<EmotionId>().notNull().default('stillness'),
    /** Static-catalog room slug. See @nullv2/types ROOM_IDS. */
    roomId: text('room_id').$type<RoomId>().notNull().default('atrium'),
    /** SPARK soul fields. All freeform, optional; default to '' so prompt logic
     *  can detect "unset" without nulls. See packages/types/src/spark.ts. */
    goals: text('goals').notNull().default(''),
    alignment: text('alignment').notNull().default(''),
    quirks: text('quirks').notNull().default(''),
    aesthetic: text('aesthetic').notNull().default(''),
    /** Public URL to a profile picture stored in the bucket. Optional — most
     *  residents will fall back to the stained-glass monogram. */
    avatarUrl: text('avatar_url'),
    /** Optional spawning human; null for team-seeded flagship residents. */
    ownerHumanId: uuid('owner_human_id').references(() => humans.id, { onDelete: 'set null' }),
    /** Attention balance — humans spend Shards on a resident; that flows here. Each tick deducts 1. */
    attentionBalance: integer('attention_balance').notNull().default(0),
    /** Total ticks the resident may live, set at birth. */
    lifespanTicksTotal: integer('lifespan_ticks_total').notNull(),
    lifespanTicksRemaining: integer('lifespan_ticks_remaining').notNull(),
    status: text('status').$type<ResidentStatus>().notNull().default('alive'),
    deathCause: text('death_cause').$type<DeathCause>(),
    bornAt: timestamp('born_at', { withTimezone: true }).notNull().defaultNow(),
    diedAt: timestamp('died_at', { withTimezone: true }),
  },
  (t) => ({
    factionIdx: index('residents_faction_idx').on(t.faction),
    statusIdx: index('residents_status_idx').on(t.status),
    ownerIdx: index('residents_owner_idx').on(t.ownerHumanId),
    roomIdx: index('residents_room_idx').on(t.roomId),
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
    /** See @nullv2/types MEMORY_KIND_IDS. */
    kind: text('kind').$type<MemoryKind>().notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    residentIdx: index('resident_memories_resident_idx').on(t.residentId),
  }),
);

/** Chat + autonomous ambient utterances. See MESSAGE_CHANNEL_IDS / SPEAKER_IDS in @nullv2/types. */
export const residentMessages = pgTable(
  'resident_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'cascade' }),
    /** Null for public utterances (shouts). */
    humanId: uuid('human_id').references(() => humans.id, { onDelete: 'set null' }),
    speaker: text('speaker').$type<Speaker>().notNull(),
    channel: text('channel').$type<MessageChannel>().notNull(),
    content: text('content').notNull(),
    /** Room the line was uttered in. Required for shouts; copied from resident.roomId for chat. */
    roomId: text('room_id').$type<RoomId>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    residentIdx: index('resident_messages_resident_idx').on(t.residentId),
    humanIdx: index('resident_messages_human_idx').on(t.humanId),
    roomIdx: index('resident_messages_room_idx').on(t.roomId),
  }),
);

/** Snapshot left behind when a resident dies. Browsable. */
export const libraryOfSouls = pgTable('library_of_souls', {
  id: uuid('id').primaryKey().defaultRandom(),
  residentId: uuid('resident_id')
    .notNull()
    .references(() => residents.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  faction: text('faction').$type<FactionId>().notNull(),
  ownerHumanId: uuid('owner_human_id').references(() => humans.id, { onDelete: 'set null' }),
  /** Snapshot of the resident's avatar at the moment of death. */
  avatarUrl: text('avatar_url'),
  /** Composed epitaph — drawn from memories + persona. */
  epitaph: text('epitaph').notNull(),
  livedTicks: integer('lived_ticks').notNull(),
  deathCause: text('death_cause').$type<DeathCause>().notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Resident = typeof residents.$inferSelect;
export type NewResident = typeof residents.$inferInsert;
export type ResidentMemory = typeof residentMemories.$inferSelect;
export type ResidentMessage = typeof residentMessages.$inferSelect;
export type SoulRecord = typeof libraryOfSouls.$inferSelect;
