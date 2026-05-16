<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { FACTIONS, FACTION_IDS } from '@nullv2/types';
  import type { AdminResidentRow } from './+page.server';

  let { data } = $props<{
    data: {
      residents: AdminResidentRow[];
      filters: { status: string; q: string; faction: string };
    };
  }>();

  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

  let query = $state(data.filters.q);
  let factionFilter = $state(data.filters.faction);
  let statusFilter = $state(data.filters.status || 'alive');
  let toast = $state<string | null>(null);
  let error = $state<string | null>(null);
  let busyId = $state<string | null>(null);

  function showToast(msg: string) {
    toast = msg;
    setTimeout(() => {
      if (toast === msg) toast = null;
    }, 4000);
  }

  function applyFilters() {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (factionFilter) params.set('faction', factionFilter);
    if (statusFilter) params.set('status', statusFilter);
    const qs = params.toString();
    const target = qs ? `/staff/residents?${qs}` : '/staff/residents';
    window.location.href = target;
  }

  function onFilterSubmit(e: SubmitEvent) {
    e.preventDefault();
    applyFilters();
  }

  function factionLabel(id: string): string {
    return (
      (FACTIONS as Record<string, { name: string } | undefined>)[id]?.name?.replace(/^The /, '') ??
      id
    );
  }
  function factionColor(id: string): string {
    return (FACTIONS as Record<string, { color: string } | undefined>)[id]?.color ?? '#666';
  }

  async function pickAvatar(r: AdminResidentRow): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = ALLOWED_AVATAR_TYPES.join(',');
      input.onchange = () => resolve(input.files?.[0] ?? null);
      input.click();
    });
  }

  async function uploadAndSetAvatar(r: AdminResidentRow) {
    error = null;
    const file = await pickAvatar(r);
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      error = 'image must be jpeg, png, or webp.';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      error = 'image must be under 10 MB.';
      return;
    }
    busyId = r.id;
    try {
      const presignRes = await fetch('/v1/uploads/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'resident_avatar', contentType: file.type }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `presign_${presignRes.status}`);
      }
      const presign = (await presignRes.json()) as { uploadUrl: string; publicUrl: string };
      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error(`upload failed (${putRes.status})`);

      const patchRes = await fetch(`/v1/admin/residents/${r.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ avatarUrl: presign.publicUrl }),
      });
      if (!patchRes.ok) {
        const body = await patchRes.text();
        throw new Error(`patch failed (${patchRes.status}): ${body}`);
      }
      showToast(`Avatar updated for ${r.name}.`);
      await invalidateAll();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busyId = null;
    }
  }

  async function clearAvatar(r: AdminResidentRow) {
    if (!r.avatarUrl) return;
    if (!confirm(`Remove avatar for ${r.name}?`)) return;
    error = null;
    busyId = r.id;
    try {
      const patchRes = await fetch(`/v1/admin/residents/${r.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (!patchRes.ok) {
        const body = await patchRes.text();
        throw new Error(`patch failed (${patchRes.status}): ${body}`);
      }
      showToast(`Avatar cleared for ${r.name}.`);
      await invalidateAll();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busyId = null;
    }
  }

  async function killResident(r: AdminResidentRow) {
    if (r.status === 'dead') return;
    if (
      !confirm(
        `Kill ${r.name} now? They will be archived in the Library of Souls and an epitaph letter goes out. This cannot be undone.`,
      )
    )
      return;
    error = null;
    busyId = r.id;
    try {
      const res = await fetch(`/v1/admin/residents/${r.id}/kill`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`kill failed (${res.status}): ${body}`);
      }
      showToast(`${r.name} archived.`);
      await invalidateAll();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busyId = null;
    }
  }
</script>

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

<section class="wrap">
  <h2>Residents</h2>

  <form class="filters" onsubmit={onFilterSubmit}>
    <label>
      <span>Search</span>
      <input
        type="text"
        bind:value={query}
        placeholder="name…"
        autocomplete="off"
      />
    </label>
    <label>
      <span>Faction</span>
      <select bind:value={factionFilter}>
        <option value="">All</option>
        {#each FACTION_IDS as fid (fid)}
          <option value={fid}>{factionLabel(fid)}</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Status</span>
      <select bind:value={statusFilter}>
        <option value="alive">Alive only</option>
        <option value="all">Alive + dead</option>
      </select>
    </label>
    <button type="submit">Apply</button>
  </form>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if data.residents.length === 0}
    <p class="empty">No residents match.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Name</th>
          <th>Faction</th>
          <th>Status</th>
          <th class="num">Ticks left</th>
          <th class="num">Attention</th>
          <th>Born</th>
          <th class="actions">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.residents as r (r.id)}
          <tr class:dead={r.status === 'dead'}>
            <td class="avatar-cell">
              {#if r.avatarUrl}
                <img class="avatar" src={r.avatarUrl} alt="" />
              {:else}
                <span class="avatar avatar--empty">·</span>
              {/if}
            </td>
            <td class="name-cell">
              <div>{r.name}</div>
              <div class="sub">{r.emotion} · {r.roomId}</div>
            </td>
            <td>
              <span
                class="faction-pill"
                style:--accent={factionColor(r.faction)}
              >
                {factionLabel(r.faction)}
              </span>
            </td>
            <td>{r.status}</td>
            <td class="num">{r.lifespanTicksRemaining}/{r.lifespanTicksTotal}</td>
            <td class="num">{r.attentionBalance}</td>
            <td class="ts">{new Date(r.bornAt).toLocaleString()}</td>
            <td class="actions">
              <button
                type="button"
                class="btn"
                disabled={busyId === r.id}
                onclick={() => uploadAndSetAvatar(r)}
              >
                {r.avatarUrl ? 'Replace photo' : 'Set photo'}
              </button>
              {#if r.avatarUrl}
                <button
                  type="button"
                  class="btn btn--ghost"
                  disabled={busyId === r.id}
                  onclick={() => clearAvatar(r)}
                >
                  Clear
                </button>
              {/if}
              {#if r.status === 'alive'}
                <button
                  type="button"
                  class="btn btn--danger"
                  disabled={busyId === r.id}
                  onclick={() => killResident(r)}
                >
                  Kill
                </button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .wrap {
    padding: 48px 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
  h2 {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 4px;
    color: var(--text-3);
    margin: 0 0 24px;
  }

  .filters {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 12px;
    align-items: end;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 16px 20px;
    margin-bottom: 24px;
  }
  .filters label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .filters label span {
    font-family: var(--mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: var(--text-3);
  }
  .filters input,
  .filters select {
    background: var(--ground-0);
    color: var(--text-0);
    border: 1px solid var(--ground-4);
    padding: 8px 10px;
    font-family: var(--sans);
    font-size: 14px;
  }
  .filters input:focus,
  .filters select:focus {
    outline: none;
    border-color: var(--s-gold);
  }
  .filters button {
    background: var(--s-gold);
    color: var(--ground-0);
    border: none;
    padding: 9px 18px;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th,
  td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--ground-3);
    vertical-align: middle;
  }
  th {
    color: var(--text-3);
    font-family: var(--mono);
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
  }
  td {
    font-family: var(--sans);
    color: var(--text-1);
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-family: var(--mono);
  }
  .ts {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-3);
  }
  .sub {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-3);
    margin-top: 2px;
    letter-spacing: 1px;
  }
  tr.dead td {
    color: var(--text-3);
  }
  tr.dead .name-cell > div:first-child {
    text-decoration: line-through;
  }

  .avatar-cell {
    width: 56px;
  }
  .avatar {
    display: block;
    width: 44px;
    height: 44px;
    object-fit: cover;
    border: 1px solid var(--ground-3);
    background: var(--ground-1);
  }
  .avatar--empty {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    font-family: var(--mono);
  }

  .faction-pill {
    display: inline-block;
    padding: 2px 8px;
    border: 1px solid var(--accent);
    color: var(--accent);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: flex-end;
  }
  .btn {
    background: var(--ground-2);
    color: var(--text-1);
    border: 1px solid var(--ground-4);
    padding: 6px 10px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    cursor: pointer;
  }
  .btn:hover:not(:disabled) {
    background: var(--ground-3);
    color: var(--text-0);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn--ghost {
    background: transparent;
  }
  .btn--danger {
    border-color: var(--s-rose);
    color: var(--s-rose);
  }
  .btn--danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--s-rose) 14%, transparent);
    color: var(--s-rose);
  }

  .empty {
    color: var(--text-3);
    font-style: italic;
  }
  .error {
    color: var(--s-rose);
    margin-bottom: 12px;
    font-family: var(--sans);
    font-size: 13px;
  }
  .toast {
    position: fixed;
    top: 64px;
    right: 24px;
    background: var(--ground-2);
    color: var(--s-green);
    border: 1px solid var(--ground-4);
    border-left: 3px solid var(--s-green);
    padding: 12px 16px;
    font-family: var(--mono);
    font-size: 12px;
    z-index: 50;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }
</style>
