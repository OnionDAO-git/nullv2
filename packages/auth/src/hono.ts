import type { MiddlewareHandler } from 'hono';
import type { Db } from '@nullv2/db';
import { resolveSession, readSessionCookie, type AuthedVisitor } from './index.ts';

export type AuthVars = { visitor: AuthedVisitor };
export type OptionalAuthVars = { visitor: AuthedVisitor | null };

/** Reads the session cookie and attaches the visitor to ctx.var. 401s on miss. */
export function requireVisitor(db: Db): MiddlewareHandler<{ Variables: AuthVars }> {
  return async (c, next) => {
    const token = readSessionCookie(c.req.header('cookie'));
    const visitor = await resolveSession(db, token);
    if (!visitor) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    c.set('visitor', visitor);
    await next();
  };
}

/** Same as requireVisitor but lets unauthenticated requests through with visitor=null. */
export function attachVisitor(db: Db): MiddlewareHandler<{ Variables: OptionalAuthVars }> {
  return async (c, next) => {
    const token = readSessionCookie(c.req.header('cookie'));
    const visitor = await resolveSession(db, token);
    c.set('visitor', visitor);
    await next();
  };
}

/** Gate that requires the visitor to be an admin (is_admin on users table). */
export function requireAdmin(db: Db): MiddlewareHandler<{ Variables: AuthVars }> {
  return async (c, next) => {
    const token = readSessionCookie(c.req.header('cookie'));
    const visitor = await resolveSession(db, token);
    if (!visitor) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    if (!visitor.user.isAdmin) {
      return c.json({ error: 'forbidden' }, 403);
    }
    c.set('visitor', visitor);
    await next();
  };
}
