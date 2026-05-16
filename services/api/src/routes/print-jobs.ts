import { Hono } from 'hono';
import { asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdmin, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema, external } from '@nullv2/db';
import {
  ACHIEVEMENTS,
  PRINT_JOB_TRANSITION_IDS,
  isPrintJobTerminal,
  type AchievementId,
  type PrintJobTransition,
} from '@nullv2/types';

const statusBodySchema = z.object({
  status: z.enum(PRINT_JOB_TRANSITION_IDS as unknown as [PrintJobTransition, ...PrintJobTransition[]]),
  notes: z.string().max(500).optional(),
});

export function printJobsRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireAdmin(db));

  r.get('/', async (c) => {
    const rows = await db
      .select({
        id: schema.printJobs.id,
        humanId: schema.printJobs.humanId,
        achievementId: schema.printJobs.achievementId,
        status: schema.printJobs.status,
        claimCode: schema.printJobs.claimCode,
        notes: schema.printJobs.notes,
        createdAt: schema.printJobs.createdAt,
        completedAt: schema.printJobs.completedAt,
        userId: schema.humans.userId,
        humanName: external.users.name,
        humanEmail: external.users.email,
      })
      .from(schema.printJobs)
      .leftJoin(schema.humans, eq(schema.humans.id, schema.printJobs.humanId))
      .leftJoin(external.users, eq(external.users.id, schema.humans.userId))
      .where(inArray(schema.printJobs.status, ['queued', 'printing']))
      .orderBy(asc(schema.printJobs.createdAt));

    const jobs = rows.map((row) => ({
      id: row.id,
      humanId: row.humanId,
      humanName: row.humanName,
      humanEmail: row.humanEmail,
      status: row.status,
      claimCode: row.claimCode,
      notes: row.notes,
      createdAt: row.createdAt,
      completedAt: row.completedAt,
      achievementId: row.achievementId as AchievementId,
      achievement: ACHIEVEMENTS[row.achievementId as AchievementId] ?? null,
    }));

    return c.json({ jobs });
  });

  r.post('/:id/status', async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => null);
    const parsed = statusBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    const { status, notes } = parsed.data;

    const [existing] = await db
      .select()
      .from(schema.printJobs)
      .where(eq(schema.printJobs.id, id))
      .limit(1);
    if (!existing) {
      return c.json({ error: 'print_job_not_found' }, 404);
    }

    const completedAt: Date | null = isPrintJobTerminal(status) ? new Date() : existing.completedAt;

    const [updated] = await db
      .update(schema.printJobs)
      .set({
        status,
        notes: notes ?? existing.notes,
        completedAt,
      })
      .where(eq(schema.printJobs.id, id))
      .returning();

    return c.json({ job: updated });
  });

  return r;
}
