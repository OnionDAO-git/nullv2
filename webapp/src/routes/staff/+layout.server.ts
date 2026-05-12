import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.visitor) throw redirect(303, '/');
  if (!locals.visitor.user.isAdmin) throw redirect(303, '/dashboard');
  return { visitor: locals.visitor };
};
