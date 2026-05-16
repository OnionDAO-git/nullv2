import type { PageServerLoad } from './$types';
import { and, desc, eq, gt, isNotNull, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { schema } from '@nullv2/db';
import {
  standingFromPoints,
  computeNeeds,
  NEED_BLURB,
  type NeedId,
  type NeedsSnapshot,
} from '@nullv2/types';
import { db } from '$lib/server/db';

export interface ChatLine {
  id: string;
  from: 'them' | 'me';
  text: string;
  createdAt: string;
  channel: string;
}

export interface ResidentSummary {
  id: string;
  name: string;
  faction: string;
  emotion: string;
  roomId: string;
  persona: string;
  status: string;
  attentionBalance: number;
  attentionMax: number;
  lifespanTicksRemaining: number;
  lifespanTicksTotal: number;
  motto: string | null;
}

const THREAD_LIMIT = 30;

export const load: PageServerLoad = async ({ params, locals }) => {
  const visitor = locals.visitor;
  if (!visitor) throw error(401, 'sign in first');
  const me = visitor.human;

  const [resident] = await db
    .select()
    .from(schema.residents)
    .where(eq(schema.residents.id, params.id))
    .limit(1);
  if (!resident) throw error(404, 'resident not found');

  // Birth memory == the motto, by convention. Grab the first one.
  const [birthMem] = await db
    .select()
    .from(schema.residentMemories)
    .where(and(eq(schema.residentMemories.residentId, resident.id), eq(schema.residentMemories.kind, 'birth')))
    .orderBy(desc(schema.residentMemories.createdAt))
    .limit(1);

  // Thread: only this visitor's lines + this resident's replies to this visitor +
  // public shouts (channel='shout' has humanId=null).
  const threadDesc = await db
    .select()
    .from(schema.residentMessages)
    .where(eq(schema.residentMessages.residentId, resident.id))
    .orderBy(desc(schema.residentMessages.createdAt))
    .limit(THREAD_LIMIT * 2);

  // Filter: messages where humanId === me OR (channel='shout' && speaker='resident')
  const mine = threadDesc
    .filter(
      (m) =>
        (m.humanId && m.humanId === me.id) ||
        (m.channel === 'shout' && m.speaker === 'resident'),
    )
    .slice(0, THREAD_LIMIT);
  const chronological = mine.slice().reverse();

  const thread: ChatLine[] = chronological.map((m) => ({
    id: m.id,
    from: m.speaker === 'human' ? 'me' : 'them',
    text: m.content,
    createdAt: m.createdAt.toISOString(),
    channel: m.channel,
  }));

  const [standingRow] = await db
    .select()
    .from(schema.factionStanding)
    .where(
      and(
        eq(schema.factionStanding.humanId, me.id),
        eq(schema.factionStanding.faction, resident.faction),
      ),
    )
    .limit(1);
  const standingPoints = standingRow?.points ?? 0;

  // SPARK needs snapshot — mirrors services/inference/src/lib.ts#fetchNeedsSnapshot.
  const tickIntervalMs = Number(
    process.env.TICK_INTERVAL_MS ?? 5 * 60 * 1000,
  );
  const deathWindowSince = new Date(Date.now() - 12 * tickIntervalMs);

  const [lastMessage] = await db
    .select({ createdAt: schema.residentMessages.createdAt })
    .from(schema.residentMessages)
    .where(eq(schema.residentMessages.residentId, resident.id))
    .orderBy(desc(schema.residentMessages.createdAt))
    .limit(1);

  const [deathCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.residents)
    .where(
      and(
        eq(schema.residents.roomId, resident.roomId),
        eq(schema.residents.status, 'dead'),
        isNotNull(schema.residents.diedAt),
        gt(schema.residents.diedAt, deathWindowSince),
      ),
    );
  const recentDeathsInRoom = deathCountRow?.count ?? 0;

  const needs: NeedsSnapshot = computeNeeds({
    attentionBalance: resident.attentionBalance,
    lifespanTicksRemaining: resident.lifespanTicksRemaining,
    goals: resident.goals,
    lastInteractionAt: lastMessage?.createdAt ?? null,
    recentDeathsInRoom,
    tickIntervalMs,
  });
  const needBlurb = NEED_BLURB[needs.dominant as NeedId];

  const summary: ResidentSummary = {
    id: resident.id,
    name: resident.name,
    faction: resident.faction,
    emotion: resident.emotion,
    roomId: resident.roomId,
    persona: resident.persona,
    status: resident.status,
    attentionBalance: resident.attentionBalance,
    attentionMax: 100, // soft cap for the meter display
    lifespanTicksRemaining: resident.lifespanTicksRemaining,
    lifespanTicksTotal: resident.lifespanTicksTotal,
    motto: birthMem?.content ?? null,
  };

  return {
    resident: summary,
    thread,
    standing: { points: standingPoints, tier: standingFromPoints(standingPoints) },
    needs,
    needBlurb,
    agitation: needs.agitation,
  };
};
