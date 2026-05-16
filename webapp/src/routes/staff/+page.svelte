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
    padding: 48px 32px;
    max-width: 1100px;
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
  .mt {
    margin-top: 56px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  article {
    border: 1px solid var(--ground-3);
    padding: 16px 20px;
    background: var(--ground-1);
  }
  article header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;
  }
  h3 {
    margin: 0;
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-0);
  }
  .reward {
    color: var(--s-gold);
    font-family: var(--mono);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
  }
  .kind,
  .qr,
  .status {
    margin: 4px 0;
    font-family: var(--sans);
    font-size: 12px;
    color: var(--text-3);
  }
  code {
    background: var(--ground-2);
    padding: 2px 6px;
    color: var(--text-1);
    border-radius: 2px;
    font-family: var(--mono);
    font-size: 11px;
  }
  .scan {
    display: grid;
    grid-template-columns: 1fr 1fr auto;
    gap: 16px;
    align-items: end;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 20px;
  }
  .scan label {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .scan label span {
    font-family: var(--mono);
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 3px;
    color: var(--text-3);
  }
  .scan input,
  .scan select {
    background: var(--ground-0);
    color: var(--text-0);
    border: 1px solid var(--ground-4);
    padding: 8px 10px;
    font-family: var(--sans);
    font-size: 14px;
  }
  .scan input:focus,
  .scan select:focus {
    outline: none;
    border-color: var(--s-gold);
  }
  .scan button {
    background: var(--s-gold);
    color: var(--ground-0);
    border: none;
    padding: 9px 20px;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .scan button:hover:not(:disabled) {
    opacity: 0.85;
  }
  .scan button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .empty {
    color: var(--text-3);
    font-style: italic;
  }
  .error {
    color: var(--s-rose);
    margin-top: 12px;
    font-family: var(--sans);
    font-size: 13px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th,
  td {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid var(--ground-3);
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
