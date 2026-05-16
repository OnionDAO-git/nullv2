/**
 * Catalogs for resident-record state. Hoisted out of schema comments so writers
 * and readers share the same union types end-to-end.
 *
 * Adding a new value: extend the array, run typecheck — any miss at a call site
 * (or in a switch/exhaustive-check) lights up immediately.
 */

export const RESIDENT_STATUS_IDS = ['alive', 'dead'] as const;
export type ResidentStatus = (typeof RESIDENT_STATUS_IDS)[number];

/** Why a resident died. Priority order in the tick worker: lifespan checked
 *  before attention. 'admin' is set only by an admin-induced early death. */
export const DEATH_CAUSE_IDS = ['lifespan', 'attention', 'admin'] as const;
export type DeathCause = (typeof DEATH_CAUSE_IDS)[number];

export function isResidentStatus(value: string): value is ResidentStatus {
  return (RESIDENT_STATUS_IDS as readonly string[]).includes(value);
}

export function isDeathCause(value: string): value is DeathCause {
  return (DEATH_CAUSE_IDS as readonly string[]).includes(value);
}
