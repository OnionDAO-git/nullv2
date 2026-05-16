import type { PageServerLoad } from './$types';
import { and, desc, eq, gt } from 'drizzle-orm';
import { schema } from '@nullv2/db';
import { BIRTH_COOLDOWN_MS } from '@nullv2/types';
import { db } from '$lib/server/db';

export interface PriorBirth {
  id: string;
  name: string;
  faction: string;
  emotion: string;
  status: string;
}

export const load: PageServerLoad = async ({ locals }) => {
  const visitor = locals.visitor;
  if (!visitor) return { priorBirths: [] as PriorBirth[], cooldownUntil: null };

  const me = visitor.human;

  const priorRows = await db
    .select({
      id: schema.residents.id,
      name: schema.residents.name,
      faction: schema.residents.faction,
      emotion: schema.residents.emotion,
      status: schema.residents.status,
      bornAt: schema.residents.bornAt,
    })
    .from(schema.residents)
    .where(eq(schema.residents.ownerHumanId, me.id))
    .orderBy(desc(schema.residents.bornAt))
    .limit(10);

  // Cooldown: any birth within the last BIRTH_COOLDOWN_MS.
  const since = new Date(Date.now() - BIRTH_COOLDOWN_MS);
  const [recent] = await db
    .select({ bornAt: schema.residents.bornAt })
    .from(schema.residents)
    .where(
      and(
        eq(schema.residents.ownerHumanId, me.id),
        gt(schema.residents.bornAt, since),
      ),
    )
    .orderBy(desc(schema.residents.bornAt))
    .limit(1);

  const cooldownUntil = recent
    ? new Date(recent.bornAt.getTime() + BIRTH_COOLDOWN_MS).toISOString()
    : null;

  return {
    priorBirths: priorRows.map((r) => ({
      id: r.id,
      name: r.name,
      faction: r.faction,
      emotion: r.emotion,
      status: r.status,
    })) as PriorBirth[],
    cooldownUntil,
  };
};
