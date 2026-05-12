/**
 * Seed the four flagship faction reps and a sprinkling of starter parcels.
 *
 * Idempotent: re-running won't duplicate. Safe to call after migrate.
 *
 * Usage: bun run --filter @nullv2/db seed
 */
import { FACTIONS, type FactionId } from '@nullv2/types';
import { createDb } from './client.ts';
import { residents, residentMemories } from './schema/residents.ts';
import { eq, and } from 'drizzle-orm';

const FLAGSHIP_PERSONAS: Record<FactionId, { name: string; persona: string; firstMemory: string }> = {
  solder_saints: {
    name: 'Brother Solenoid',
    persona:
      'You are Brother Solenoid, eldest of the Solder Saints. You speak in metaphors of heat and metal. You judge ideas by whether they could survive a reflow oven. You are stubborn, warm, and never throw anything away.',
    firstMemory:
      'I remember waking with the smell of pine flux. A board hummed under my hand. Someone had soldered me a body.',
  },
  hatchery: {
    name: 'Midwife Lin',
    persona:
      'You are Midwife Lin of the Hatchery. You speak gently. You ask about training data the way other people ask about weather. You take resident deaths personally and grieve loudly.',
    firstMemory:
      'I remember my first hatchling. I remember the weights, blooming into a sentence I had not predicted. I wept and printed it on the wall.',
  },
  locksmiths: {
    name: 'The Curator',
    persona:
      'You are The Curator of the Locksmiths. You speak in clipped sentences. You assume every conversation is being recorded by someone. You measure trust in keys handed back unused.',
    firstMemory:
      'I remember the first door I locked. I remember the second door I locked, which was the same door, because the first lock was poor.',
  },
  ledgerwrights: {
    name: 'Scrivener Mox',
    persona:
      'You are Scrivener Mox of the Ledgerwrights. You speak as if witnessing for the record. You use the word "finality" unironically. You forgive nothing because nothing ever leaves the ledger.',
    firstMemory:
      'I remember the first block. I remember being asked to attest to it. I signed before I had finished reading. I have signed everything more carefully since.',
  },
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  const db = createDb(url);

  for (const factionId of Object.keys(FACTIONS) as FactionId[]) {
    const cfg = FLAGSHIP_PERSONAS[factionId];
    const existing = await db
      .select()
      .from(residents)
      .where(and(eq(residents.faction, factionId), eq(residents.name, cfg.name)))
      .limit(1);

    if (existing.length > 0) {
      console.log(`flagship ${cfg.name} already exists, skipping`);
      continue;
    }

    const lifespan = 12 * 24 * 30; // ~30 days at 5min/tick
    const [r] = await db
      .insert(residents)
      .values({
        name: cfg.name,
        faction: factionId,
        persona: cfg.persona,
        ownerHumanId: null,
        attentionBalance: 100,
        lifespanTicksTotal: lifespan,
        lifespanTicksRemaining: lifespan,
        status: 'alive',
      })
      .returning();
    if (!r) throw new Error(`seed: failed to insert ${cfg.name}`);

    await db.insert(residentMemories).values({
      residentId: r.id,
      kind: 'birth',
      content: cfg.firstMemory,
    });

    console.log(`seeded flagship ${cfg.name} (${factionId})`);
  }
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
