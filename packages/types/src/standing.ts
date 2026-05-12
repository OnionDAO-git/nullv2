export const STANDING_TIERS = ['none', 'acquaintance', 'ally', 'officer'] as const;
export type StandingTier = (typeof STANDING_TIERS)[number];

/** Cumulative shards spent with a faction needed to reach each tier. */
export const STANDING_THRESHOLDS: Record<StandingTier, number> = {
  none: 0,
  acquaintance: 10,
  ally: 30,
  officer: 75,
};

export function standingFromPoints(points: number): StandingTier {
  if (points >= STANDING_THRESHOLDS.officer) return 'officer';
  if (points >= STANDING_THRESHOLDS.ally) return 'ally';
  if (points >= STANDING_THRESHOLDS.acquaintance) return 'acquaintance';
  return 'none';
}

export function meetsStanding(current: StandingTier, required: StandingTier): boolean {
  const order = STANDING_TIERS.indexOf(current);
  const need = STANDING_TIERS.indexOf(required);
  return order >= need;
}
