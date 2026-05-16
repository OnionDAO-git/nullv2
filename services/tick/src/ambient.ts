import { and, desc, eq, gt, inArray, isNotNull, sql } from 'drizzle-orm';
import { schema, type Db } from '@nullv2/db';
import { completeAmbientForResident } from '@nullv2/inference/lib';
import {
  ambientSpeakProbability,
  computeNeeds,
  type NeedId,
  type NeedsSnapshot,
} from '@nullv2/types';

type Resident = typeof schema.residents.$inferSelect;

const DEFAULT_MAX_PER_TICK = 8;

export interface AmbientResult {
  attempted: number;
  succeeded: number;
  failed: number;
  /** Histogram of how often each need was dominant in this tick's speakers. */
  dominantHist: Record<NeedId, number>;
}

interface SpeakCandidate {
  resident: Resident;
  needs: NeedsSnapshot;
  probability: number;
}

/**
 * Needs-driven ambient phase.
 *
 * 1. Batch-fetch each alive resident's last-message timestamp and a per-room
 *    recent-deaths count (single query each, no per-resident round trips).
 * 2. Run `computeNeeds` per resident, derive `ambientSpeakProbability` from
 *    agitation.
 * 3. Sort by probability desc, then random-roll each until `maxPerTick` have
 *    fired or the candidates are exhausted.
 * 4. Pass the dominant need into the inference call so the ambient line is
 *    tone-matched.
 */
export async function runAmbient(
  db: Db,
  alive: Resident[],
  opts?: { maxPerTick?: number; tickIntervalMs?: number },
): Promise<AmbientResult> {
  const maxPerTick = opts?.maxPerTick ?? DEFAULT_MAX_PER_TICK;
  const tickIntervalMs =
    opts?.tickIntervalMs ?? Number(process.env.TICK_INTERVAL_MS ?? 5 * 60 * 1000);
  const deathWindowMs = 12 * tickIntervalMs;

  const dominantHist: Record<NeedId, number> = {
    hunger: 0,
    safety: 0,
    social: 0,
    purpose: 0,
  };

  if (alive.length === 0) {
    return { attempted: 0, succeeded: 0, failed: 0, dominantHist };
  }

  // Batch input data.
  const residentIds = alive.map((r) => r.id);
  const roomIds = Array.from(new Set(alive.map((r) => r.roomId)));

  const [lastMsgRows, deathRows] = await Promise.all([
    db
      .select({
        residentId: schema.residentMessages.residentId,
        lastAt: sql<Date>`max(${schema.residentMessages.createdAt})`,
      })
      .from(schema.residentMessages)
      .where(inArray(schema.residentMessages.residentId, residentIds))
      .groupBy(schema.residentMessages.residentId),
    db
      .select({
        roomId: schema.residents.roomId,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.residents)
      .where(
        and(
          eq(schema.residents.status, 'dead'),
          inArray(schema.residents.roomId, roomIds),
          isNotNull(schema.residents.diedAt),
          gt(schema.residents.diedAt, new Date(Date.now() - deathWindowMs)),
        ),
      )
      .groupBy(schema.residents.roomId),
  ]);

  const lastByResident = new Map<string, Date>();
  for (const r of lastMsgRows) lastByResident.set(r.residentId, r.lastAt as Date);
  const deathsByRoom = new Map<string, number>();
  for (const r of deathRows) deathsByRoom.set(r.roomId, r.count);

  // Compute need pressures + speak probability.
  const candidates: SpeakCandidate[] = alive.map((resident) => {
    const needs = computeNeeds({
      attentionBalance: resident.attentionBalance,
      lifespanTicksRemaining: resident.lifespanTicksRemaining,
      goals: resident.goals,
      lastInteractionAt: lastByResident.get(resident.id) ?? null,
      recentDeathsInRoom: deathsByRoom.get(resident.roomId) ?? 0,
      tickIntervalMs,
    });
    return {
      resident,
      needs,
      probability: ambientSpeakProbability(needs.agitation),
    };
  });

  // Highest agitation first.
  candidates.sort((a, b) => b.probability - a.probability);

  let attempted = 0;
  let succeeded = 0;
  let failed = 0;

  for (const candidate of candidates) {
    if (succeeded >= maxPerTick) break;
    if (Math.random() > candidate.probability) continue;

    attempted += 1;
    dominantHist[candidate.needs.dominant] += 1;
    try {
      const reply = await completeAmbientForResident(db, candidate.resident.id, {
        spark: { dominant: candidate.needs.dominant, urgent: candidate.needs.urgent },
      });
      const content = reply.content.trim();
      if (!content) {
        failed += 1;
        continue;
      }
      await db.insert(schema.residentMessages).values({
        residentId: candidate.resident.id,
        humanId: null,
        speaker: 'resident',
        channel: 'shout',
        content,
        roomId: candidate.resident.roomId,
      });
      await db.insert(schema.residentMemories).values({
        residentId: candidate.resident.id,
        kind: 'reflection',
        content: `(${candidate.needs.dominant}) ${content.slice(0, 200)}`,
      });
      succeeded += 1;
    } catch (err) {
      failed += 1;
      console.warn(
        `[tick.ambient] resident ${candidate.resident.id} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return { attempted, succeeded, failed, dominantHist };
}

export function runAmbientDisabled(): AmbientResult {
  return {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    dominantHist: { hunger: 0, safety: 0, social: 0, purpose: 0 },
  };
}

export function ambientEnabledFromEnv(): boolean {
  return process.env.TICK_AMBIENT !== 'off';
}
