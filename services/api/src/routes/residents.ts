import { Hono } from 'hono';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import { schema } from '@nullv2/db';
import {
  RESOURCES,
  RESOURCE_IDS,
  type Resource,
  type ResourceId,
  standingFromPoints,
  meetsStanding,
} from '@nullv2/types';

const chatBodySchema = z.object({
  message: z.string().min(1).max(2000),
  shardsOffered: z.number().int().nonnegative(),
  requestedResourceId: z
    .enum(RESOURCE_IDS as unknown as [ResourceId, ...ResourceId[]])
    .optional(),
});

interface InferenceReply {
  content: string;
}

async function callInference(residentId: string, humanMessage: string): Promise<InferenceReply> {
  const base = process.env.INFERENCE_URL ?? 'http://localhost:3102';
  const res = await fetch(`${base}/v1/inference/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ residentId, humanMessage }),
  });
  if (!res.ok) {
    throw new Error(`inference_failed:${res.status}`);
  }
  const json = (await res.json()) as Partial<InferenceReply>;
  if (typeof json.content !== 'string' || !json.content) {
    throw new Error('inference_invalid_reply');
  }
  return { content: json.content };
}

export function residentsRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  r.get('/', async (c) => {
    const rows = await db
      .select({
        id: schema.residents.id,
        name: schema.residents.name,
        faction: schema.residents.faction,
        status: schema.residents.status,
        attentionBalance: schema.residents.attentionBalance,
        lifespanTicksRemaining: schema.residents.lifespanTicksRemaining,
        ownerHumanId: schema.residents.ownerHumanId,
      })
      .from(schema.residents)
      .where(eq(schema.residents.status, 'alive'))
      .orderBy(schema.residents.faction, schema.residents.name);

    return c.json({ residents: rows });
  });

  r.get('/:id', async (c) => {
    const id = c.req.param('id');
    const { human } = c.get('visitor');

    const [resident] = await db
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, id))
      .limit(1);
    if (!resident) {
      return c.json({ error: 'resident_not_found' }, 404);
    }

    const messages = await db
      .select()
      .from(schema.residentMessages)
      .where(eq(schema.residentMessages.residentId, id))
      .orderBy(desc(schema.residentMessages.createdAt))
      .limit(12);

    // Reverse to chronological for client convenience.
    const recentMessages = messages.slice().reverse();

    const [standingRow] = await db
      .select()
      .from(schema.factionStanding)
      .where(
        and(
          eq(schema.factionStanding.humanId, human.id),
          eq(schema.factionStanding.faction, resident.faction),
        ),
      )
      .limit(1);

    const points = standingRow?.points ?? 0;
    const tier = standingFromPoints(points);

    const canAfford: Partial<Record<ResourceId, boolean>> = {};
    for (const rid of RESOURCE_IDS) {
      const res = RESOURCES[rid];
      if (!res || res.faction !== resident.faction) continue;
      canAfford[rid] =
        human.shardBalance >= res.shardCost && meetsStanding(tier, res.minStanding);
    }

    return c.json({
      resident,
      recentMessages,
      standing: { points, tier },
      canAfford,
    });
  });

  r.post('/:id/chat', async (c) => {
    const id = c.req.param('id');
    const { human } = c.get('visitor');

    const body = await c.req.json().catch(() => null);
    const parsed = chatBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    const { message, shardsOffered, requestedResourceId } = parsed.data;

    const [resident] = await db
      .select()
      .from(schema.residents)
      .where(eq(schema.residents.id, id))
      .limit(1);
    if (!resident) {
      return c.json({ error: 'resident_not_found' }, 404);
    }
    if (resident.status === 'dead') {
      return c.json({ error: 'resident_dead' }, 410);
    }

    const [freshHuman] = await db
      .select()
      .from(schema.humans)
      .where(eq(schema.humans.id, human.id))
      .limit(1);
    if (!freshHuman) {
      return c.json({ error: 'human_not_found' }, 404);
    }
    if (freshHuman.shardBalance < shardsOffered) {
      return c.json({ error: 'insufficient_shards' }, 400);
    }

    let resource: Resource | null = null;
    if (requestedResourceId) {
      const found = RESOURCES[requestedResourceId];
      if (!found) {
        return c.json({ error: 'resource_not_found' }, 404);
      }
      resource = found;
      if (resource.faction !== resident.faction) {
        return c.json({ error: 'resource_faction_mismatch' }, 400);
      }
      if (shardsOffered < resource.shardCost) {
        return c.json({ error: 'shards_below_resource_cost' }, 400);
      }

      const [standingRow] = await db
        .select()
        .from(schema.factionStanding)
        .where(
          and(
            eq(schema.factionStanding.humanId, human.id),
            eq(schema.factionStanding.faction, resident.faction),
          ),
        )
        .limit(1);
      const currentTier = standingFromPoints(standingRow?.points ?? 0);
      if (!meetsStanding(currentTier, resource.minStanding)) {
        return c.json({ error: 'standing_too_low', required: resource.minStanding }, 403);
      }
    }

    // Inference happens BEFORE the transaction so a failure doesn't poison the write set.
    let reply: InferenceReply;
    try {
      reply = await callInference(resident.id, message);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'inference_failed';
      return c.json({ error: 'inference_failed', detail }, 502);
    }

    const reason = resource ? 'resource_purchase' : 'chat_attention';

    const result = await db.transaction(async (tx) => {
      let grantedResource:
        | { resourceId: ResourceId; quantity: number; shardsPaid: number }
        | null = null;

      if (resource) {
        await tx.insert(schema.resourceGrants).values({
          residentId: resident.id,
          humanId: human.id,
          resourceId: resource.id,
          quantity: 1,
          shardsPaid: shardsOffered,
        });

        await tx
          .insert(schema.resourceInventory)
          .values({
            humanId: human.id,
            resourceId: resource.id,
            quantity: 1,
          })
          .onConflictDoUpdate({
            target: [schema.resourceInventory.humanId, schema.resourceInventory.resourceId],
            set: {
              quantity: sql`${schema.resourceInventory.quantity} + 1`,
              updatedAt: new Date(),
            },
          });

        grantedResource = { resourceId: resource.id, quantity: 1, shardsPaid: shardsOffered };
      }

      const [debited] = await tx
        .update(schema.humans)
        .set({
          shardBalance: sql`${schema.humans.shardBalance} - ${shardsOffered}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.humans.id, human.id))
        .returning();
      if (!debited) throw new Error('chat: failed to debit shards');

      if (shardsOffered > 0) {
        await tx.insert(schema.shardLedger).values({
          humanId: human.id,
          delta: -shardsOffered,
          reason,
          refKind: resource ? 'resource' : 'resident',
          refId: resource ? resource.id : resident.id,
        });
      }

      const [creditedResident] = await tx
        .update(schema.residents)
        .set({
          attentionBalance: sql`${schema.residents.attentionBalance} + ${shardsOffered}`,
        })
        .where(eq(schema.residents.id, resident.id))
        .returning();
      if (!creditedResident) throw new Error('chat: failed to credit resident attention');

      if (shardsOffered > 0) {
        await tx.insert(schema.attentionLedger).values({
          residentId: resident.id,
          delta: shardsOffered,
          sourceHumanId: human.id,
          reason,
        });
      }

      const [standing] = await tx
        .insert(schema.factionStanding)
        .values({
          humanId: human.id,
          faction: resident.faction,
          points: shardsOffered,
        })
        .onConflictDoUpdate({
          target: [schema.factionStanding.humanId, schema.factionStanding.faction],
          set: {
            points: sql`${schema.factionStanding.points} + ${shardsOffered}`,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!standing) throw new Error('chat: failed to upsert faction standing');

      await tx.insert(schema.residentMessages).values({
        residentId: resident.id,
        humanId: human.id,
        speaker: 'human',
        channel: 'chat',
        content: message,
      });

      const [residentMsg] = await tx
        .insert(schema.residentMessages)
        .values({
          residentId: resident.id,
          humanId: human.id,
          speaker: 'resident',
          channel: 'chat',
          content: reply.content,
        })
        .returning();
      if (!residentMsg) throw new Error('chat: failed to insert resident reply');

      const memorySummary = `${message} -> ${reply.content.slice(0, 80)}`;
      await tx.insert(schema.residentMemories).values({
        residentId: resident.id,
        kind: 'interaction',
        content: memorySummary,
      });

      return {
        residentMessage: residentMsg,
        grantedResource,
        newShardBalance: debited.shardBalance,
        residentAttention: creditedResident.attentionBalance,
        standing: { points: standing.points, tier: standingFromPoints(standing.points) },
      };
    });

    return c.json({
      residentMessage: { speaker: 'resident' as const, content: result.residentMessage.content },
      grantedResource: result.grantedResource,
      newShardBalance: result.newShardBalance,
      residentAttention: result.residentAttention,
      standing: result.standing,
    });
  });

  return r;
}
