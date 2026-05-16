import { Hono } from 'hono';
import { eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, type AuthVars } from '@nullv2/auth/hono';
import { ensureHuman } from '@nullv2/auth';
import { external, schema, type Db } from '@nullv2/db';

const grantBodySchema = z
  .object({
    humanId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    email: z.string().email().optional(),
    amount: z.number().int().refine((n) => n !== 0, 'amount must be non-zero'),
    note: z.string().trim().max(500).optional(),
  })
  .refine(
    (b) => [b.humanId, b.userId, b.email].filter(Boolean).length === 1,
    'Provide exactly one of humanId, userId, or email',
  );

export function adminRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireAdmin(db));

  r.get('/users', async (c) => {
    const q = (c.req.query('q') ?? '').trim();

    const base = db
      .select({
        id: external.users.id,
        email: external.users.email,
        name: external.users.name,
        handle: external.users.handle,
        isAdmin: external.users.isAdmin,
      })
      .from(external.users);

    const rows = q.length === 0
      ? await base.orderBy(external.users.email).limit(100)
      : await base
          .where(
            or(
              ilike(external.users.email, `%${q}%`),
              ilike(external.users.name, `%${q}%`),
              ilike(external.users.handle, `%${q}%`),
            ),
          )
          .orderBy(external.users.email)
          .limit(100);

    return c.json({ users: rows });
  });

  r.post('/shards/grant', async (c) => {
    const admin = c.get('visitor');
    const body = await c.req.json().catch(() => null);
    const parsed = grantBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    const { humanId, userId, email, amount, note } = parsed.data;

    let human: typeof schema.humans.$inferSelect | undefined;
    let targetUser: { id: string; email: string; name: string | null } | undefined;

    if (humanId) {
      const [row] = await db
        .select()
        .from(schema.humans)
        .where(eq(schema.humans.id, humanId))
        .limit(1);
      human = row;
      if (human) {
        const [u] = await db
          .select({ id: external.users.id, email: external.users.email, name: external.users.name })
          .from(external.users)
          .where(eq(external.users.id, human.userId))
          .limit(1);
        targetUser = u;
      }
    } else {
      const [u] = await db
        .select({ id: external.users.id, email: external.users.email, name: external.users.name })
        .from(external.users)
        .where(userId ? eq(external.users.id, userId) : eq(external.users.email, email!))
        .limit(1);
      if (u) {
        targetUser = u;
        human = await ensureHuman(db, u.id);
      }
    }

    if (!human || !targetUser) {
      return c.json({ error: 'user_not_found' }, 404);
    }

    if (amount < 0 && human.shardBalance + amount < 0) {
      return c.json(
        { error: 'insufficient_balance', shardBalance: human.shardBalance },
        409,
      );
    }

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(schema.humans)
        .set({
          shardBalance: sql`${schema.humans.shardBalance} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.humans.id, human!.id))
        .returning();
      if (!updated) throw new Error('admin grant: failed to update humans');

      const [ledger] = await tx
        .insert(schema.shardLedger)
        .values({
          humanId: human!.id,
          delta: amount,
          reason: 'admin_grant',
          refKind: 'admin',
          refId: admin.user.id,
          note: note ?? null,
        })
        .returning();

      return { updated, ledger };
    });

    return c.json({
      grant: {
        id: result.ledger?.id,
        delta: amount,
        note: note ?? null,
        createdAt: result.ledger?.createdAt,
      },
      target: {
        humanId: human.id,
        userId: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        newShardBalance: result.updated.shardBalance,
      },
      admin: { userId: admin.user.id, email: admin.user.email },
    });
  });

  return r;
}
