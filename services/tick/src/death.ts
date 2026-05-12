import { eq } from 'drizzle-orm';
import { schema, type Db } from '@nullv2/db';
import { FACTIONS } from '@nullv2/types';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Resident = typeof schema.residents.$inferSelect;

export type DeathCause = 'lifespan' | 'attention';

function factionName(faction: string): string {
  return (FACTIONS as Record<string, { name: string } | undefined>)[faction]?.name ?? faction;
}

function composeEpitaph(resident: Resident, livedTicks: number, cause: DeathCause): string {
  const persona = resident.persona.length > 200 ? resident.persona.slice(0, 200) : resident.persona;
  return `${resident.name}, of the ${factionName(resident.faction)}. Born ${resident.bornAt.toISOString()}, archived after ${livedTicks} ticks.\nDied of ${cause}. ${persona}`;
}

export async function killResident(
  tx: Tx,
  resident: Resident,
  cause: DeathCause,
  now: Date,
): Promise<void> {
  const livedTicks = resident.lifespanTicksTotal - Math.max(0, resident.lifespanTicksRemaining);
  const epitaph = composeEpitaph(resident, livedTicks, cause);

  await tx
    .update(schema.residents)
    .set({ status: 'dead', deathCause: cause, diedAt: now })
    .where(eq(schema.residents.id, resident.id));

  await tx.insert(schema.residentMemories).values({
    residentId: resident.id,
    kind: 'death',
    content: `Died of ${cause} after ${livedTicks} ticks.`,
  });

  await tx.insert(schema.libraryOfSouls).values({
    residentId: resident.id,
    name: resident.name,
    faction: resident.faction,
    ownerHumanId: resident.ownerHumanId,
    epitaph,
    livedTicks,
    deathCause: cause,
  });
}
