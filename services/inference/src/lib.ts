import { desc, eq } from 'drizzle-orm';
import { schema, type Db } from '@nullv2/db';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, type CoreMessage } from 'ai';
import { buildSystemPrompt } from './prompt.ts';

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

  const system = buildSystemPrompt(resident, memories);
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
