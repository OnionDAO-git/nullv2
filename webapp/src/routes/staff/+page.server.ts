import type { PageServerLoad } from './$types';

interface WorkshopRow {
  id: string;
  title: string;
  faction: string | null;
  kind: string;
  shardReward: number;
  qrCode: string;
  scheduledAt: string | null;
  status: string;
}

interface WorkshopsResponse {
  workshops: WorkshopRow[];
}

export const load: PageServerLoad = async ({ fetch }) => {
  let workshops: WorkshopRow[] = [];
  try {
    const res = await fetch('/v1/workshops');
    if (res.ok) {
      const body = (await res.json()) as WorkshopsResponse;
      workshops = body.workshops ?? [];
    }
  } catch {
    workshops = [];
  }

  return { workshops };
};
