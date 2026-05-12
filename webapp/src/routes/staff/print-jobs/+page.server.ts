import type { PageServerLoad } from './$types';

interface PrintJobRow {
  id: string;
  status: string;
  claimCode: string;
  achievementId: string;
  achievementName?: string;
  humanName?: string;
  humanId?: string;
  notes?: string | null;
  createdAt: string;
}

interface PrintJobsResponse {
  jobs: PrintJobRow[];
}

export const load: PageServerLoad = async ({ fetch }) => {
  let jobs: PrintJobRow[] = [];
  try {
    const res = await fetch('/v1/print-jobs');
    if (res.ok) {
      const body = (await res.json()) as PrintJobsResponse;
      jobs = body.jobs ?? [];
    }
  } catch {
    jobs = [];
  }
  return { jobs };
};
