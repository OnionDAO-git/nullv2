import { and, desc, eq, gt, isNotNull } from 'drizzle-orm';
import { schema, type Db } from '@nullv2/db';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, type CoreMessage } from 'ai';
import {
  buildSystemPrompt,
  buildAmbientSystemPrompt,
  type SparkContext,
} from './prompt.ts';
import {
  computeNeeds,
  type NeedsSnapshot,
} from '@nullv2/types';

export type CompleteInput = {
  residentId: string;
  humanMessage: string;
  model?: string;
  maxTokens?: number;
};

export type CompleteResult = {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
};

export type CompleteError =
  | { kind: 'not_found' }
  | { kind: 'dead'; status: string };

export class InferenceError extends Error {
  constructor(public readonly detail: CompleteError) {
    super(detail.kind);
  }
}

function readConfig() {
  const baseURL = process.env.INFERENCE_BASE_URL ?? 'https://api.openai.com/v1';
  const apiKey = process.env.INFERENCE_API_KEY ?? '';
  const defaultModel = process.env.INFERENCE_MODEL ?? 'gpt-4o-mini';
  const defaultMaxTokens = Number(process.env.INFERENCE_MAX_TOKENS ?? 400);
  return { baseURL, apiKey, defaultModel, defaultMaxTokens };
}

const HISTORY_LIMIT = 8;
const MEMORY_LIMIT = 5;

export async function completeForResident(
  db: Db,
  input: CompleteInput,
): Promise<CompleteResult> {
  const cfg = readConfig();
  const model = input.model ?? cfg.defaultModel;
  const maxTokens = input.maxTokens ?? cfg.defaultMaxTokens;

  const residents = await db
    .select()
    .from(schema.residents)
    .where(eq(schema.residents.id, input.residentId))
    .limit(1);
  const resident = residents[0];
  if (!resident) throw new InferenceError({ kind: 'not_found' });
  if (resident.status !== 'alive') {
    throw new InferenceError({ kind: 'dead', status: resident.status });
  }

  // Pull newest-first then reverse to feed oldest -> newest into the model.
  const [recentMessagesDesc, memories] = await Promise.all([
    db
      .select()
      .from(schema.residentMessages)
      .where(eq(schema.residentMessages.residentId, resident.id))
      .orderBy(desc(schema.residentMessages.createdAt))
      .limit(HISTORY_LIMIT),
    db
      .select()
      .from(schema.residentMemories)
      .where(eq(schema.residentMemories.residentId, resident.id))
      .orderBy(desc(schema.residentMemories.createdAt))
      .limit(MEMORY_LIMIT),
  ]);
  const history = [...recentMessagesDesc].reverse();

  // Compute SPARK needs to inform tone — cheap: one extra read.
  const needs = await fetchNeedsSnapshot(db, resident);
  const spark: SparkContext = { dominant: needs.dominant, urgent: needs.urgent };

  const system = buildSystemPrompt(resident, memories, spark);
  const messages: CoreMessage[] = history.map((m) => ({
    role: m.speaker === 'human' ? 'user' : 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: input.humanMessage });

  const provider = createOpenAI({ baseURL: cfg.baseURL, apiKey: cfg.apiKey });

  // ai v4 uses `maxTokens`; v5 renamed to `maxOutputTokens`. Stick with v4 per package.json.
  const result = await generateText({
    model: provider(model),
    system,
    messages,
    maxTokens,
  });

  return {
    content: result.text,
    model,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
    finishReason: String(result.finishReason),
  };
}

export function getInferenceConfigPublic() {
  const cfg = readConfig();
  return {
    model: cfg.defaultModel,
    baseURL: cfg.baseURL,
    apiKeyConfigured: cfg.apiKey.length > 0,
  };
}

const AMBIENT_ROOM_HISTORY = 6;
const AMBIENT_MAX_TOKENS = 80;

/**
 * Tick-worker entry point. Generates one ambient line for the resident, based
 * on the last few messages overheard in the resident's room. Throws
 * `InferenceError` if the resident is missing or dead.
 *
 * Distinct from `completeForResident` (1:1 chat). No visitor turn; the model
 * only writes one short utterance. The tick worker computes the SPARK needs
 * snapshot in batch and passes it in via `spark` to avoid double DB work.
 */
export async function completeAmbientForResident(
  db: Db,
  residentId: string,
  opts?: { model?: string; maxTokens?: number; spark?: SparkContext },
): Promise<CompleteResult> {
  const cfg = readConfig();
  const model = opts?.model ?? cfg.defaultModel;
  const maxTokens = opts?.maxTokens ?? AMBIENT_MAX_TOKENS;

  const [resident] = await db
    .select()
    .from(schema.residents)
    .where(eq(schema.residents.id, residentId))
    .limit(1);
  if (!resident) throw new InferenceError({ kind: 'not_found' });
  if (resident.status !== 'alive') {
    throw new InferenceError({ kind: 'dead', status: resident.status });
  }

  // Pull recent room context (any speaker, including humans-via-shout).
  const recentDesc = await db
    .select()
    .from(schema.residentMessages)
    .where(eq(schema.residentMessages.roomId, resident.roomId))
    .orderBy(desc(schema.residentMessages.createdAt))
    .limit(AMBIENT_ROOM_HISTORY);
  const heard = [...recentDesc].reverse();

  let spark = opts?.spark ?? null;
  if (!spark) {
    const needs = await fetchNeedsSnapshot(db, resident);
    spark = { dominant: needs.dominant, urgent: needs.urgent };
  }

  const system = buildAmbientSystemPrompt(resident, heard, spark);
  const provider = createOpenAI({ baseURL: cfg.baseURL, apiKey: cfg.apiKey });

  const result = await generateText({
    model: provider(model),
    system,
    prompt: 'Speak.',
    maxTokens,
  });

  return {
    content: result.text.trim(),
    model,
    usage: {
      promptTokens: result.usage.promptTokens,
      completionTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
    },
    finishReason: String(result.finishReason),
  };
}

const TICK_INTERVAL_MS_DEFAULT = 5 * 60 * 1000;
const DEATH_WINDOW_MS = 12 * TICK_INTERVAL_MS_DEFAULT;

/**
 * One-shot needs snapshot fetcher, used by the chat path. The tick worker
 * computes needs in a single batched pass instead of calling this per-resident.
 */
async function fetchNeedsSnapshot(
  db: Db,
  resident: typeof schema.residents.$inferSelect,
): Promise<NeedsSnapshot> {
  const tickIntervalMs = Number(process.env.TICK_INTERVAL_MS ?? TICK_INTERVAL_MS_DEFAULT);

  const [lastMessage] = await db
    .select({ createdAt: schema.residentMessages.createdAt })
    .from(schema.residentMessages)
    .where(eq(schema.residentMessages.residentId, resident.id))
    .orderBy(desc(schema.residentMessages.createdAt))
    .limit(1);

  const since = new Date(Date.now() - DEATH_WINDOW_MS);
  const recentDeathRows = await db
    .select({ id: schema.residents.id })
    .from(schema.residents)
    .where(
      and(
        eq(schema.residents.roomId, resident.roomId),
        eq(schema.residents.status, 'dead'),
        isNotNull(schema.residents.diedAt),
        gt(schema.residents.diedAt, since),
      ),
    );

  return computeNeeds({
    attentionBalance: resident.attentionBalance,
    lifespanTicksRemaining: resident.lifespanTicksRemaining,
    goals: resident.goals,
    lastInteractionAt: lastMessage?.createdAt ?? null,
    recentDeathsInRoom: recentDeathRows.length,
    tickIntervalMs,
  });
}
