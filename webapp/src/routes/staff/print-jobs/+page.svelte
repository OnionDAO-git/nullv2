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
    padding: 2rem 1.5rem;
    max-width: 72rem;
    margin: 0 auto;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #999;
    margin: 0;
  }
  .hint {
    font-size: 0.75rem;
    color: #666;
  }
  .empty {
    color: #666;
    font-style: italic;
  }
  .error {
    color: #ff6b6b;
    margin-bottom: 1rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
    background: #0d0d0d;
    border: 1px solid #1f1f1f;
  }
  th,
  td {
    text-align: left;
    padding: 0.6rem 0.85rem;
    border-bottom: 1px solid #1a1a1a;
    vertical-align: middle;
  }
  th {
    color: #888;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.7rem;
    background: #111;
  }
  code {
    background: #1a1a1a;
    padding: 0.15rem 0.45rem;
    border-radius: 2px;
    color: #e6b800;
    font-variant-numeric: tabular-nums;
  }
  .status {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.7rem;
    padding: 0.15rem 0.5rem;
    border-radius: 2px;
    border: 1px solid #2a2a2a;
    background: #111;
    color: #c0c0c0;
  }
  .status-queued {
    color: #aaa;
  }
  .status-printing {
    color: #6ab0ff;
    border-color: #2c4d77;
  }
  .status-ready {
    color: #6aff8c;
    border-color: #2d6a2d;
  }
  .status-claimed {
    color: #888;
  }
  .status-failed {
    color: #ff6b6b;
    border-color: #6a2d2d;
  }
  .actions {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
  }
  .btn {
    background: #1a1a1a;
    color: #e5e5e5;
    border: 1px solid #2a2a2a;
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    cursor: pointer;
  }
  .btn:hover:not(:disabled) {
    background: #222;
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn-printing {
    border-color: #2c4d77;
    color: #8ec5ff;
  }
  .btn-ready {
    border-color: #2d6a2d;
    color: #8efaa3;
  }
  .btn-claimed {
    border-color: #444;
  }
  .btn-failed {
    border-color: #6a2d2d;
    color: #ff8a8a;
  }
</style>
