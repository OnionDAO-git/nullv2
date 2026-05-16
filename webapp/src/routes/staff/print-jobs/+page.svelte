<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { ACHIEVEMENTS, type AchievementId } from '@nullv2/types';

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

  let { data } = $props<{ data: { jobs: PrintJobRow[] } }>();

  let busyId = $state<string | null>(null);
  let error = $state<string | null>(null);

  const STATUS_ACTIONS: { label: string; status: string; from: string[] }[] = [
    { label: 'Mark printing', status: 'printing', from: ['queued'] },
    { label: 'Mark ready', status: 'ready', from: ['printing'] },
    { label: 'Mark claimed', status: 'claimed', from: ['ready'] },
    { label: 'Mark failed', status: 'failed', from: ['queued', 'printing', 'ready'] },
  ];

  function achievementName(id: string): string {
    return ACHIEVEMENTS[id as AchievementId]?.name ?? id;
  }

  function fmtTime(iso: string): string {
    try {
      return new Date(iso).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  async function setStatus(job: PrintJobRow, status: string) {
    busyId = job.id;
    error = null;
    try {
      const res = await fetch(`/v1/print-jobs/${job.id}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const txt = await res.text();
        error = `Update failed (${res.status}): ${txt || res.statusText}`;
        return;
      }
      await invalidateAll();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      busyId = null;
    }
  }

  onMount(() => {
    const id = setInterval(() => {
      void invalidateAll();
    }, 5000);
    return () => clearInterval(id);
  });
</script>

<section class="wrap">
  <header class="head">
    <h2>Print Queue</h2>
    <span class="hint">Auto-refreshes every 5s</span>
  </header>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if data.jobs.length === 0}
    <p class="empty">Queue is empty.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Created</th>
          <th>Human</th>
          <th>Achievement</th>
          <th>Claim</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.jobs as job (job.id)}
          <tr>
            <td>{fmtTime(job.createdAt)}</td>
            <td>{job.humanName ?? job.humanId ?? '—'}</td>
            <td>{job.achievementName ?? achievementName(job.achievementId)}</td>
            <td><code>{job.claimCode}</code></td>
            <td>
              <span class="status status-{job.status}">{job.status}</span>
            </td>
            <td class="actions">
              {#each STATUS_ACTIONS as action (action.status)}
                {#if action.from.includes(job.status)}
                  <button
                    type="button"
                    onclick={() => setStatus(job, action.status)}
                    disabled={busyId === job.id}
                    class="btn btn-{action.status}"
                  >
                    {action.label}
                  </button>
                {/if}
              {/each}
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
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 24px;
  }
  h2 {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 4px;
    color: var(--text-3);
    margin: 0;
  }
  .hint {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .empty {
    color: var(--text-3);
    font-style: italic;
  }
  .error {
    color: var(--s-rose);
    margin-bottom: 16px;
    font-family: var(--sans);
    font-size: 13px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
  }
  th,
  td {
    text-align: left;
    padding: 10px 14px;
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
    background: var(--ground-2);
  }
  td {
    font-family: var(--sans);
    color: var(--text-1);
  }
  code {
    background: var(--ground-2);
    padding: 3px 8px;
    border-radius: 2px;
    color: var(--s-gold);
    font-family: var(--mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
  .status {
    font-family: var(--mono);
    text-transform: uppercase;
    letter-spacing: 2px;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 2px;
    border: 1px solid var(--ground-4);
    background: var(--ground-2);
    color: var(--text-2);
  }
  .status-queued {
    color: var(--text-2);
  }
  .status-printing {
    color: var(--s-blue);
    border-color: rgba(61, 148, 196, 0.4);
  }
  .status-ready {
    color: var(--s-green);
    border-color: rgba(78, 174, 110, 0.4);
  }
  .status-claimed {
    color: var(--text-3);
  }
  .status-failed {
    color: var(--s-rose);
    border-color: rgba(212, 112, 122, 0.4);
  }
  .actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .btn {
    background: var(--ground-2);
    color: var(--text-1);
    border: 1px solid var(--ground-4);
    padding: 5px 10px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .btn:hover:not(:disabled) {
    background: var(--ground-3);
    color: var(--text-0);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-printing {
    border-color: rgba(61, 148, 196, 0.4);
    color: var(--s-blue);
  }
  .btn-ready {
    border-color: rgba(78, 174, 110, 0.4);
    color: var(--s-green);
  }
  .btn-claimed {
    border-color: var(--ground-4);
  }
  .btn-failed {
    border-color: rgba(212, 112, 122, 0.4);
    color: var(--s-rose);
  }
</style>
