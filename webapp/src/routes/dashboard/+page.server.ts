import type { PageServerLoad } from './$types';
import { FACTIONS, FACTION_IDS, standingFromPoints, STANDING_THRESHOLDS } from '@nullv2/types';
import { schema } from '@nullv2/db';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

interface ParcelPos {
  faction: string;
  x: number;
  y: number;
}

interface LeaderRow {
  faction: string;
  parcelCount: number;
}

interface WallState {
  parcels: ParcelPos[];
  leaderboard: LeaderRow[];
  recentDeaths: { name: string; faction: string; deathCause: string }[];
  recentBirths: { name: string; faction: string }[];
  recentAchievements: { humanName: string | null; achievement: { name: string } }[];
}

const EMPTY_WALL: WallState = {
  parcels: [],
  leaderboard: [],
  recentDeaths: [],
  recentBirths: [],
  recentAchievements: [],
};

async function loadWallState(fetchFn: typeof fetch): Promise<WallState> {
  try {
    const res = await fetchFn('/v1/wall/state');
    if (!res.ok) return EMPTY_WALL;
    const body = (await res.json()) as Partial<WallState>;
    return {
      parcels: body.parcels ?? [],
      leaderboard: body.leaderboard ?? [],
      recentDeaths: body.recentDeaths ?? [],
      recentBirths: body.recentBirths ?? [],
      recentAchievements: body.recentAchievements ?? [],
    };
  } catch {
    return EMPTY_WALL;
  }
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const visitor = locals.visitor!;

  const standingRows = await db
    .select()
    .from(schema.factionStanding)
    .where(eq(schema.factionStanding.humanId, visitor.human.id));

  const wall = await loadWallState(fetch);

  const parcelCountByFaction = new Map<string, number>(
    wall.leaderboard.map((r) => [r.faction, r.parcelCount]),
  );

  const standing = FACTION_IDS.map((id) => {
    const row = standingRows.find((r) => r.faction === id);
    const points = row?.points ?? 0;
    const tier = standingFromPoints(points);
    const pctToOfficer = Math.min(100, Math.round((points / STANDING_THRESHOLDS.officer) * 100));
    return {
      faction: FACTIONS[id],
      points,
      tier,
      pctToOfficer,
      parcels: parcelCountByFaction.get(id) ?? 0,
    };
  });

  // Recent ticker peek — most recent 3 events from any source.
  const ticker = [
    ...wall.recentBirths.slice(0, 1).map((b) => ({
      kind: 'birth' as const,
      text: `Resident ${b.name} of the ${FACTIONS[b.faction as keyof typeof FACTIONS]?.name ?? b.faction} was born`,
    })),
    ...wall.recentAchievements.slice(0, 1).map((a) => ({
      kind: 'achievement' as const,
      text: `${a.humanName ?? 'a visitor'} forged ${a.achievement.name}`,
    })),
    ...wall.recentDeaths.slice(0, 1).map((d) => ({
      kind: 'death' as const,
      text: `Resident ${d.name} went still — epitaph filed`,
    })),
  ].slice(0, 3);

  return {
    standing,
    parcels: wall.parcels,
    ticker,
  };
};
