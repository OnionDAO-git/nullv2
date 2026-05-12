import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.visitor) throw redirect(303, '/');
  return { visitor: locals.visitor };
};
