<script lang="ts">
  import { formatClockWithSeconds } from '$lib/time';

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

  interface UserSearchRow {
    id: string;
    email: string;
    name: string | null;
    handle: string | null;
    isAdmin: boolean | null;
  }

  interface GrantResult {
    when: number;
    targetLabel: string;
    delta: number;
    newShardBalance: number;
    note: string | null;
  }

  interface GrantResponse {
    grant?: { id?: string; delta: number; note: string | null; createdAt?: string };
    target?: {
      humanId: string;
      userId: string;
      email: string;
      name: string | null;
      newShardBalance: number;
    };
  }

  let { data } = $props<{ data: { workshops: WorkshopRow[] } }>();

  let selectedQrOverride = $state<string | null>(null);
  let humanInput = $state<string>('');
  let submitting = $state<boolean>(false);
  let error = $state<string | null>(null);
  let toast = $state<string | null>(null);
  let recentScans = $state<ScanResult[]>([]);

  // Manual grant state
  let grantQuery = $state<string>('');
  let grantResults = $state<UserSearchRow[]>([]);
  let grantSelected = $state<UserSearchRow | null>(null);
  let grantAmount = $state<number>(0);
  let grantNote = $state<string>('');
  let grantSearching = $state<boolean>(false);
  let grantSubmitting = $state<boolean>(false);
  let grantError = $state<string | null>(null);
  let grantRecent = $state<GrantResult[]>([]);
  let grantSearchSeq = 0;
  let grantSearchTimer: ReturnType<typeof setTimeout> | null = null;

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

  const fmtTime = formatClockWithSeconds;

  function userLabel(u: UserSearchRow): string {
    const name = u.name?.trim();
    return name ? `${name} (${u.email})` : u.email;
  }

  function runGrantSearch(q: string) {
    const trimmed = q.trim();
    const mySeq = ++grantSearchSeq;
    grantSearching = true;
    grantError = null;
    fetch(`/v1/admin/users?q=${encodeURIComponent(trimmed)}`)
      .then(async (res) => {
        if (mySeq !== grantSearchSeq) return;
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          grantResults = [];
          grantError = `User search failed (${res.status}): ${text || res.statusText}`;
          return;
        }
        const body = (await res.json()) as { users: UserSearchRow[] };
        grantResults = body.users ?? [];
      })
      .catch((err) => {
        if (mySeq !== grantSearchSeq) return;
        grantResults = [];
        grantError = `User search error: ${err instanceof Error ? err.message : String(err)}`;
      })
      .finally(() => {
        if (mySeq === grantSearchSeq) grantSearching = false;
      });
  }

  function onGrantQueryInput(e: Event) {
    const value = (e.currentTarget as HTMLInputElement).value;
    grantQuery = value;
    if (grantSelected && value !== userLabel(grantSelected)) {
      grantSelected = null;
    }
    if (grantSearchTimer) clearTimeout(grantSearchTimer);
    grantSearchTimer = setTimeout(() => runGrantSearch(value), 200);
  }

  function onGrantFocus() {
    if (grantSelected) return;
    if (grantResults.length === 0 && !grantSearching) {
      runGrantSearch(grantQuery);
    }
  }

  function pickGrantUser(u: UserSearchRow) {
    grantSelected = u;
    grantQuery = userLabel(u);
    grantResults = [];
  }

  async function submitGrant(event: SubmitEvent) {
    event.preventDefault();
    grantError = null;
    if (!grantSelected) {
      grantError = 'Pick a user from the search results.';
      return;
    }
    if (!Number.isFinite(grantAmount) || grantAmount === 0) {
      grantError = 'Amount must be a non-zero integer.';
      return;
    }
    if (!Number.isInteger(grantAmount)) {
      grantError = 'Amount must be a whole number.';
      return;
    }

    const noteTrimmed = grantNote.trim();
    const body = {
      userId: grantSelected.id,
      amount: grantAmount,
      ...(noteTrimmed ? { note: noteTrimmed } : {}),
    };

    grantSubmitting = true;
    try {
      const res = await fetch('/v1/admin/shards/grant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        grantError = `Grant failed (${res.status}): ${text || res.statusText}`;
        return;
      }
      const payload = (await res.json()) as GrantResponse;
      const target = payload.target!;
      const delta = payload.grant?.delta ?? grantAmount;

      showToast(
        `${delta >= 0 ? '+' : ''}${delta} Shards → ${target.email}. New balance: ${target.newShardBalance}`,
      );

      grantRecent = [
        {
          when: Date.now(),
          targetLabel: target.name ? `${target.name} (${target.email})` : target.email,
          delta,
          newShardBalance: target.newShardBalance,
          note: payload.grant?.note ?? null,
        },
        ...grantRecent,
      ].slice(0, 20);

      grantSelected = null;
      grantQuery = '';
      grantAmount = 0;
      grantNote = '';
      grantResults = [];
    } catch (err) {
      grantError = err instanceof Error ? err.message : String(err);
    } finally {
      grantSubmitting = false;
    }
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

  <h2 class="mt">Award Shards (manual)</h2>
  <form onsubmit={submitGrant} class="scan grant">
    <label class="search-cell">
      <span>User (search by email, name, or handle)</span>
      <input
        type="text"
        value={grantQuery}
        oninput={onGrantQueryInput}
        onfocus={onGrantFocus}
        placeholder="search or focus to browse"
        disabled={grantSubmitting}
        autocomplete="off"
      />
      {#if grantResults.length > 0 && !grantSelected}
        <ul class="results" role="listbox">
          {#each grantResults as u (u.id)}
            <li>
              <button
                type="button"
                class="result"
                onclick={() => pickGrantUser(u)}
              >
                <span class="result-main">{u.name ?? '(no name)'}</span>
                <span class="result-sub">{u.email}{u.handle ? ' · @' + u.handle : ''}{u.isAdmin ? ' · admin' : ''}</span>
              </button>
            </li>
          {/each}
        </ul>
      {:else if grantSearching && !grantSelected}
        <p class="hint">Searching…</p>
      {:else if !grantSearching && !grantSelected && grantResults.length === 0 && grantQuery.trim().length > 0}
        <p class="hint">No matches.</p>
      {/if}
    </label>
    <label>
      <span>Amount (Shards)</span>
      <input
        type="number"
        step="1"
        bind:value={grantAmount}
        disabled={grantSubmitting}
        placeholder="0"
      />
    </label>
    <label class="note-cell">
      <span>Note (optional)</span>
      <input
        type="text"
        bind:value={grantNote}
        disabled={grantSubmitting}
        placeholder="e.g. judged the soldering demo"
        maxlength="500"
        autocomplete="off"
      />
    </label>
    <button type="submit" disabled={grantSubmitting || !grantSelected || grantAmount === 0}>
      {grantSubmitting ? 'Granting…' : 'Grant'}
    </button>
  </form>

  {#if grantError}
    <p class="error">{grantError}</p>
  {/if}

  {#if grantRecent.length > 0}
    <table class="mt-sm">
      <thead>
        <tr>
          <th>Time</th>
          <th>Recipient</th>
          <th class="num">Δ</th>
          <th class="num">New Balance</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>
        {#each grantRecent as g (g.when + g.targetLabel)}
          <tr>
            <td>{fmtTime(g.when)}</td>
            <td>{g.targetLabel}</td>
            <td class="num">{g.delta > 0 ? '+' : ''}{g.delta}</td>
            <td class="num">{g.newShardBalance}</td>
            <td>{g.note ?? ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
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
  .grant {
    grid-template-columns: 2fr 1fr 2fr auto;
  }
  .grant .search-cell,
  .grant .note-cell {
    position: relative;
  }
  .grant .results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin: 4px 0 0;
    padding: 0;
    list-style: none;
    background: var(--ground-0);
    border: 1px solid var(--ground-4);
    max-height: 220px;
    overflow-y: auto;
    z-index: 5;
  }
  .grant .results li {
    border-bottom: 1px solid var(--ground-3);
  }
  .grant .results li:last-child {
    border-bottom: none;
  }
  .grant .result {
    width: 100%;
    text-align: left;
    background: transparent;
    color: var(--text-1);
    border: none;
    padding: 8px 10px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-family: var(--sans);
    font-size: 13px;
  }
  .grant .result:hover {
    background: var(--ground-2);
    color: var(--text-0);
  }
  .grant .result-main {
    color: var(--text-0);
  }
  .grant .result-sub {
    color: var(--text-3);
    font-size: 11px;
    font-family: var(--mono);
  }
  .grant .hint {
    margin: 4px 0 0;
    color: var(--text-3);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .mt-sm {
    margin-top: 16px;
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
