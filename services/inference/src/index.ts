import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { getDb } from '@nullv2/db';
import {
  completeForResident,
  getInferenceConfigPublic,
  InferenceError,
} from './lib.ts';

const app = new Hono();
app.use('*', logger());

app.get('/healthz', (c) => {
  const cfg = getInferenceConfigPublic();
  return c.json({ ok: true, model: cfg.model, baseURL: cfg.baseURL, apiKeyConfigured: cfg.apiKeyConfigured });
});

const completeSchema = z.object({
  residentId: z.string().uuid(),
  humanMessage: z.string().min(1).max(4000),
  model: z.string().min(1).max(128).optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
});

const db = getDb();

app.post('/v1/inference/complete', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.issues }, 400);
  }

  try {
    const result = await completeForResident(db, parsed.data);
    return c.json(result);
  } catch (err) {
    if (err instanceof InferenceError) {
      if (err.detail.kind === 'not_found') return c.json({ error: 'resident_not_found' }, 404);
      if (err.detail.kind === 'dead') {
        return c.json({ error: 'resident_not_alive', status: err.detail.status }, 410);
      }
    }
    console.error('[nullv2-inference] complete failed', err);
    return c.json({ error: 'inference_failed' }, 502);
  }
});

const port = Number(process.env.INFERENCE_PORT ?? 3102);
console.log(`[nullv2-inference] listening on :${port}`);

export default { port, fetch: app.fetch };
