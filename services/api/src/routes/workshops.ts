import { Hono } from 'hono';
import { and, eq, gte, inArray, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireVisitor, requireAdmin, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema, external } from '@nullv2/db';
import { ensureHuman } from '@nullv2/auth';

const scanBodySchema = z
  .object({
    qrCode: z.string().min(1),
    humanId: z.string().uuid().optional(),
    humanEmail: z.string().email().optional(),
  })
  .refine((b) => Boolean(b.humanId) !== Boolean(b.humanEmail), {
    message: 'Provide exactly one of humanId or humanEmail',
  });

export function workshopsRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();

  r.get('/', requireVisitor(db), async (c) => {
    const workshops = await db
      .select()
      .from(schema.workshops)
      .where(
        or(
          inArray(schema.workshops.status, ['scheduled', 'active']),
          gte(schema.workshops.scheduledAt, new Date()),
        ),
      )
      .orderBy(schema.workshops.scheduledAt);

    return c.json({ workshops });
  });

  r.post('/scan', requireAdmin(db), async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = scanBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    const { qrCode, humanId, humanEmail } = parsed.data;

    const [workshop] = await db
      .select()
      .from(schema.workshops)
      .where(eq(schema.workshops.qrCode, qrCode))
      .limit(1);
    if (!workshop) {
      return c.json({ error: 'workshop_not_found' }, 404);
    }

    let human;
    if (humanId) {
      const found = await db
        .select()
        .from(schema.humans)
        .where(eq(schema.humans.id, humanId))
        .limit(1);
      human = found[0];
    } else if (humanEmail) {
      const [userRow] = await db
        .select({ id: external.users.id })
        .from(external.users)
        .where(eq(external.users.email, humanEmail))
        .limit(1);
      if (!userRow) {
        return c.json({ error: 'user_not_found' }, 404);
      }
      human = await ensureHuman(db, userRow.id);
    }
    if (!human) {
      return c.json({ error: 'human_not_found' }, 404);
    }

    const [existing] = await db
      .select()
      .from(schema.workshopAttendance)
      .where(
        and(
          eq(schema.workshopAttendance.workshopId, workshop.id),
          eq(schema.workshopAttendance.humanId, human.id),
        ),
      )
      .limit(1);
    if (existing) {
      return c.json({ error: 'already_attended' }, 409);
    }

    const reward = workshop.shardReward;

    const result = await db.transaction(async (tx) => {
      const [attendance] = await tx
        .insert(schema.workshopAttendance)
        .values({
          workshopId: workshop.id,
          humanId: human.id,
          shardsAwarded: reward,
        })
        .returning();

      const [updatedHuman] = await tx
        .update(schema.humans)
        .set({
          shardBalance: sql`${schema.humans.shardBalance} + ${reward}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.humans.id, human.id))
        .returning();
      if (!updatedHuman) throw new Error('workshop scan: failed to credit shards');

      await tx.insert(schema.shardLedger).values({
        humanId: human.id,
        delta: reward,
        reason: 'workshop_attendance',
        refKind: 'workshop',
        refId: workshop.id,
      });

      return { attendance, newShardBalance: updatedHuman.shardBalance };
    });

    return c.json({
      workshop,
      attendance: result.attendance,
      newShardBalance: result.newShardBalance,
    });
  });

  return r;
}
