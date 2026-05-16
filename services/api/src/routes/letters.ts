import { Hono } from 'hono';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema } from '@nullv2/db';

const LIST_LIMIT = 80;

export function lettersRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  // GET /v1/letters — list latest letters (unarchived first).
  r.get('/', async (c) => {
    const { human } = c.get('visitor');

    const rows = await db
      .select()
      .from(schema.letters)
      .where(
        and(
          eq(schema.letters.humanId, human.id),
          isNull(schema.letters.archivedAt),
        ),
      )
      .orderBy(desc(schema.letters.createdAt))
      .limit(LIST_LIMIT);

    const totalRow = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.letters)
      .where(eq(schema.letters.humanId, human.id));
    const unreadRow = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.letters)
      .where(
        and(
          eq(schema.letters.humanId, human.id),
          isNull(schema.letters.readAt),
          isNull(schema.letters.archivedAt),
        ),
      );

    return c.json({
      letters: rows,
      total: totalRow[0]?.count ?? 0,
      unread: unreadRow[0]?.count ?? 0,
    });
  });

  // GET /v1/letters/:id — fetch one and mark it read.
  r.get('/:id', async (c) => {
    const { human } = c.get('visitor');
    const id = c.req.param('id');

    const [row] = await db
      .select()
      .from(schema.letters)
      .where(and(eq(schema.letters.id, id), eq(schema.letters.humanId, human.id)))
      .limit(1);
    if (!row) return c.json({ error: 'letter_not_found' }, 404);

    if (!row.readAt) {
      await db
        .update(schema.letters)
        .set({ readAt: new Date() })
        .where(eq(schema.letters.id, row.id));
      row.readAt = new Date();
    }

    return c.json({ letter: row });
  });

  // POST /v1/letters/:id/archive — soft-remove from list.
  r.post('/:id/archive', async (c) => {
    const { human } = c.get('visitor');
    const id = c.req.param('id');

    const result = await db
      .update(schema.letters)
      .set({ archivedAt: new Date() })
      .where(and(eq(schema.letters.id, id), eq(schema.letters.humanId, human.id)))
      .returning();
    if (result.length === 0) return c.json({ error: 'letter_not_found' }, 404);

    return c.json({ ok: true });
  });

  // POST /v1/letters/mark-all-read — flush unread badge.
  r.post('/mark-all-read', async (c) => {
    const { human } = c.get('visitor');
    await db
      .update(schema.letters)
      .set({ readAt: new Date() })
      .where(
        and(eq(schema.letters.humanId, human.id), isNull(schema.letters.readAt)),
      );
    return c.json({ ok: true });
  });

  return r;
}
