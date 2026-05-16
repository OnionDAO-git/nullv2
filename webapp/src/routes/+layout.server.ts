import type { LayoutServerLoad } from './$types';
import { FACTION_IDS, standingFromPoints, type StandingTier } from '@nullv2/types';
import { schema } from '@nullv2/db';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

export interface NavData {
  shardBalance: number;
  visitorHandle: string;
  unreadCount: number;
  standings: { factionId: string; tier: StandingTier }[];
}

const EMPTY_NAV: NavData = {
  shardBalance: 0,
  visitorHandle: 'visitor',
  unreadCount: 0,
  standings: [],
};

export const load: LayoutServerLoad = async ({ locals }) => {
  const visitor = locals.visitor;
  if (!visitor) return { nav: EMPTY_NAV };

  const standingRows = await db
    .select()
    .from(schema.factionStanding)
    .where(eq(schema.factionStanding.humanId, visitor.human.id));

  const standings = FACTION_IDS.map((id) => {
    const row = standingRows.find((r) => r.faction === id);
    return {
      factionId: id as string,
      tier: standingFromPoints(row?.points ?? 0),
    };
  });

  return {
    nav: {
      shardBalance: visitor.human.shardBalance,
      visitorHandle:
        visitor.user.handle ?? visitor.user.name ?? visitor.user.email ?? 'visitor',
      unreadCount: 0, // wired later when the letters table exists
      standings,
    } satisfies NavData,
  };
};
