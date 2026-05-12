import { Hono } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema } from '@nullv2/db';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  type AchievementId,
  type ResourceId,
} from '@nullv2/types';

const redeemBodySchema = z.object({
  achievementId: z.enum(ACHIEVEMENT_IDS as unknown as [AchievementId, ...AchievementId[]]),
});

const CLAIM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateClaimCode(): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    const ch = CLAIM_CODE_ALPHABET.charAt(
      Math.floor(Math.random() * CLAIM_CODE_ALPHABET.length),
    );
    out += ch;
  }
  return out;
}

function randomCoord(): { x: number; y: number } {
  return {
    x: Math.floor(Math.random() * 50),
    y: Math.floor(Math.random() * 50),
  };
}

export function achievementsRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  r.get('/', async (c) => {
    const { human } = c.get('visitor');

    const [earnedRows, inventoryRows] = await Promise.all([
      db
        .select()
        .from(schema.humanAchievements)
        .where(eq(schema.humanAchievements.humanId, human.id)),
      db
        .select()
        .from(schema.resourceInventory)
        .where(eq(schema.resourceInventory.humanId, human.id)),
    ]);

    const earnedById = new Map<string, Date>();
    for (const row of earnedRows) earnedById.set(row.achievementId, row.earnedAt);

    const inventory = new Map<string, number>();
    for (const row of inventoryRows) inventory.set(row.resourceId, row.quantity);

    const items = ACHIEVEMENT_IDS.flatMap((id) => {
      const achievement = ACHIEVEMENTS[id];
      if (!achievement) return [];
      const earnedAt = earnedById.get(id);
      const missing: Partial<Record<ResourceId, number>> = {};
      let hasIngredients = true;
      for (const [resourceId, needed] of Object.entries(achievement.recipe) as Array<
        [ResourceId, number]
      >) {
        const have = inventory.get(resourceId) ?? 0;
        if (have < needed) {
          missing[resourceId] = needed - have;
          hasIngredients = false;
        }
      }
      // Civic achievements have empty recipes; they're never "self-redeemable".
      if (achievement.kind === 'civic') hasIngredients = false;
      return [{
        achievement,
        earned: !!earnedAt,
        earnedAt,
        hasIngredients,
        missing,
      }];
    });

    return c.json({ achievements: items });
  });

  r.post('/redeem', async (c) => {
    const { human } = c.get('visitor');

    const body = await c.req.json().catch(() => null);
    const parsed = redeemBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    const achievement = ACHIEVEMENTS[parsed.data.achievementId];
    if (!achievement) {
      return c.json({ error: 'achievement_not_found' }, 404);
    }
    if (achievement.kind === 'civic') {
      return c.json({ error: 'civic_not_redeemable', code: 'civic_not_redeemable' }, 400);
    }

    const [already] = await db
      .select()
      .from(schema.humanAchievements)
      .where(
        and(
          eq(schema.humanAchievements.humanId, human.id),
          eq(schema.humanAchievements.achievementId, achievement.id),
        ),
      )
      .limit(1);
    if (already) {
      return c.json({ error: 'already_earned' }, 409);
    }

    const inventoryRows = await db
      .select()
      .from(schema.resourceInventory)
      .where(eq(schema.resourceInventory.humanId, human.id));
    const inventory = new Map<string, number>();
    for (const row of inventoryRows) inventory.set(row.resourceId, row.quantity);

    const missing: Partial<Record<ResourceId, number>> = {};
    let ok = true;
    for (const [resourceId, needed] of Object.entries(achievement.recipe) as Array<
      [ResourceId, number]
    >) {
      const have = inventory.get(resourceId) ?? 0;
      if (have < needed) {
        missing[resourceId] = needed - have;
        ok = false;
      }
    }
    if (!ok) {
      return c.json({ error: 'missing_ingredients', missing }, 400);
    }

    const txResult = await db.transaction(async (tx) => {
      for (const [resourceId, needed] of Object.entries(achievement.recipe) as Array<
        [ResourceId, number]
      >) {
        await tx
          .update(schema.resourceInventory)
          .set({
            quantity: sql`${schema.resourceInventory.quantity} - ${needed}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.resourceInventory.humanId, human.id),
              eq(schema.resourceInventory.resourceId, resourceId),
            ),
          );
      }

      await tx.insert(schema.humanAchievements).values({
        humanId: human.id,
        achievementId: achievement.id,
      });

      // Claim code uniqueness: pre-check via SELECT then INSERT. A unique-violation
      // mid-transaction would abort the whole tx, so we avoid relying on catch/retry.
      let claimCode = '';
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidate = generateClaimCode();
        const [collision] = await tx
          .select({ id: schema.printJobs.id })
          .from(schema.printJobs)
          .where(eq(schema.printJobs.claimCode, candidate))
          .limit(1);
        if (!collision) {
          claimCode = candidate;
          break;
        }
      }
      if (!claimCode) throw new Error('claim_code_generation_failed');

      await tx.insert(schema.printJobs).values({
        humanId: human.id,
        achievementId: achievement.id,
        claimCode,
      });

      const parcels: Array<typeof schema.parcels.$inferSelect> = [];
      for (const faction of achievement.factions) {
        let placed: typeof schema.parcels.$inferSelect | undefined;
        // 50x50 grid; collision-check by querying coord index, retry on hit.
        for (let attempt = 0; attempt < 12; attempt += 1) {
          const { x, y } = randomCoord();
          const [collision] = await tx
            .select({ id: schema.parcels.id })
            .from(schema.parcels)
            .where(and(eq(schema.parcels.x, x), eq(schema.parcels.y, y)))
            .limit(1);
          if (collision) continue;
          const [row] = await tx
            .insert(schema.parcels)
            .values({
              faction,
              ratifiedByHumanId: human.id,
              achievementId: achievement.id,
              x,
              y,
            })
            .returning();
          placed = row;
          break;
        }
        if (!placed) throw new Error('parcel_coord_exhausted');
        parcels.push(placed);
      }

      return { claimCode, parcels };
    });

    return c.json({
      achievement,
      claimCode: txResult.claimCode,
      parcels: txResult.parcels,
    });
  });

  return r;
}
