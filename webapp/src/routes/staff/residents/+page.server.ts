import type { PageServerLoad } from './$types';

export interface AdminResidentRow {
  id: string;
  name: string;
  faction: string;
  emotion: string;
  status: 'alive' | 'dead';
  roomId: string;
  attentionBalance: number;
  lifespanTicksTotal: number;
  lifespanTicksRemaining: number;
  avatarUrl: string | null;
  ownerHumanId: string | null;
  bornAt: string;
  diedAt: string | null;
}

interface ResidentsResponse {
  residents: AdminResidentRow[];
}

export const load: PageServerLoad = async ({ fetch, url }) => {
  const status = url.searchParams.get('status') ?? 'alive';
  const q = url.searchParams.get('q') ?? '';
  const faction = url.searchParams.get('faction') ?? '';

  const qs = new URLSearchParams();
  if (status) qs.set('status', status);
  if (q) qs.set('q', q);
  if (faction) qs.set('faction', faction);

  let residents: AdminResidentRow[] = [];
  try {
    const res = await fetch(`/v1/admin/residents?${qs.toString()}`);
    if (res.ok) {
      const body = (await res.json()) as ResidentsResponse;
      residents = body.residents ?? [];
    }
  } catch {
    residents = [];
  }
  return { residents, filters: { status, q, faction } };
};
