/**
 * `workshops.status` and `workshops.kind` catalogs.
 *
 * Status:
 *   scheduled — visible on the schedule, not yet active for scans.
 *   active    — staff may scan visitors in.
 *   completed — closed for new scans; historical.
 *
 * Kind narrows the gameplay flavor of the workshop:
 *   workshop       — hands-on session (default).
 *   competition    — head-to-head, ranked.
 *   quest          — async / multi-step.
 *   check_in       — passive presence award (e.g., first arrival of the day).
 *   bring_a_friend — referral-style bonus.
 */

export const WORKSHOP_STATUS_IDS = ['scheduled', 'active', 'completed'] as const;
export type WorkshopStatus = (typeof WORKSHOP_STATUS_IDS)[number];

export const WORKSHOP_KIND_IDS = [
  'workshop',
  'competition',
  'quest',
  'check_in',
  'bring_a_friend',
] as const;
export type WorkshopKind = (typeof WORKSHOP_KIND_IDS)[number];

export function isWorkshopStatus(value: string): value is WorkshopStatus {
  return (WORKSHOP_STATUS_IDS as readonly string[]).includes(value);
}

export function isWorkshopKind(value: string): value is WorkshopKind {
  return (WORKSHOP_KIND_IDS as readonly string[]).includes(value);
}
