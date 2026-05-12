import type { PageServerLoad } from './$types';
import { FACTIONS, FACTION_IDS, standingFromPoints } from '@nullv2/types';
import { schema } from '@nullv2/db';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const visitor = locals.visitor!; // gated by +layout.server.ts

  const standingRows = await db
    .select()
    .from(schema.factionStanding)
    .where(eq(schema.factionStanding.humanId, visitor.human.id));

  const standing = FACTION_IDS.map((id) => {
    const row = standingRows.find((r) => r.faction === id);
    const points = row?.points ?? 0;
    return {
      faction: FACTIONS[id],
      points,
      tier: standingFromPoints(points),
    };
  });

  return { standing };
};
