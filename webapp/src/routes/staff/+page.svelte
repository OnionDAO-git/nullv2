<script lang="ts">
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

  interface ScanResult {
    when: number;
    workshopTitle: string;
    humanLabel: string;
    shardsAwarded: number;
    newShardBalance: number;
  }

  interface ScanResponse {
    workshop?: { id: string; title: string; shardReward: number };
    attendance?: { humanId: string; shardsAwarded: number; scannedAt: string };
    newShardBalance?: number;
  }

  let { data } = $props<{ data: { workshops: WorkshopRow[] } }>();

  let selectedQrOverride = $state<string | null>(null);
  let humanInput = $state<string>('');
  let submitting = $state<boolean>(false);
  let error = $state<string | null>(null);
  let toast = $state<string | null>(null);
  let recentScans = $state<ScanResult[]>([]);

  let selectedQr = $derived(selectedQrOverride ?? data.workshops[0]?.qrCode ?? '');
  let selectedWorkshop = $derived(
    data.workshops.find((w: WorkshopRow) => w.qrCode === selectedQr) ?? null,
  );

  function showToast(msg: string) {
    toast = msg;
    setTimeout(() => {
      if (toast === msg) toast = null;
    }, 4000);
  }

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    error = null;
    if (!selectedQr) {
      error = 'Pick a workshop.';
      return;
    }
    const human = humanInput.trim();
    if (!human) {
      error = 'Enter an email.';
      return;
    }

    // Email lookup until badge resolution is wired up.
    const isEmail = human.includes('@');
    if (!isEmail) {
      error = 'Badge lookup is not wired up yet — enter the visitor’s email.';
      return;
    }
    const scanBody = { qrCode: selectedQr, humanEmail: human };

    submitting = true;
    try {
      const res = await fetch('/v1/workshops/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(scanBody),
      });
      if (!res.ok) {
        const text = await res.text();
        error = `Scan failed (${res.status}): ${text || res.statusText}`;
        return;
      }
      const body = (await res.json()) as ScanResponse;
      const balance = body.newShardBalance ?? 0;
      const awarded = body.attendance?.shardsAwarded ?? body.workshop?.shardReward ?? 0;
      const workshopTitle = body.workshop?.title ?? selectedWorkshop?.title ?? 'workshop';

      showToast(`+${awarded} Shards → ${human}. New balance: ${balance}`);

      recentScans = [
        {
          when: Date.now(),
          workshopTitle,
          humanLabel: human,
          shardsAwarded: awarded,
          newShardBalance: balance,
        },
        ...recentScans,
      ].slice(0, 20);

      humanInput = '';
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      submitting = false;
    }
  }

  function fmtTime(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
</script>

{#if toast}
  <div class="toast" role="status">{toast}</div>
{/if}

<section class="wrap">
  <h2>Today's Workshops</h2>
  {#if data.workshops.length === 0}
    <p class="empty">No workshops loaded. Check the API.</p>
  {:else}
    <div class="grid">
      {#each data.workshops as ws (ws.id)}
        <article>
          <header>
            <h3>{ws.title}</h3>
            <span class="reward">+{ws.shardReward} Shards</span>
          </header>
          <p class="kind">{ws.kind}{ws.faction ? ' · ' + ws.faction : ''}</p>
          <p class="qr">QR: <code>{ws.qrCode}</code></p>
          <p class="status">{ws.status}</p>
        </article>
      {/each}
    </div>
  {/if}

  <h2 class="mt">Award Shards</h2>
  <form onsubmit={submit} class="scan">
    <label>
      <span>Workshop</span>
      <select
        value={selectedQr}
        onchange={(e) => (selectedQrOverride = (e.currentTarget as HTMLSelectElement).value)}
        disabled={submitting}
      >
        {#each data.workshops as ws (ws.id)}
          <option value={ws.qrCode}>{ws.title} (+{ws.shardReward})</option>
        {/each}
      </select>
    </label>
    <label>
      <span>Visitor email</span>
      <input
        type="email"
        bind:value={humanInput}
        placeholder="visitor@example.com"
        disabled={submitting}
        autocomplete="off"
      />
    </label>
    <button type="submit" disabled={submitting || !selectedQr}>
      {submitting ? 'Scanning…' : 'Award Shards'}
    </button>
  </form>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <h2 class="mt">Recent Scans</h2>
  {#if recentScans.length === 0}
    <p class="empty">No scans yet this session.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Workshop</th>
          <th>Human</th>
          <th class="num">Awarded</th>
          <th class="num">New Balance</th>
        </tr>
      </thead>
      <tbody>
        {#each recentScans as scan (scan.when + scan.humanLabel)}
          <tr>
            <td>{fmtTime(scan.when)}</td>
            <td>{scan.workshopTitle}</td>
            <td>{scan.humanLabel}</td>
            <td class="num">+{scan.shardsAwarded}</td>
            <td class="num">{scan.newShardBalance}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .wrap {
    padding: 2rem 1.5rem;
    max-width: 64rem;
    margin: 0 auto;
  }
  h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #999;
    margin: 0 0 1rem;
  }
  .mt {
    margin-top: 2.5rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 0.75rem;
  }
  article {
    border: 1px solid #2a2a2a;
    padding: 0.75rem 1rem;
    background: #111;
  }
  article header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.35rem;
  }
  h3 {
    margin: 0;
    font-size: 1rem;
  }
  .reward {
    color: #e6b800;
    font-variant-numeric: tabular-nums;
    font-size: 0.85rem;
  }
  .kind,
  .qr,
  .status {
    margin: 0.2rem 0;
    font-size: 0.8rem;
    color: #888;
  }
  code {
    background: #1a1a1a;
    padding: 0.1rem 0.35rem;
    color: #d0d0d0;
    border-radius: 2px;
  }
  .scan {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 0.75rem;
    align-items: end;
    background: #111;
    border: 1px solid #2a2a2a;
    padding: 1rem;
  }
  .scan label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .scan label span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
  }
  .scan input,
  .scan select {
    background: #0a0a0a;
    color: #e5e5e5;
    border: 1px solid #2a2a2a;
    padding: 0.5rem 0.6rem;
    font: inherit;
  }
  .scan button {
    background: #e6b800;
    color: #0a0a0a;
    border: none;
    padding: 0.55rem 1.25rem;
    font-weight: 600;
    cursor: pointer;
  }
  .scan button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .empty {
    color: #666;
    font-style: italic;
  }
  .error {
    color: #ff6b6b;
    margin-top: 0.75rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid #1f1f1f;
  }
  th {
    color: #888;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 0.7rem;
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .toast {
    position: fixed;
    top: 4.5rem;
    right: 1.5rem;
    background: #1a3a1a;
    color: #b6f5b6;
    border: 1px solid #2d6a2d;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    z-index: 50;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  }
</style>
