import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema } from '@nullv2/db';
import {
  FACTION_IDS,
  RESOURCES,
  type FactionId,
  type ResourceId,
  standingFromPoints,
} from '@nullv2/types';

export function meRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  r.get('/', async (c) => {
    const { user, human } = c.get('visitor');

    const [standingRows, inventoryRows] = await Promise.all([
      db
        .select()
        .from(schema.factionStanding)
        .where(eq(schema.factionStanding.humanId, human.id)),
      db
        .select()
        .from(schema.resourceInventory)
        .where(eq(schema.resourceInventory.humanId, human.id)),
    ]);

    const standingByFaction = Object.fromEntries(
      FACTION_IDS.map((f) => [f, { points: 0, tier: standingFromPoints(0) }]),
    ) as Record<FactionId, { points: number; tier: ReturnType<typeof standingFromPoints> }>;

    for (const row of standingRows) {
      if (!(FACTION_IDS as readonly string[]).includes(row.faction)) continue;
      standingByFaction[row.faction as FactionId] = {
        points: row.points,
        tier: standingFromPoints(row.points),
      };
    }

    const inventory = inventoryRows
      .filter((row) => row.resourceId in RESOURCES)
      .map((row) => ({
        resourceId: row.resourceId as ResourceId,
        quantity: row.quantity,
      }));

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        handle: user.handle,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin ?? false,
      },
      human: {
        id: human.id,
        shardBalance: human.shardBalance,
        badgeId: human.badgeId,
      },
      standing: standingByFaction,
      inventory,
    });
  });

  return r;
}
