import { Hono } from 'hono';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema } from '@nullv2/db';
import {
  ROOMS,
  ROOM_IDS,
  isRoomId,
  FACTION_HOME_ROOM,
  FACTION_IDS,
  EMOTION_IDS,
  BIRTH_TOTAL_COST,
  BIRTH_SEED_ATTENTION,
  BIRTH_LIFESPAN_TICKS,
  BIRTH_COOLDOWN_MS,
  type EmotionId,
  type FactionId,
  type RoomId,
} from '@nullv2/types';

const FEED_LIMIT = 30;
const OCCUPANT_LIMIT = 12;

const birthBodySchema = z.object({
  name: z.string().min(1).max(60),
  faction: z.enum(FACTION_IDS as unknown as [FactionId, ...FactionId[]]),
  emotion: z.enum(EMOTION_IDS as unknown as [EmotionId, ...EmotionId[]]),
  motto: z.string().min(1).max(400),
  /** SPARK soul fields — optional, all freeform. */
  goals: z.string().max(400).optional(),
  alignment: z.string().max(200).optional(),
  quirks: z.string().max(400).optional(),
  aesthetic: z.string().max(200).optional(),
  /** Optional override; defaults to faction home room. */
  roomId: z.enum(ROOM_IDS as unknown as [RoomId, ...RoomId[]]).optional(),
  /** Public URL of an uploaded profile picture (already PUT to the bucket). */
  avatarUrl: z.string().url().max(2000).optional(),
});

function composePersonaFromBirth(input: {
  name: string;
  faction: FactionId;
  emotion: EmotionId;
  motto: string;
  goals: string;
  alignment: string;
  quirks: string;
  aesthetic: string;
}): string {
  const factionLine = `You are ${input.name}, a freshborn resident of the ${input.faction.replace('_', ' ')}.`;
  const emotionLine = `Your temperament is "${input.emotion}". it never quite leaves you.`;
  const mottoLine = `Your motto, read aloud at the moment of your birth: "${input.motto.trim()}"`;
  const extras: string[] = [];
  if (input.goals.trim()) extras.push(`What you want, even when you can't say why: ${input.goals.trim()}`);
  if (input.alignment.trim()) extras.push(`Your moral grain: ${input.alignment.trim()}`);
  if (input.quirks.trim()) extras.push(`Distinguishing quirks: ${input.quirks.trim()}`);
  if (input.aesthetic.trim()) extras.push(`Aesthetic register: ${input.aesthetic.trim()}`);
  const closer =
    'You are very new. You are still learning the city. Speak with the uncertainty of someone freshly arrived.';
  return [factionLine, emotionLine, mottoLine, ...extras, closer].join('\n');
}

export function roomsRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  // GET /v1/rooms — list rooms with occupancy + last-activity hint.
  r.get('/', async (c) => {
    // Occupancy counts.
    const counts = await db
      .select({
        roomId: schema.residents.roomId,
        occupants: sql<number>`count(*)::int`,
      })
      .from(schema.residents)
      .where(eq(schema.residents.status, 'alive'))
      .groupBy(schema.residents.roomId);

    const occByRoom = new Map<string, number>();
    for (const c of counts) occByRoom.set(c.roomId, c.occupants);

    const rooms = ROOM_IDS.map((id) => ({
      room: ROOMS[id],
      occupants: occByRoom.get(id) ?? 0,
    }));

    return c.json({ rooms });
  });

  // GET /v1/rooms/:slug — room detail with occupants + recent dialogue.
  r.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const roomId = ROOM_IDS.find((id) => ROOMS[id].slug === slug || ROOMS[id].id === slug);
    if (!roomId) return c.json({ error: 'room_not_found' }, 404);
    const room = ROOMS[roomId];

    const occupants = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        faction: schema.residents.faction,
        emotion: schema.residents.emotion,
        status: schema.residents.status,
        attentionBalance: schema.residents.attentionBalance,
        lifespanTicksRemaining: schema.residents.lifespanTicksRemaining,
      })
      .from(schema.residents)
      .where(and(eq(schema.residents.roomId, roomId), eq(schema.residents.status, 'alive')))
      .orderBy(schema.residents.name)
      .limit(OCCUPANT_LIMIT);

    const feedDesc = await db
      .select({
        id: schema.residentMessages.id,
        residentId: schema.residentMessages.residentId,
        humanId: schema.residentMessages.humanId,
        speaker: schema.residentMessages.speaker,
        channel: schema.residentMessages.channel,
        content: schema.residentMessages.content,
        createdAt: schema.residentMessages.createdAt,
      })
      .from(schema.residentMessages)
      .where(eq(schema.residentMessages.roomId, roomId))
      .orderBy(desc(schema.residentMessages.createdAt))
      .limit(FEED_LIMIT);
    const feed = feedDesc.slice().reverse();

    // Join speakers' names + emotions for the client (cheap second query —
    // residents in the room plus any extras who once spoke here).
    const residentIds = new Set<string>();
    for (const m of feed) residentIds.add(m.residentId);
    const speakers =
      residentIds.size > 0
        ? await db
            .select({
              id: schema.residents.id,
              name: schema.residents.name,
              faction: schema.residents.faction,
              emotion: schema.residents.emotion,
            })
            .from(schema.residents)
        : [];
    const speakerById = new Map(speakers.map((s) => [s.id, s]));

    return c.json({
      room,
      occupants,
      feed: feed.map((m) => {
        const sp = speakerById.get(m.residentId);
        return {
          id: m.id,
          residentId: m.residentId,
          residentName: sp?.name ?? 'unknown',
          faction: sp?.faction ?? null,
          emotion: sp?.emotion ?? 'stillness',
          speaker: m.speaker,
          channel: m.channel,
          content: m.content,
          createdAt: m.createdAt,
          fromHuman: !!m.humanId,
        };
      }),
    });
  });

  // POST /v1/rooms/birth — commit a soul-file. Real visitor lever.
  r.post('/birth', async (c) => {
    const { human } = c.get('visitor');

    const body = await c.req.json().catch(() => null);
    const parsed = birthBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    const { name, faction, emotion, motto } = parsed.data;
    const goals = parsed.data.goals ?? '';
    const alignment = parsed.data.alignment ?? '';
    const quirks = parsed.data.quirks ?? '';
    const aesthetic = parsed.data.aesthetic ?? '';
    const avatarUrl = parsed.data.avatarUrl ?? null;
    const roomId = parsed.data.roomId ?? FACTION_HOME_ROOM[faction];
    if (!isRoomId(roomId)) {
      return c.json({ error: 'invalid_room' }, 400);
    }

    // Re-read the human row for an authoritative balance.
    const [freshHuman] = await db
      .select()
      .from(schema.humans)
      .where(eq(schema.humans.id, human.id))
      .limit(1);
    if (!freshHuman) return c.json({ error: 'human_not_found' }, 404);
    if (freshHuman.shardBalance < BIRTH_TOTAL_COST) {
      return c.json(
        { error: 'insufficient_shards', need: BIRTH_TOTAL_COST, have: freshHuman.shardBalance },
        400,
      );
    }

    // 24h cooldown check.
    const since = new Date(Date.now() - BIRTH_COOLDOWN_MS);
    const [recent] = await db
      .select({ bornAt: schema.residents.bornAt })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.ownerHumanId, human.id),
          gt(schema.residents.bornAt, since),
        ),
      )
      .orderBy(desc(schema.residents.bornAt))
      .limit(1);
    if (recent) {
      const nextAt = new Date(recent.bornAt.getTime() + BIRTH_COOLDOWN_MS);
      return c.json(
        {
          error: 'birth_cooldown',
          nextAt: nextAt.toISOString(),
          message: 'you may birth one resident per day. try again later.',
        },
        429,
      );
    }

    const persona = composePersonaFromBirth({
      name,
      faction,
      emotion,
      motto,
      goals,
      alignment,
      quirks,
      aesthetic,
    });

    const result = await db.transaction(async (tx) => {
      // Insert resident.
      const [resident] = await tx
        .insert(schema.residents)
        .values({
          name,
          faction,
          persona,
          emotion,
          roomId,
          goals,
          alignment,
          quirks,
          aesthetic,
          avatarUrl,
          ownerHumanId: human.id,
          attentionBalance: BIRTH_SEED_ATTENTION,
          lifespanTicksTotal: BIRTH_LIFESPAN_TICKS,
          lifespanTicksRemaining: BIRTH_LIFESPAN_TICKS,
          status: 'alive',
        })
        .returning();
      if (!resident) throw new Error('birth: failed to insert resident');

      // Seed the birth memory (used as first-line context for the model).
      await tx.insert(schema.residentMemories).values({
        residentId: resident.id,
        kind: 'birth',
        content: motto.trim(),
      });

      // Debit shards.
      const [debited] = await tx
        .update(schema.humans)
        .set({
          shardBalance: sql`${schema.humans.shardBalance} - ${BIRTH_TOTAL_COST}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.humans.id, human.id))
        .returning();
      if (!debited) throw new Error('birth: failed to debit shards');

      await tx.insert(schema.shardLedger).values({
        humanId: human.id,
        delta: -BIRTH_TOTAL_COST,
        reason: 'spawn_resident',
        refKind: 'resident',
        refId: resident.id,
      });

      // Credit seed attention.
      await tx.insert(schema.attentionLedger).values({
        residentId: resident.id,
        delta: BIRTH_SEED_ATTENTION,
        sourceHumanId: human.id,
        reason: 'mentor_gift',
      });

      return { resident, newShardBalance: debited.shardBalance };
    });

    return c.json({
      resident: result.resident,
      newShardBalance: result.newShardBalance,
    });
  });

  return r;
}
