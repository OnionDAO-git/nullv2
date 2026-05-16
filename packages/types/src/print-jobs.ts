/**
 * `print_jobs.status`. The lifecycle:
 *
 *   queued ─▶ printing ─▶ ready ─▶ claimed
 *      │         │          │
 *      └─────────┴──────────┴─▶ failed
 *
 * Terminal statuses (set `completed_at` when entered):
 *   ready, claimed, failed.
 */

export const PRINT_JOB_STATUS_IDS = [
  'queued',
  'printing',
  'ready',
  'claimed',
  'failed',
] as const;
export type PrintJobStatus = (typeof PRINT_JOB_STATUS_IDS)[number];

/** Statuses that admins can transition to (i.e. excluding the initial `queued`). */
export const PRINT_JOB_TRANSITION_IDS = [
  'printing',
  'ready',
  'claimed',
  'failed',
] as const;
export type PrintJobTransition = (typeof PRINT_JOB_TRANSITION_IDS)[number];

export const PRINT_JOB_TERMINAL_IDS = ['ready', 'claimed', 'failed'] as const;

export function isPrintJobTerminal(status: PrintJobStatus): boolean {
  return (PRINT_JOB_TERMINAL_IDS as readonly string[]).includes(status);
}

export function isPrintJobStatus(value: string): value is PrintJobStatus {
  return (PRINT_JOB_STATUS_IDS as readonly string[]).includes(value);
}
