import type { Handle } from '@sveltejs/kit';
import { resolveSession, readSessionCookie } from '@nullv2/auth';
import { db } from '$lib/server/db';

export const handle: Handle = async ({ event, resolve }) => {
  const token = readSessionCookie(event.request.headers.get('cookie'));
  event.locals.visitor = await resolveSession(db, token);
  return resolve(event);
};
