import { Hono } from 'hono';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, type AuthVars } from '@nullv2/auth/hono';
import { ensureHuman } from '@nullv2/auth';
import { external, schema, killResident, type Db } from '@nullv2/db';
import { FACTION_IDS, type FactionId } from '@nullv2/types';

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

const residentPatchSchema = z.object({
  avatarUrl: z.string().url().max(2000).nullable().optional(),
});

const RESIDENT_LIST_LIMIT = 200;

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

  // GET /v1/admin/residents — list residents for the admin console.
  // Default to alive only; pass ?status=all to include the dead.
  r.get('/residents', async (c) => {
    const q = (c.req.query('q') ?? '').trim();
    const factionParam = c.req.query('faction');
    const statusParam = c.req.query('status') ?? 'alive';

    const conditions = [] as ReturnType<typeof eq>[];
    if (statusParam !== 'all') {
      conditions.push(eq(schema.residents.status, 'alive'));
    }
    if (factionParam && (FACTION_IDS as readonly string[]).includes(factionParam)) {
      conditions.push(eq(schema.residents.faction, factionParam as FactionId));
    }
    if (q.length > 0) {
      conditions.push(ilike(schema.residents.name, `%${q}%`));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        faction: schema.residents.faction,
        emotion: schema.residents.emotion,
        status: schema.residents.status,
        roomId: schema.residents.roomId,
        attentionBalance: schema.residents.attentionBalance,
        lifespanTicksTotal: schema.residents.lifespanTicksTotal,
        lifespanTicksRemaining: schema.residents.lifespanTicksRemaining,
        avatarUrl: schema.residents.avatarUrl,
        ownerHumanId: schema.residents.ownerHumanId,
        bornAt: schema.residents.bornAt,
        diedAt: schema.residents.diedAt,
      })
      .from(schema.residents)
      .where(where)
      .orderBy(desc(schema.residents.bornAt))
      .limit(RESIDENT_LIST_LIMIT);

    return c.json({ residents: rows });
  });

  // PATCH /v1/admin/residents/:id — currently scoped to avatarUrl. Pass null to
  // clear. Other fields can be added here later; the schema gate keeps it tight.
  r.patch('/residents/:id', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    const parsed = residentPatchSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    if (parsed.data.avatarUrl === undefined) {
      return c.json({ error: 'no_fields_to_update' }, 400);
    }

    const [updated] = await db
      .update(schema.residents)
      .set({ avatarUrl: parsed.data.avatarUrl })
      .where(eq(schema.residents.id, id))
      .returning();
    if (!updated) return c.json({ error: 'resident_not_found' }, 404);

    return c.json({ resident: updated });
  });

  // POST /v1/admin/residents/:id/kill — admin-induced early death. Goes through
  // the same killResident path the tick worker uses, so the death is permanent,
  // archived in library_of_souls, and triggers epitaph letters.
  r.post('/residents/:id/kill', async (c) => {
    const id = c.req.param('id');
    const [resident] = await db
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, id))
      .limit(1);
    if (!resident) return c.json({ error: 'resident_not_found' }, 404);
    if (resident.status === 'dead') {
      return c.json({ error: 'already_dead' }, 409);
    }

    const now = new Date();
    await db.transaction(async (tx) => {
      await killResident(tx, resident, 'admin', now);
    });

    return c.json({ ok: true, residentId: id, diedAt: now.toISOString() });
  });

  return r;
}
