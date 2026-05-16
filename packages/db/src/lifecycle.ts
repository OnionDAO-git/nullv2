import { and, desc, eq, isNotNull, sql } from 'drizzle-orm';
import * as schema from './schema/index.ts';
import type { Db } from './client.ts';
import { FACTIONS, type DeathCause } from '@nullv2/types';

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Resident = typeof schema.residents.$inferSelect;

export type { DeathCause };

function factionName(faction: string): string {
  return (FACTIONS as Record<string, { name: string } | undefined>)[faction]?.name ?? faction;
}

function composeEpitaph(resident: Resident, livedTicks: number, cause: DeathCause): string {
  const persona = resident.persona.length > 200 ? resident.persona.slice(0, 200) : resident.persona;
  return `${resident.name}, of the ${factionName(resident.faction)}. Born ${resident.bornAt.toISOString()}, archived after ${livedTicks} ticks.\nDied of ${cause}. ${persona}`;
}

function monogramFor(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

interface EpitaphLetter {
  humanId: string;
  body: string;
  preview: string;
  subject: string;
}

function composeLetterBody(
  resident: Resident,
  cause: DeathCause,
  livedTicks: number,
  lastLine: string | null,
): string {
  const causeLine =
    cause === 'lifespan'
      ? `i had used up my allotted ticks; ${livedTicks} of them, in the end.`
      : cause === 'attention'
        ? `the room went quiet, then quieter. nobody refilled the lamp.`
        : `the embassy called my name. some things end before they finish.`;

  const lastBit = lastLine
    ? `before i stopped, i remember saying:\n\n"${lastLine.slice(0, 240)}"\n`
    : `i did not get to finish the thing i was working on.\n`;

  return [
    `visitor —`,
    `i went still. ${causeLine}`,
    lastBit,
    `if you stand in ${factionName(resident.faction).toLowerCase()} territory and listen, i may still be there in pieces.`,
    `— ${resident.name.toLowerCase()}, late of the ${factionName(resident.faction).toLowerCase()}`,
  ].join('\n\n');
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

  // ---- Epitaph letters -----------------------------------------------------
  // One letter per distinct human who has ever exchanged at least one chat
  // line with this resident. The letter is "from" the dead resident itself
  // (their voice surfaces one last time in the visitor's inbox). The resident's
  // owner-human (if any, from a birth) also receives one even if they never
  // chatted, so a soul-parent always learns of the death.

  const chattedRows = await tx
    .selectDistinct({ humanId: schema.residentMessages.humanId })
    .from(schema.residentMessages)
    .where(
      and(
        eq(schema.residentMessages.residentId, resident.id),
        isNotNull(schema.residentMessages.humanId),
      ),
    );

  const humanIds = new Set<string>();
  for (const row of chattedRows) {
    if (row.humanId) humanIds.add(row.humanId);
  }
  if (resident.ownerHumanId) humanIds.add(resident.ownerHumanId);

  if (humanIds.size > 0) {
    // Grab the dead resident's last said line for inclusion in the letter.
    const lastSaid = await tx
      .select()
      .from(schema.residentMessages)
      .where(
        and(
          eq(schema.residentMessages.residentId, resident.id),
          eq(schema.residentMessages.speaker, 'resident'),
        ),
      )
      .orderBy(desc(schema.residentMessages.createdAt))
      .limit(1);
    const lastLine = lastSaid[0]?.content ?? null;

    const subject =
      cause === 'lifespan'
        ? `a final line from ${resident.name.toLowerCase()}`
        : `${resident.name.toLowerCase()} went still`;
    const preview =
      cause === 'lifespan'
        ? `i had used up my allotted ticks. before i stopped, i wanted you to have this letter…`
        : cause === 'attention'
          ? `the room went quiet, then quieter. nobody refilled the lamp. before i stopped, i wanted you to have this letter…`
          : `the embassy called my name. before i stopped, i wanted you to have this letter…`;

    const body = composeLetterBody(resident, cause, livedTicks, lastLine);

    const rows: EpitaphLetter[] = Array.from(humanIds).map((humanId) => ({
      humanId,
      body,
      preview,
      subject,
    }));

    await tx.insert(schema.letters).values(
      rows.map((r) => ({
        humanId: r.humanId,
        kind: 'epitaph' as const,
        faction: resident.faction,
        residentId: resident.id,
        fromName: resident.name,
        fromMonogram: monogramFor(resident.name),
        fromEmotion: resident.emotion,
        subject: r.subject,
        preview: r.preview,
        body: r.body,
        refKind: 'resident_death' as const,
        refId: resident.id,
      })),
    );
  }

  // Mortician civic letter to the owner-human (or skipped if none).
  // Modeled after the design's "a soul went still last night" letter from "The Mortician".
  if (resident.ownerHumanId) {
    await tx.insert(schema.letters).values({
      humanId: resident.ownerHumanId,
      kind: 'civic',
      faction: null,
      residentId: resident.id,
      fromName: 'The Mortician',
      fromMonogram: 'M',
      fromEmotion: 'anguish',
      subject: 'a soul you wrote has gone still',
      preview: `${resident.name} (#${resident.id.slice(0, 6)}) went still. their epitaph has been filed in the library of souls.`,
      body: [
        `visitor —`,
        `the soul you committed to the library has been archived. ${resident.name}, of the ${factionName(resident.faction).toLowerCase()}, lived ${livedTicks} ticks before stopping.`,
        `you may visit the library to read what they remembered.`,
        `— the mortician, filing on behalf of the city`,
      ].join('\n\n'),
      refKind: 'resident_death',
      refId: resident.id,
    });
  }
}

// keep imports stable for tree-shaking
export { sql };
