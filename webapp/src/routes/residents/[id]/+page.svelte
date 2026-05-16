<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import SubHeader from '$lib/components/SubHeader.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { EMOTIONS, type EmotionId } from '$lib/emotions';
  import {
    FACTIONS,
    type FactionId,
    REFILL_ATTENTION_GAIN,
    REFILL_SHARD_COST,
    ROOMS,
    isRoomId,
    NEED_IDS,
  } from '@nullv2/types';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();

  const CHAT_SHARD_COST = 2;

  let shardBalance = $state(data.nav.shardBalance);
  let attention = $state(data.resident.attentionBalance);
  let thread = $state(data.thread);
  let draft = $state('');
  let sending = $state(false);
  let refilling = $state(false);
  let errorMsg = $state<string | null>(null);

  const faction = $derived(FACTIONS[data.resident.faction as FactionId]);
  const emotion = $derived<EmotionId>((data.resident.emotion as EmotionId) ?? 'stillness');
  const monogram = $derived(data.resident.name.trim().charAt(0).toUpperCase() || '?');
  const seed = $derived(data.resident.id.charCodeAt(0) * 11);
  const room = $derived(
    isRoomId(data.resident.roomId) ? ROOMS[data.resident.roomId] : null,
  );
  const attentionPct = $derived(
    Math.max(0, Math.min(100, Math.round((attention / data.resident.attentionMax) * 100))),
  );
  const isDead = $derived(data.resident.status !== 'alive');

  function timeOf(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  async function sendMessage() {
    const text = draft.trim();
    if (!text || sending || isDead) return;
    if (shardBalance < CHAT_SHARD_COST) {
      errorMsg = 'not enough shards.';
      return;
    }
    errorMsg = null;
    sending = true;

    // Optimistic: append my line.
    const tempId = `tmp-${Date.now()}`;
    thread = [
      ...thread,
      { id: tempId, from: 'me', text, createdAt: new Date().toISOString(), channel: 'chat' },
    ];
    const sent = text;
    draft = '';

    try {
      const res = await fetch(`/v1/residents/${data.resident.id}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: sent, shardsOffered: CHAT_SHARD_COST }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error((body as { error?: string }).error ?? `http_${res.status}`);
      }
      const body = (await res.json()) as {
        residentMessage: { content: string };
        newShardBalance: number;
        residentAttention: number;
      };
      thread = [
        ...thread,
        {
          id: `r-${Date.now()}`,
          from: 'them',
          text: body.residentMessage.content,
          createdAt: new Date().toISOString(),
          channel: 'chat',
        },
      ];
      shardBalance = body.newShardBalance;
      attention = body.residentAttention;
    } catch (err) {
      thread = thread.filter((m) => m.id !== tempId);
      draft = sent;
      errorMsg = err instanceof Error ? err.message : 'send failed';
    } finally {
      sending = false;
    }
  }

  async function refill() {
    if (refilling || isDead) return;
    if (shardBalance < REFILL_SHARD_COST) {
      errorMsg = 'not enough shards.';
      return;
    }
    errorMsg = null;
    refilling = true;
    try {
      const res = await fetch(`/v1/residents/${data.resident.id}/refill`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      if (!res.ok) throw new Error('refill failed');
      const body = (await res.json()) as {
        newShardBalance: number;
        attentionBalance: number;
      };
      shardBalance = body.newShardBalance;
      attention = body.attentionBalance;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'refill failed';
    } finally {
      refilling = false;
    }
  }

  function onComposerKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }
</script>

<NavShell
  active="rooms"
  shardBalance={shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.nav.unreadCount}
  standings={data.nav.standings}
>
  <SubHeader
    back={room ? `Rooms · ${room.name}` : 'Rooms'}
    backHref={room ? `/rooms?room=${room.slug}` : '/rooms'}
    title={data.resident.name}
    shardBalance={shardBalance}
  />

  <div class="screen">
    <!-- Resident hero -->
    <section class="hero">
      <div class="hero__row">
        <SimpleStainedGlass size={92} {emotion} {monogram} {seed} />
        <div class="hero__col">
          <div class="hero__tag">Resident · {data.resident.id.slice(0, 6)}</div>
          <h1 class="hero__name">{data.resident.name}</h1>
          <div class="hero__pills">
            <span class="pill pill--faction" style:--accent={faction.color}>
              <span class="pill__square" style:background={faction.color}></span>
              <span class="pill__label">{faction.name.replace(/^The /, '')}</span>
            </span>
            <span class="pill pill--emotion">
              <span class="pill__dot" style:background={EMOTIONS[emotion].accent}></span>
              <span class="pill__label" style:color={EMOTIONS[emotion].accent}>
                {emotion}
              </span>
            </span>
            {#if isDead}
              <span class="pill pill--dead">
                <span class="pill__label">archived</span>
              </span>
            {/if}
          </div>
        </div>
      </div>
      {#if data.resident.motto}
        <p class="hero__motto">"{data.resident.motto}"</p>
      {/if}

      <div class="meter">
        <div class="meter__head">
          <span class="meter__label">Attention</span>
          <span class="meter__pct">
            {attentionPct}% <span class="meter__pct-l">· {attention} ticks left</span>
          </span>
        </div>
        <div class="meter__track">
          <div
            class="meter__fill"
            style:width="{attentionPct}%"
            style:background="linear-gradient(90deg, {faction.color} 0%, var(--s-amber) 100%)"
          ></div>
        </div>
      </div>

      <div class="inner-life">
        <div class="inner-life__head">
          <span class="inner-life__label">Inner life</span>
          <span class="inner-life__hint">{data.needBlurb}</span>
        </div>
        <ul class="needs">
          {#each NEED_IDS as nid (nid)}
            {@const p = data.needs.pressures[nid]}
            {@const isDominant = data.needs.dominant === nid}
            <li class="need" class:need--dominant={isDominant}>
              <span class="need__name">{nid}</span>
              <span class="need__bar">
                <span class="need__fill" style:width="{p}%"></span>
              </span>
              <span class="need__pct">{p}</span>
              {#if isDominant}
                <span class="need__arrow" aria-hidden="true">←</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    </section>

    <div class="divider"><ShardLine /></div>

    <!-- Chat thread -->
    <section class="section">
      <div class="tag-wrap">
        <SectionTag label="Today · you & {data.resident.name.toLowerCase()}" />
      </div>
      <div class="thread">
        {#if thread.length === 0}
          <div class="thread-empty">
            … no words yet. step forward and say something. …
          </div>
        {:else}
          {#each thread as line (line.id)}
            {#if line.from === 'them'}
              <div class="msg msg--them">
                <div class="msg__rule" style:background={faction.color}></div>
                <div class="msg__body">
                  {#if line.channel === 'shout'}
                    <div class="msg__channel">ambient · overheard in {room?.name ?? 'the room'}</div>
                  {/if}
                  <div class="msg__text msg__text--italic">{line.text}</div>
                  <div class="msg__time msg__time--left">{timeOf(line.createdAt)}</div>
                </div>
              </div>
            {:else}
              <div class="msg msg--me">
                <div class="bubble">{line.text}</div>
                <div class="msg__time msg__time--right">{timeOf(line.createdAt)}</div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </section>

    <!-- Refill card -->
    {#if !isDead}
      <section class="refill-wrap">
        <div class="refill">
          <div>
            <div class="refill__tag">Refill attention</div>
            <div class="refill__line">
              their economic life depletes each tick. give it back to them.
            </div>
          </div>
          <button
            type="button"
            class="refill__btn"
            onclick={refill}
            disabled={refilling || shardBalance < REFILL_SHARD_COST}
          >
            {refilling
              ? '…'
              : `+${REFILL_ATTENTION_GAIN} · ${REFILL_SHARD_COST} shards`}
          </button>
        </div>
      </section>
    {/if}

    {#if errorMsg}
      <div class="error">{errorMsg}</div>
    {/if}
  </div>

  <!-- Sticky composer -->
  {#if !isDead}
    <div class="composer">
      <textarea
        class="composer__input"
        bind:value={draft}
        placeholder="— say something…"
        onkeydown={onComposerKey}
        disabled={sending}
        rows="1"
      ></textarea>
      <div class="composer__row">
        <span class="composer__hint">each word costs the city a breath.</span>
        <button
          type="button"
          class="composer__send"
          onclick={sendMessage}
          disabled={sending || draft.trim().length === 0 || shardBalance < CHAT_SHARD_COST}
        >
          {sending ? 'sending…' : `Send · ${CHAT_SHARD_COST} shards`}
        </button>
      </div>
    </div>
  {:else}
    <div class="composer composer--dead">
      <div class="composer__dead-line">
        <em>this soul has been archived. visit the library of souls to read what they remembered.</em>
      </div>
    </div>
  {/if}
</NavShell>

<style>
  .screen {
    padding-bottom: 130px; /* clear sticky composer */
  }

  .hero { padding: 20px 20px 16px; }
  .hero__row { display: flex; align-items: flex-start; gap: 14px; }
  .hero__col { flex: 1; min-width: 0; }

  .hero__tag {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .hero__name {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-size: 26px;
    font-weight: 400;
    color: var(--text-0);
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .hero__pills {
    margin-top: 8px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
  }
  .pill--faction {
    border: 1px solid color-mix(in srgb, var(--accent) 53%, transparent);
    background: color-mix(in srgb, var(--accent) 13%, transparent);
  }
  .pill--dead {
    border: 1px solid var(--ground-4);
    background: var(--ground-2);
  }
  .pill__square {
    width: 6px;
    height: 6px;
  }
  .pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 6px;
  }
  .pill--emotion {
    border: 1px solid color-mix(in srgb, var(--s-gold) 40%, transparent);
  }
  .pill__label {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-1);
  }

  .hero__motto {
    margin: 14px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.55;
  }

  .meter { margin-top: 14px; }
  .meter__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .meter__label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .meter__pct {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--text-1);
    font-variant-numeric: tabular-nums;
  }
  .meter__pct-l { color: var(--text-3); font-weight: 400; }
  .meter__track {
    position: relative;
    height: 4px;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
  }
  .meter__fill { position: absolute; inset: 0 auto 0 0; }

  .inner-life { margin-top: 14px; }
  .inner-life__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }
  .inner-life__label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .inner-life__hint {
    font-family: var(--serif);
    font-style: italic;
    font-size: 11px;
    color: var(--text-3);
    line-height: 1.4;
    max-width: 220px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .needs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    column-gap: 8px;
    row-gap: 4px;
    font-variant-numeric: tabular-nums;
  }
  .need { display: contents; }
  .need__name {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .need--dominant .need__name { color: var(--s-gold); }
  .need__bar {
    position: relative;
    height: 4px;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
    align-self: center;
  }
  .need__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--text-2);
    transition: width 200ms;
  }
  .need--dominant .need__fill { background: var(--s-gold); }
  .need__pct {
    font-family: var(--mono);
    font-size: 9px;
    font-variant-numeric: tabular-nums;
    color: var(--text-3);
    min-width: 22px;
    text-align: right;
  }
  .need__arrow {
    font-family: var(--mono);
    font-size: 9px;
    color: var(--s-gold);
    margin-left: 4px;
  }

  .divider { padding: 0 20px; }
  .section { padding: 14px 20px 4px; }
  .tag-wrap :global(.tag) { margin-bottom: 6px; }

  .thread { display: flex; flex-direction: column; }
  .thread-empty {
    padding: 18px 0 6px;
    text-align: center;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
  }
  .msg { padding: 10px 0; }
  .msg--them {
    display: grid;
    grid-template-columns: 3px 1fr;
    gap: 10px;
  }
  .msg__rule { opacity: 0.85; }
  .msg__body { min-width: 0; }
  .msg__channel {
    font-family: var(--mono);
    font-size: 7.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 2px;
  }
  .msg__text--italic {
    font-family: var(--serif);
    font-style: italic;
    font-size: 15px;
    color: var(--text-1);
    line-height: 1.55;
  }
  .msg__time {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    color: var(--text-3);
  }
  .msg__time--right { text-align: right; margin-top: 4px; }
  .msg--me {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .bubble {
    max-width: 85%;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
    padding: 10px 12px;
    font-family: var(--sans);
    font-size: 13px;
    color: var(--text-0);
    line-height: 1.5;
  }

  .refill-wrap { padding: 12px 20px 12px; }
  .refill {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .refill__tag {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .refill__line {
    margin-top: 4px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-2);
  }
  .refill__btn {
    background: transparent;
    color: var(--s-gold);
    border: 1px solid var(--s-gold);
    padding: 8px 12px;
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
  }
  .refill__btn:disabled {
    color: var(--text-3);
    border-color: var(--ground-4);
    cursor: not-allowed;
  }

  .error {
    padding: 10px 20px;
    color: var(--s-rose);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .composer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 1px solid var(--ground-3);
    background: var(--ground-1);
    padding: 10px 14px 24px;
    z-index: 20;
  }
  .composer__input {
    width: 100%;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
    padding: 10px 12px;
    font-family: var(--sans);
    font-size: 13px;
    color: var(--text-0);
    min-height: 38px;
    resize: vertical;
    outline: none;
  }
  .composer__input::placeholder { color: var(--text-3); }
  .composer__row {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .composer__hint {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .composer__send {
    background: var(--s-gold);
    color: var(--ground-0);
    border: none;
    padding: 8px 14px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
  }
  .composer__send:disabled {
    background: var(--ground-3);
    color: var(--text-3);
    cursor: not-allowed;
  }
  .composer--dead {
    text-align: center;
    padding: 18px 20px 28px;
  }
  .composer__dead-line {
    font-family: var(--serif);
    font-size: 13px;
    color: var(--text-2);
  }
</style>
