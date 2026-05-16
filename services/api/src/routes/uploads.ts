import { Hono } from 'hono';
import { z } from 'zod';
import { requireVisitor, type AuthVars } from '@nullv2/auth/hono';
import type { Db } from '@nullv2/db';
import {
  ALLOWED_AVATAR_TYPES,
  isAllowedAvatarType,
  presignAvatarUpload,
} from '../lib/storage.ts';

const presignBodySchema = z.object({
  kind: z.literal('resident_avatar'),
  contentType: z.enum(
    ALLOWED_AVATAR_TYPES as unknown as [string, ...string[]],
  ),
});

export function uploadsRoute(db: Db) {
  const r = new Hono<{ Variables: AuthVars }>();
  r.use('*', requireVisitor(db));

  // POST /v1/uploads/presign — issue a short-lived signed PUT URL.
  // Browser does the upload directly; the resulting publicUrl is what
  // gets stored on the resident row.
  r.post('/presign', async (c) => {
    const { human } = c.get('visitor');
    const body = await c.req.json().catch(() => null);
    const parsed = presignBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
    }
    if (!isAllowedAvatarType(parsed.data.contentType)) {
      return c.json({ error: 'unsupported_type' }, 400);
    }
    try {
      const out = await presignAvatarUpload(human.id, parsed.data.contentType);
      return c.json(out);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'presign failed';
      return c.json({ error: 'presign_failed', message }, 500);
    }
  });

  return r;
}
