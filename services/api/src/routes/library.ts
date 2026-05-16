import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema } from '@nullv2/db';
import {
  FACTION_IDS,
  isFactionId,
  type FactionId,
} from '@nullv2/types';

const LIST_LIMIT = 60;
const RECENT_MEMORIES_LIMIT = 6;
const RECENT_MESSAGES_LIMIT = 8;

export function libraryRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  // GET /v1/library — paginated list of archived souls, newest first.
  // Optional ?faction= filter.
  r.get('/', async (c) => {
    const factionParam = c.req.query('faction');
    const faction =
      factionParam && isFactionId(factionParam) ? (factionParam as FactionId) : null;

    const baseWhere = faction
      ? eq(schema.libraryOfSouls.faction, faction)
      : undefined;

    const souls = baseWhere
      ? await db
          .select({
            id: schema.libraryOfSouls.id,
            residentId: schema.libraryOfSouls.residentId,
            name: schema.libraryOfSouls.name,
            faction: schema.libraryOfSouls.faction,
            ownerHumanId: schema.libraryOfSouls.ownerHumanId,
            epitaph: schema.libraryOfSouls.epitaph,
            livedTicks: schema.libraryOfSouls.livedTicks,
            deathCause: schema.libraryOfSouls.deathCause,
            archivedAt: schema.libraryOfSouls.archivedAt,
            emotion: schema.residents.emotion,
            roomId: schema.residents.roomId,
            bornAt: schema.residents.bornAt,
            diedAt: schema.residents.diedAt,
          })
          .from(schema.libraryOfSouls)
          .leftJoin(
            schema.residents,
            eq(schema.residents.id, schema.libraryOfSouls.residentId),
          )
          .where(baseWhere)
          .orderBy(desc(schema.libraryOfSouls.archivedAt))
          .limit(LIST_LIMIT)
      : await db
          .select({
            id: schema.libraryOfSouls.id,
            residentId: schema.libraryOfSouls.residentId,
            name: schema.libraryOfSouls.name,
            faction: schema.libraryOfSouls.faction,
            ownerHumanId: schema.libraryOfSouls.ownerHumanId,
            epitaph: schema.libraryOfSouls.epitaph,
            livedTicks: schema.libraryOfSouls.livedTicks,
            deathCause: schema.libraryOfSouls.deathCause,
            archivedAt: schema.libraryOfSouls.archivedAt,
            emotion: schema.residents.emotion,
            roomId: schema.residents.roomId,
            bornAt: schema.residents.bornAt,
            diedAt: schema.residents.diedAt,
          })
          .from(schema.libraryOfSouls)
          .leftJoin(
            schema.residents,
            eq(schema.residents.id, schema.libraryOfSouls.residentId),
          )
          .orderBy(desc(schema.libraryOfSouls.archivedAt))
          .limit(LIST_LIMIT);

    // Aggregate counts per faction for the filter chips.
    const counts = await db
      .select({
        faction: schema.libraryOfSouls.faction,
        c: sql<number>`count(*)::int`,
      })
      .from(schema.libraryOfSouls)
      .groupBy(schema.libraryOfSouls.faction);
    const byFaction: Record<FactionId, number> = {
      solder_saints: 0,
      hatchery: 0,
      locksmiths: 0,
      ledgerwrights: 0,
    };
    let total = 0;
    for (const row of counts) {
      total += row.c;
      if (isFactionId(row.faction)) {
        byFaction[row.faction as FactionId] = row.c;
      }
    }

    return c.json({
      souls,
      total,
      byFaction,
      factions: FACTION_IDS,
      activeFaction: faction,
    });
  });

  // GET /v1/library/:residentId — detail.
  r.get('/:residentId', async (c) => {
    const residentId = c.req.param('residentId');

    const [soul] = await db
      .select()
      .from(schema.libraryOfSouls)
      .where(eq(schema.libraryOfSouls.residentId, residentId))
      .limit(1);
    if (!soul) return c.json({ error: 'soul_not_found' }, 404);

    const [resident] = await db
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, residentId))
      .limit(1);
    // resident may be null if FK was set to cascade-deleted somehow — degrade gracefully.

    // Recent memories: prefer 'birth' first (always pinned) + last reflections/interactions.
    const memories = await db
      .select()
      .from(schema.residentMemories)
      .where(eq(schema.residentMemories.residentId, residentId))
      .orderBy(desc(schema.residentMemories.createdAt))
      .limit(RECENT_MEMORIES_LIMIT * 2);

    const birthMemory = memories.find((m) => m.kind === 'birth') ?? null;
    const nonBirth = memories.filter((m) => m.kind !== 'birth').slice(0, RECENT_MEMORIES_LIMIT);

    // Last few lines the resident said (any channel).
    const lastSpoken = await db
      .select()
      .from(schema.residentMessages)
      .where(
        and(
          eq(schema.residentMessages.residentId, residentId),
          eq(schema.residentMessages.speaker, 'resident'),
        ),
      )
      .orderBy(desc(schema.residentMessages.createdAt))
      .limit(RECENT_MESSAGES_LIMIT);

    // Distinct humans the resident ever exchanged with.
    const visitorsRows = await db
      .select({ humanId: schema.residentMessages.humanId })
      .from(schema.residentMessages)
      .where(eq(schema.residentMessages.residentId, residentId))
      .groupBy(schema.residentMessages.humanId);
    const distinctVisitors = visitorsRows.filter((v) => v.humanId != null).length;

    // Ambient shouts count.
    const ambientRow = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.residentMessages)
      .where(
        and(
          eq(schema.residentMessages.residentId, residentId),
          eq(schema.residentMessages.channel, 'shout'),
        ),
      );

    return c.json({
      soul,
      resident: resident
        ? {
            id: resident.id,
            name: resident.name,
            faction: resident.faction,
            persona: resident.persona,
            emotion: resident.emotion,
            roomId: resident.roomId,
            goals: resident.goals,
            alignment: resident.alignment,
            quirks: resident.quirks,
            aesthetic: resident.aesthetic,
            bornAt: resident.bornAt,
            diedAt: resident.diedAt,
            lifespanTicksTotal: resident.lifespanTicksTotal,
            ownerHumanId: resident.ownerHumanId,
          }
        : null,
      birthMemory,
      memories: nonBirth.slice().reverse(),
      lastSpoken: lastSpoken.slice().reverse(),
      stats: {
        distinctVisitors,
        ambientShouts: ambientRow[0]?.c ?? 0,
      },
    });
  });

  return r;
}
