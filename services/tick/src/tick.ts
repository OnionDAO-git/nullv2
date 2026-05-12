import { eq, and } from 'drizzle-orm';
import { schema, type Db } from '@nullv2/db';
import { killResident } from './death.ts';

type Resident = typeof schema.residents.$inferSelect;

export interface TickResult {
  processed: number;
  deaths: number;
  errors: number;
  durationMs: number;
}

export async function runTick(db: Db): Promise<TickResult> {
  const startedAt = Date.now();
  const alive: Resident[] = await db
    .select()
    .from(schema.residents)
    .where(eq(schema.residents.status, 'alive'));

  let deaths = 0;
  let errors = 0;

  for (const resident of alive) {
    try {
      const died = await tickResident(db, resident);
      if (died) deaths++;
    } catch (err) {
      errors++;
      console.error(`[tick] resident ${resident.id} failed:`, err);
    }
  }

  return { processed: alive.length, deaths, errors, durationMs: Date.now() - startedAt };
}

// Per-resident transaction. Guarded by a status=alive predicate on the UPDATE so a
// duplicate tick (e.g. crash+restart) cannot double-decrement a resident the previous
// run already killed.
async function tickResident(db: Db, resident: Resident): Promise<boolean> {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(schema.residents)
      .set({
        lifespanTicksRemaining: resident.lifespanTicksRemaining - 1,
        attentionBalance: resident.attentionBalance - 1,
      })
      .where(and(eq(schema.residents.id, resident.id), eq(schema.residents.status, 'alive')))
      .returning();

    const row = updated[0];
    if (!row) return false;

    await tx.insert(schema.attentionLedger).values({
      residentId: row.id,
      delta: -1,
      reason: 'tick_decay',
    });

    const now = new Date();
    if (row.lifespanTicksRemaining <= 0) {
      await killResident(tx, row, 'lifespan', now);
      return true;
    }
    if (row.attentionBalance <= 0) {
      await killResident(tx, row, 'attention', now);
      return true;
    }
    return false;
  });
}
