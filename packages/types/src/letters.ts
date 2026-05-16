/**
 * `letters.kind` — what kind of city-event triggered the letter.
 *
 *   epitaph  — a resident the visitor chatted with died.
 *   civic    — the embassy itself wrote (e.g., achievement claim code).
 *   standing — visitor crossed a faction-standing tier threshold.
 *   broadcast — reserved for future staff-authored announcements.
 */

export const LETTER_KIND_IDS = ['epitaph', 'civic', 'standing', 'broadcast'] as const;
export type LetterKind = (typeof LETTER_KIND_IDS)[number];

export function isLetterKind(value: string): value is LetterKind {
  return (LETTER_KIND_IDS as readonly string[]).includes(value);
}
