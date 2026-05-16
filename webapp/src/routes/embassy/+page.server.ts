import type { PageServerLoad } from './$types';
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import { schema } from '@nullv2/db';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_IDS,
  isAchievementId,
  type AchievementId,
  type FactionId,
  type PrintJobStatus,
  type WorkshopStatus,
} from '@nullv2/types';
import { db } from '$lib/server/db';

export interface PrintJobView {
  id: string;
  achievementId: AchievementId;
  achievementName: string;
  factions: FactionId[];
  status: PrintJobStatus;
  claimCode: string;
  createdAt: string;
}

export interface WorkshopView {
  id: string;
  title: string;
  faction: FactionId | null;
  kind: string;
  shardReward: number;
  scheduledAt: string | null;
  status: WorkshopStatus;
}

export interface CivicAchievementView {
  id: AchievementId;
  name: string;
  flavor: string;
  earned: boolean;
}

export const load: PageServerLoad = async ({ locals }) => {
  const visitor = locals.visitor;

  // Print jobs belonging to this visitor that haven't been claimed yet.
  const openJobs: PrintJobView[] = [];
  let earnedIds = new Set<AchievementId>();
  if (visitor) {
    const rows = await db
      .select({
        id: schema.printJobs.id,
        achievementId: schema.printJobs.achievementId,
        status: schema.printJobs.status,
        claimCode: schema.printJobs.claimCode,
        createdAt: schema.printJobs.createdAt,
      })
      .from(schema.printJobs)
      .where(
        and(
          eq(schema.printJobs.humanId, visitor.human.id),
          inArray(schema.printJobs.status, ['queued', 'printing', 'ready']),
        ),
      )
      .orderBy(desc(schema.printJobs.createdAt));

    for (const r of rows) {
      const ach = ACHIEVEMENTS[r.achievementId as AchievementId];
      if (!ach) continue;
      openJobs.push({
        id: r.id,
        achievementId: r.achievementId as AchievementId,
        achievementName: ach.name,
        factions: ach.factions,
        status: r.status as PrintJobStatus,
        claimCode: r.claimCode,
        createdAt: r.createdAt.toISOString(),
      });
    }

    const earnedRows = await db
      .select({ achievementId: schema.humanAchievements.achievementId })
      .from(schema.humanAchievements)
      .where(eq(schema.humanAchievements.humanId, visitor.human.id));
    earnedIds = new Set(
      earnedRows
        .map((r) => r.achievementId)
        .filter((id): id is AchievementId => isAchievementId(id)),
    );
  }

  // Upcoming workshops (scheduled or active).
  const workshops = await db
    .select()
    .from(schema.workshops)
    .where(inArray(schema.workshops.status, ['scheduled', 'active']))
    .orderBy(asc(schema.workshops.scheduledAt))
    .limit(20);

  const workshopViews: WorkshopView[] = workshops.map((w) => ({
    id: w.id,
    title: w.title,
    faction: w.faction,
    kind: w.kind,
    shardReward: w.shardReward,
    scheduledAt: w.scheduledAt ? w.scheduledAt.toISOString() : null,
    status: w.status,
  }));

  const civicViews: CivicAchievementView[] = ACHIEVEMENT_IDS
    .map((id) => ACHIEVEMENTS[id])
    .filter((a) => a.kind === 'civic')
    .map((a) => ({
      id: a.id,
      name: a.name,
      flavor: a.flavor,
      earned: earnedIds.has(a.id),
    }));

  // Aggregate totals for the city snapshot tile.
  const [livingRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.residents)
    .where(eq(schema.residents.status, 'alive'));
  const [archivedRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.libraryOfSouls);

  return {
    openJobs,
    workshops: workshopViews,
    civicAchievements: civicViews,
    cityCounts: {
      living: livingRow?.c ?? 0,
      archived: archivedRow?.c ?? 0,
    },
  };
};
