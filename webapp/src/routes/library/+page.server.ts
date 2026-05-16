import type { PageServerLoad } from './$types';
import { and, desc, eq, sql } from 'drizzle-orm';
import { schema } from '@nullv2/db';
import {
  FACTION_IDS,
  isFactionId,
  type FactionId,
  type DeathCause,
} from '@nullv2/types';
import { db } from '$lib/server/db';

const LIST_LIMIT = 60;

export interface SoulRow {
  id: string;
  residentId: string;
  name: string;
  faction: FactionId;
  epitaph: string;
  livedTicks: number;
  deathCause: DeathCause;
  archivedAt: string;
  emotion: string;
  ownerHumanId: string | null;
}

export const load: PageServerLoad = async ({ url }) => {
  const factionParam = url.searchParams.get('faction');
  const activeFaction =
    factionParam && isFactionId(factionParam) ? (factionParam as FactionId) : null;

  const filter = activeFaction
    ? and(eq(schema.libraryOfSouls.faction, activeFaction))
    : undefined;

  const rows = filter
    ? await db
        .select({
          id: schema.libraryOfSouls.id,
          residentId: schema.libraryOfSouls.residentId,
          name: schema.libraryOfSouls.name,
          faction: schema.libraryOfSouls.faction,
          epitaph: schema.libraryOfSouls.epitaph,
          livedTicks: schema.libraryOfSouls.livedTicks,
          deathCause: schema.libraryOfSouls.deathCause,
          archivedAt: schema.libraryOfSouls.archivedAt,
          ownerHumanId: schema.libraryOfSouls.ownerHumanId,
          emotion: schema.residents.emotion,
        })
        .from(schema.libraryOfSouls)
        .leftJoin(
          schema.residents,
          eq(schema.residents.id, schema.libraryOfSouls.residentId),
        )
        .where(filter)
        .orderBy(desc(schema.libraryOfSouls.archivedAt))
        .limit(LIST_LIMIT)
    : await db
        .select({
          id: schema.libraryOfSouls.id,
          residentId: schema.libraryOfSouls.residentId,
          name: schema.libraryOfSouls.name,
          faction: schema.libraryOfSouls.faction,
          epitaph: schema.libraryOfSouls.epitaph,
          livedTicks: schema.libraryOfSouls.livedTicks,
          deathCause: schema.libraryOfSouls.deathCause,
          archivedAt: schema.libraryOfSouls.archivedAt,
          ownerHumanId: schema.libraryOfSouls.ownerHumanId,
          emotion: schema.residents.emotion,
        })
        .from(schema.libraryOfSouls)
        .leftJoin(
          schema.residents,
          eq(schema.residents.id, schema.libraryOfSouls.residentId),
        )
        .orderBy(desc(schema.libraryOfSouls.archivedAt))
        .limit(LIST_LIMIT);

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

  const souls: SoulRow[] = rows.map((r) => ({
    id: r.id,
    residentId: r.residentId,
    name: r.name,
    faction: r.faction as FactionId,
    epitaph: r.epitaph,
    livedTicks: r.livedTicks,
    deathCause: r.deathCause as DeathCause,
    archivedAt: r.archivedAt.toISOString(),
    ownerHumanId: r.ownerHumanId,
    emotion: r.emotion ?? 'stillness',
  }));

  return {
    souls,
    total,
    byFaction,
    factions: FACTION_IDS as readonly FactionId[],
    activeFaction,
  };
};
