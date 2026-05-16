import type { PageServerLoad } from './$types';
import {
  ACHIEVEMENT_IDS,
  ACHIEVEMENTS,
  RESOURCE_IDS,
  type ResourceId,
} from '@nullv2/types';
import { schema } from '@nullv2/db';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async ({ locals }) => {
  const visitor = locals.visitor!;
  const humanId = visitor.human.id;

  const [inventoryRows, ownedRows] = await Promise.all([
    db
      .select()
      .from(schema.resourceInventory)
      .where(eq(schema.resourceInventory.humanId, humanId)),
    db
      .select()
      .from(schema.humanAchievements)
      .where(eq(schema.humanAchievements.humanId, humanId)),
  ]);

  // Inventory: ensure every resource id has a value (zero if absent).
  const inventory: Record<ResourceId, number> = {} as Record<ResourceId, number>;
  for (const id of RESOURCE_IDS) inventory[id] = 0;
  for (const row of inventoryRows) {
    if ((RESOURCE_IDS as readonly string[]).includes(row.resourceId)) {
      inventory[row.resourceId as ResourceId] = row.quantity;
    }
  }

  // Civic granted flag.
  const ownedIds = new Set(ownedRows.map((r) => r.achievementId));
  const achievements = ACHIEVEMENT_IDS.map((id) => {
    const a = ACHIEVEMENTS[id];
    return {
      ...a,
      granted: ownedIds.has(id),
    };
  });

  return {
    inventory,
    achievements,
  };
};
