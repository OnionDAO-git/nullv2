import type { PageServerLoad } from './$types';

interface ParcelWire {
  id?: string;
  faction: string;
  x: number;
  y: number;
  achievementId?: string | null;
  week?: number | null;
}

interface LeaderRow {
  faction: string;
  name?: string;
  color?: string;
  parcelCount: number;
}

interface RecentDeath {
  residentId?: string;
  name: string;
  faction: string;
  deathCause: string;
  diedAt?: string;
}

interface RecentBirth {
  residentId?: string;
  name: string;
  faction: string;
  bornAt?: string;
}

interface RecentAchievement {
  humanId?: string;
  humanName: string | null;
  /** Full achievement object as embedded by the API. */
  achievement: { id: string; name: string; kind: string; factions: string[]; flavor: string };
  earnedAt?: string;
}

export interface WallState {
  parcels: ParcelWire[];
  leaderboard: LeaderRow[];
  recentDeaths: RecentDeath[];
  recentBirths: RecentBirth[];
  recentAchievements: RecentAchievement[];
}

const EMPTY: WallState = {
  parcels: [],
  leaderboard: [],
  recentDeaths: [],
  recentBirths: [],
  recentAchievements: [],
};

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/v1/wall/state');
    if (!res.ok) return { state: EMPTY };
    const body = (await res.json()) as Partial<WallState>;
    return {
      state: {
        parcels: body.parcels ?? [],
        leaderboard: body.leaderboard ?? [],
        recentDeaths: body.recentDeaths ?? [],
        recentBirths: body.recentBirths ?? [],
        recentAchievements: body.recentAchievements ?? [],
      } satisfies WallState,
    };
  } catch {
    return { state: EMPTY };
  }
};
