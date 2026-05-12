import { Hono } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import type { Db } from '@nullv2/db';
import { schema, external } from '@nullv2/db';
import {
  FACTIONS,
  FACTION_IDS,
  ACHIEVEMENTS,
  type AchievementId,
  type FactionId,
} from '@nullv2/types';

export function wallRoute(db: Db) {
  const r = new Hono();

  r.get('/state', async (c) => {
    const [parcels, leaderboardRaw, recentDeaths, recentBirths, recentAchievementsRaw] =
      await Promise.all([
        db
          .select({
            faction: schema.parcels.faction,
            x: schema.parcels.x,
            y: schema.parcels.y,
            ratifiedByHumanId: schema.parcels.ratifiedByHumanId,
            achievementId: schema.parcels.achievementId,
            week: schema.parcels.week,
            createdAt: schema.parcels.createdAt,
          })
          .from(schema.parcels)
          .orderBy(desc(schema.parcels.createdAt)),

        db
          .select({
            faction: schema.parcels.faction,
            parcelCount: sql<number>`count(*)::int`.as('parcel_count'),
          })
          .from(schema.parcels)
          .groupBy(schema.parcels.faction),

        db
          .select({
            name: schema.residents.name,
            faction: schema.residents.faction,
            deathCause: schema.residents.deathCause,
            diedAt: schema.residents.diedAt,
          })
          .from(schema.residents)
          .where(eq(schema.residents.status, 'dead'))
          .orderBy(desc(schema.residents.diedAt))
          .limit(10),

        db
          .select({
            name: schema.residents.name,
            faction: schema.residents.faction,
            bornAt: schema.residents.bornAt,
          })
          .from(schema.residents)
          .orderBy(desc(schema.residents.bornAt))
          .limit(10),

        db
          .select({
            achievementId: schema.humanAchievements.achievementId,
            earnedAt: schema.humanAchievements.earnedAt,
            humanId: schema.humanAchievements.humanId,
            userId: schema.humans.userId,
            humanName: external.users.name,
          })
          .from(schema.humanAchievements)
          .leftJoin(schema.humans, eq(schema.humans.id, schema.humanAchievements.humanId))
          .leftJoin(external.users, eq(external.users.id, schema.humans.userId))
          .orderBy(desc(schema.humanAchievements.earnedAt))
          .limit(10),
      ]);

    const leaderboard = FACTION_IDS.flatMap((id) => {
      const faction = FACTIONS[id];
      if (!faction) return [];
      const row = leaderboardRaw.find((lb) => lb.faction === id);
      return [{
        faction: id,
        name: faction.name,
        color: faction.color,
        parcelCount: row ? Number(row.parcelCount) : 0,
      }];
    }).sort((a, b) => b.parcelCount - a.parcelCount);

    const recentAchievements = recentAchievementsRaw.flatMap((row) => {
      const a = ACHIEVEMENTS[row.achievementId as AchievementId];
      if (!a) return [];
      return [{
        achievement: a,
        humanName: row.humanName ?? null,
        earnedAt: row.earnedAt,
      }];
    });

    return c.json({
      parcels: parcels.map((p) => ({
        faction: p.faction as FactionId,
        x: p.x,
        y: p.y,
        ratifiedByHumanId: p.ratifiedByHumanId,
        achievementId: p.achievementId,
        week: p.week,
        createdAt: p.createdAt,
      })),
      leaderboard,
      recentDeaths: recentDeaths.filter((d) => d.diedAt !== null),
      recentBirths,
      recentAchievements,
    });
  });

  return r;
}
