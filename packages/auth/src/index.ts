/**
 * Auth glue between nullv2 and landing-2026.
 *
 * landing-2026 issues opaque session tokens stored in the `sessions` table
 * and sets them as a cookie named `session`. We verify those tokens against
 * the same Postgres instance and lazily upsert a row in our `humans` table
 * so visitors have gameplay state.
 *
 * No JWT, no shared secret — the DB is the truth.
 */
import { eq, and, gt } from 'drizzle-orm';
import { external, schema, type Db } from '@nullv2/db';

const { users, sessions } = external;
const { humans } = schema;

export interface AuthedVisitor {
  user: typeof users.$inferSelect;
  human: typeof humans.$inferSelect;
}

/**
 * Verify a session token and return the associated user + human (creating
 * a humans row on first visit). Returns null on miss / expired session.
 */
export async function resolveSession(db: Db, token: string | null | undefined): Promise<AuthedVisitor | null> {
  if (!token) return null;

  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const human = await ensureHuman(db, row.user.id);
  return { user: row.user, human };
}

/** Upsert a humans row for the given user. Returns the existing or new row. */
export async function ensureHuman(db: Db, userId: string): Promise<typeof humans.$inferSelect> {
  const existing = await db.select().from(humans).where(eq(humans.userId, userId)).limit(1);
  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(humans)
    .values({ userId, shardBalance: 0 })
    .returning();
  if (!created) throw new Error('ensureHuman: insert returned no rows');
  return created;
}

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'session';

/**
 * Extract the session token from a Cookie header value.
 * Framework-agnostic so SvelteKit + Hono can share it.
 */
export function readSessionCookie(cookieHeader: string | null | undefined): string | null {
  if (!cookieHeader) return null;
  for (const piece of cookieHeader.split(/;\s*/)) {
    const eq = piece.indexOf('=');
    if (eq < 0) continue;
    if (piece.slice(0, eq) === COOKIE_NAME) {
      return decodeURIComponent(piece.slice(eq + 1));
    }
  }
  return null;
}
