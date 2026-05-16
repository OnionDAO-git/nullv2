import type { PageServerLoad } from './$types';
import { and, desc, eq, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { schema } from '@nullv2/db';
import type { DeathCause, FactionId } from '@nullv2/types';
import { db } from '$lib/server/db';

export interface SoulDetail {
  residentId: string;
  name: string;
  faction: FactionId;
  emotion: string;
  roomId: string;
  persona: string;
  epitaph: string;
  goals: string;
  alignment: string;
  quirks: string;
  aesthetic: string;
  livedTicks: number;
  lifespanTicksTotal: number;
  deathCause: DeathCause;
  bornAt: string;
  diedAt: string | null;
  archivedAt: string;
  ownerHumanId: string | null;
}

export interface MemoryRow {
  id: string;
  kind: string;
  content: string;
  createdAt: string;
}

export interface SpokenLine {
  id: string;
  content: string;
  channel: string;
  createdAt: string;
}

export interface SoulStats {
  distinctVisitors: number;
  ambientShouts: number;
}

export const load: PageServerLoad = async ({ params }) => {
  const residentId = params.residentId;

  const [soul] = await db
    .select()
    .from(schema.libraryOfSouls)
    .where(eq(schema.libraryOfSouls.residentId, residentId))
    .limit(1);
  if (!soul) throw error(404, 'no soul by that id');

  const [resident] = await db
    .select()
    .from(schema.residents)
    .where(eq(schema.residents.id, residentId))
    .limit(1);
  if (!resident) {
    // Library row exists but resident row deleted — should be rare; still render
    // a partial view.
    throw error(410, 'soul was unmade');
  }

  const memories = await db
    .select()
    .from(schema.residentMemories)
    .where(eq(schema.residentMemories.residentId, residentId))
    .orderBy(desc(schema.residentMemories.createdAt))
    .limit(20);

  const birthMemory = memories.find((m) => m.kind === 'birth') ?? null;
  const otherMemories = memories
    .filter((m) => m.kind !== 'birth' && m.kind !== 'death')
    .slice(0, 8);

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
    .limit(6);

  const visitorsRows = await db
    .select({ humanId: schema.residentMessages.humanId })
    .from(schema.residentMessages)
    .where(eq(schema.residentMessages.residentId, residentId))
    .groupBy(schema.residentMessages.humanId);
  const distinctVisitors = visitorsRows.filter((v) => v.humanId != null).length;

  const [ambientRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.residentMessages)
    .where(
      and(
        eq(schema.residentMessages.residentId, residentId),
        eq(schema.residentMessages.channel, 'shout'),
      ),
    );

  const detail: SoulDetail = {
    residentId,
    name: soul.name,
    faction: soul.faction as FactionId,
    emotion: resident.emotion,
    roomId: resident.roomId,
    persona: resident.persona,
    epitaph: soul.epitaph,
    goals: resident.goals,
    alignment: resident.alignment,
    quirks: resident.quirks,
    aesthetic: resident.aesthetic,
    livedTicks: soul.livedTicks,
    lifespanTicksTotal: resident.lifespanTicksTotal,
    deathCause: soul.deathCause as DeathCause,
    bornAt: resident.bornAt.toISOString(),
    diedAt: resident.diedAt ? resident.diedAt.toISOString() : null,
    archivedAt: soul.archivedAt.toISOString(),
    ownerHumanId: soul.ownerHumanId,
  };

  const memoryRows: MemoryRow[] = otherMemories.slice().reverse().map((m) => ({
    id: m.id,
    kind: m.kind,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  const spokenRows: SpokenLine[] = lastSpoken.slice().reverse().map((m) => ({
    id: m.id,
    content: m.content,
    channel: m.channel,
    createdAt: m.createdAt.toISOString(),
  }));

  const stats: SoulStats = {
    distinctVisitors,
    ambientShouts: ambientRow?.c ?? 0,
  };

  return {
    soul: detail,
    birthMotto: birthMemory?.content ?? null,
    memories: memoryRows,
    lastSpoken: spokenRows,
    stats,
  };
};
