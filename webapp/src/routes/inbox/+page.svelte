<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { FACTIONS, type FactionId } from '@nullv2/types';
  import { type EmotionId } from '$lib/emotions';
  import { invalidateAll, goto } from '$app/navigation';

  let { data } = $props();

  let archiving = $state(false);
  let errorMsg = $state<string | null>(null);

  const openedFaction = $derived(
    data.opened?.faction ? FACTIONS[data.opened.faction as FactionId] : null,
  );
  const rest = $derived(data.letters.filter((l) => !data.opened || l.id !== data.opened.id));

  function timeOf(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'yesterday';
    const daysAgo = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    return `${daysAgo} days ago`;
  }

  function paragraphsOf(body: string | null): string[] {
    if (!body) return [];
    return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  }

  async function archiveOpened() {
    if (!data.opened || archiving) return;
    archiving = true;
    errorMsg = null;
    try {
      const res = await fetch(`/v1/letters/${data.opened.id}/archive`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`http_${res.status}`);
      await invalidateAll();
      await goto('/inbox', { replaceState: true, noScroll: true });
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'archive failed';
    } finally {
      archiving = false;
    }
  }
</script>

<NavShell
  active="inbox"
  shardBalance={data.nav.shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.unread}
  standings={data.nav.standings}
>
  <PageHeader shardBalance={data.nav.shardBalance} />

  <div class="screen">
    <!-- Hero -->
    <section class="hero">
      <div class="hero__skyline" aria-hidden="true">
        <SkylineSvg orientation="landscape" />
      </div>
      <div class="hero__inner">
        <div class="tag-wrap">
          <SectionTag label="Inbox · letters from the city" />
        </div>
        <h1 class="hero__title">
          they wrote to you<br /><span class="dim">between ticks.</span>
        </h1>
        <div class="hero__counts">
          <span class="count count--unread">{data.unread} unread</span>
          <span class="count__sep" aria-hidden="true"></span>
          <span class="count count--total">{data.total} total</span>
        </div>
      </div>
    </section>

    {#if data.opened}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag label={data.opened.unread ? 'Most recent' : 'Just opened'} />
        </div>
        <article
          class="opened"
          style:--accent={openedFaction?.color ?? 'var(--ground-4)'}
        >
          <header class="opened__head">
            <SimpleStainedGlass
              size={48}
              emotion={data.opened.fromEmotion as EmotionId}
              monogram={data.opened.fromMonogram}
              seed={data.opened.id.charCodeAt(0) * 17}
            />
            <div class="opened__col">
              <div class="opened__from-l">From</div>
              <div class="opened__from">{data.opened.fromName}</div>
              <div class="opened__subject">{data.opened.subject}</div>
            </div>
            <span class="opened__time">{timeOf(data.opened.createdAt)}</span>
          </header>
          <div class="opened__body">
            {#if data.opened.body}
              {#each paragraphsOf(data.opened.body) as para, i (i)}
                <p>{para}</p>
              {/each}
            {:else}
              <p>{data.opened.preview}</p>
              <p class="opened__hint">
                <em>open this letter (click below) to read the full body.</em>
              </p>
            {/if}
          </div>
          <div class="opened__actions">
            {#if data.opened.body}
              <button type="button" class="btn-ghost" onclick={archiveOpened} disabled={archiving}>
                {archiving ? 'archiving…' : 'Archive'}
              </button>
            {:else}
              <a class="btn-gold" href={`/inbox?id=${data.opened.id}`}>Read full</a>
            {/if}
          </div>
          {#if errorMsg}
            <div class="opened__error">{errorMsg}</div>
          {/if}
        </article>
      </section>
    {/if}

    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="All letters" />
      </div>
    </section>
    {#if rest.length === 0}
      <div class="empty-list">
        <em>the city has not written to you yet. step into a room, talk to a resident.</em>
      </div>
    {:else}
      <div class="list">
        {#each rest as l (l.id)}
          {@const f = l.faction ? FACTIONS[l.faction as FactionId] : null}
          <a
            class="row"
            class:row--unread={l.unread}
            class:row--locks={l.faction === 'locksmiths'}
            style:--accent={f?.color ?? (l.unread ? 'var(--s-gold)' : 'transparent')}
            href={`/inbox?id=${l.id}`}
          >
            <SimpleStainedGlass
              size={42}
              emotion={l.fromEmotion as EmotionId}
              monogram={l.fromMonogram}
              seed={l.id.charCodeAt(0) * 17}
            />
            <div class="row__body">
              <div class="row__from-line">
                <span class="row__from">{l.fromName}</span>
                {#if l.kind === 'civic'}
                  <span class="civic-tag">Civic</span>
                {:else if l.kind === 'epitaph'}
                  <span class="civic-tag civic-tag--epi">Epitaph</span>
                {:else if l.kind === 'standing'}
                  <span class="civic-tag civic-tag--std">Standing</span>
                {/if}
              </div>
              <div class="row__subject" class:row__subject--read={!l.unread}>
                {l.subject}
              </div>
              <div class="row__preview">{l.preview}</div>
            </div>
            <div class="row__right">
              <div class="row__time" class:row__time--unread={l.unread}>{timeOf(l.createdAt)}</div>
              {#if l.unread}
                <div class="row__dot" aria-hidden="true"></div>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <section class="breath">
      <ShardLine breath />
      <div class="breath__caption">
        <em>letters are written when no one is watching the writer.</em>
      </div>
    </section>
  </div>
</NavShell>

<style>
  .screen { padding-bottom: 32px; }

  .hero { position: relative; padding: 28px 20px 12px; }
  .hero__skyline {
    position: absolute;
    left: 0; right: 0; bottom: 8px;
    opacity: 0.13;
    pointer-events: none;
  }
  .hero__inner { position: relative; }
  .tag-wrap :global(.tag) { margin-bottom: 16px; }
  .tag-wrap--tight :global(.tag) { margin-bottom: 12px; }
  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 38px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }
  .dim { color: var(--text-2); }
  .hero__counts {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .count {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .count--unread { color: var(--s-gold); }
  .count--total { color: var(--text-3); }
  .count__sep { width: 1px; height: 12px; background: var(--ground-4); }

  .section { padding: 8px 20px 0; }

  .opened {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
  }
  .opened__head {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--ground-3);
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }
  .opened__col { flex: 1; min-width: 0; }
  .opened__from-l {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .opened__from {
    margin-top: 2px;
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-0);
  }
  .opened__subject {
    margin-top: 6px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 15px;
    color: var(--text-1);
    line-height: 1.4;
  }
  .opened__time {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-3);
    white-space: nowrap;
  }
  .opened__body { padding: 14px 16px 12px; }
  .opened__body p {
    margin: 0 0 12px;
    font-family: var(--serif);
    font-size: 13.5px;
    color: var(--text-1);
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .opened__body p:last-child { margin-bottom: 0; }
  .opened__body p.opened__hint { color: var(--text-3); }
  .opened__actions {
    padding: 10px 14px;
    border-top: 1px solid var(--ground-3);
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .opened__error {
    padding: 8px 14px 12px;
    color: var(--s-rose);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-2);
    border: 1px solid var(--ground-4);
    padding: 8px 12px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
  }
  .btn-ghost:disabled { color: var(--text-3); cursor: not-allowed; }
  .btn-gold {
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
    text-decoration: none;
  }

  .empty-list {
    margin: 24px 20px;
    padding: 26px 20px;
    text-align: center;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    font-family: var(--serif);
    font-size: 12.5px;
    color: var(--text-3);
  }

  .list {
    margin: 24px 20px 0;
    background: var(--ground-0);
    border: 1px solid var(--ground-3);
  }
  .row {
    display: grid;
    grid-template-columns: 42px 1fr auto;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px;
    background: transparent;
    border-bottom: 1px solid var(--ground-2);
    border-left: 3px solid var(--accent);
    text-decoration: none;
    color: inherit;
  }
  .row:last-child { border-bottom: none; }
  .row--unread { background: var(--ground-1); }
  .row--locks { box-shadow: inset 0 0 12px rgba(212, 112, 122, 0.13); }

  .row__body { min-width: 0; }
  .row__from-line { display: flex; align-items: center; gap: 8px; }
  .row__from {
    font-family: var(--serif);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-0);
  }
  .civic-tag {
    font-family: var(--mono);
    font-size: 7.5px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    padding: 1px 5px;
    border: 1px solid var(--ground-4);
    color: var(--text-3);
  }
  .civic-tag--epi { border-color: var(--s-rose); color: var(--s-rose); }
  .civic-tag--std { border-color: var(--s-gold); color: var(--s-gold); }

  .row__subject {
    margin-top: 2px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-1);
    letter-spacing: -0.005em;
  }
  .row__subject--read { color: var(--text-2); }
  .row__preview {
    margin-top: 4px;
    font-family: var(--sans);
    font-size: 11.5px;
    color: var(--text-3);
    line-height: 1.45;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .row__right { text-align: right; white-space: nowrap; }
  .row__time {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-3);
  }
  .row__time--unread { color: var(--s-gold); }
  .row__dot {
    margin: 6px 0 0 auto;
    width: 7px;
    height: 7px;
    border-radius: 7px;
    background: var(--s-gold);
    box-shadow: 0 0 6px rgba(228, 184, 64, 0.6);
  }

  .breath { padding: 20px 20px 24px; }
  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }
</style>
