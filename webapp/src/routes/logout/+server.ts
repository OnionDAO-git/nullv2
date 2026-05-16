import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? 'session';
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN;
const LOGOUT_REDIRECT_URL = process.env.LOGOUT_REDIRECT_URL ?? '/';

/**
 * Clear the shared `session` cookie. Sessions themselves are owned by
 * landing-2026 (we never write to that table), so logging "out" here means
 * the browser stops sending the cookie. With `Domain=.oniondao.dev`, this
 * clears the cookie for both subdomains; the underlying session row remains
 * in landing-2026's DB until it expires.
 */
const handler: RequestHandler = ({ cookies }) => {
  cookies.delete(COOKIE_NAME, {
    path: '/',
    domain: COOKIE_DOMAIN,
  });
  throw redirect(303, LOGOUT_REDIRECT_URL);
};

export const GET = handler;
export const POST = handler;
