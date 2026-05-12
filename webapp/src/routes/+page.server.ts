import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.visitor) throw redirect(303, '/dashboard');
  // unauthenticated → punt to landing-2026 login
  // In dev (no AUTH_COOKIE_DOMAIN set), the operator should use dev-fake-session.sh
  return {};
};
