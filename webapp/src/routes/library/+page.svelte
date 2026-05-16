<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { FACTIONS, type FactionId } from '@nullv2/types';
  import { type EmotionId } from '$lib/emotions';

  let { data } = $props();

  function monogramFor(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  function timeOf(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'today';
    }
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'yesterday';
    const daysAgo = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
    return `${daysAgo}d ago`;
  }

  function shortEpitaph(s: string): string {
    const firstSentence = s.split(/\n/)[0] ?? s;
    if (firstSentence.length <= 120) return firstSentence;
    return firstSentence.slice(0, 117).replace(/\s+\S*$/, '') + '…';
  }
</script>

<NavShell
  active="library"
  shardBalance={data.nav.shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.nav.unreadCount}
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
          <SectionTag label="Library of Souls · archive" />
        </div>
        <h1 class="hero__title">
          they were here.<br /><span class="dim">then they were not.</span>
        </h1>
        <div class="hero__counts">
          <span class="count count--total">{data.total} archived</span>
        </div>
        <div class="hero__epigraph">
          <em>every soul that has ever stood still in null city is filed here.</em>
        </div>
      </div>
    </section>

    <!-- Faction filter chips -->
    <section class="filters">
      <a
        class="chip"
        class:chip--on={data.activeFaction === null}
        href="/library"
      >
        <span class="chip__name">all</span>
        <span class="chip__count">{data.total}</span>
      </a>
      {#each data.factions as fid (fid)}
        {@const f = FACTIONS[fid]}
        <a
          class="chip"
          class:chip--on={data.activeFaction === fid}
          class:chip--locks={fid === 'locksmiths'}
          style:--accent={f.color}
          href={`/library?faction=${fid}`}
        >
          <span class="chip__swatch" aria-hidden="true"></span>
          <span class="chip__name">{f.name.replace(/^The /, '').toLowerCase()}</span>
          <span class="chip__count">{data.byFaction[fid] ?? 0}</span>
        </a>
      {/each}
    </section>

    {#if data.souls.length === 0}
      <div class="empty">
        <em>
          the archive is empty.<br />
          no soul has gone still yet — not while you have been watching.
        </em>
      </div>
    {:else}
      <ul class="grid">
        {#each data.souls as s (s.id)}
          {@const f = FACTIONS[s.faction]}
          <li class="cell">
            <a
              class="card"
              class:card--locks={s.faction === 'locksmiths'}
              style:--accent={f.color}
              href={`/library/${s.residentId}`}
            >
              <div class="card__avatar">
                <SimpleStainedGlass
                  size={64}
                  emotion={s.emotion as EmotionId}
                  monogram={monogramFor(s.name)}
                  seed={s.residentId.charCodeAt(0) * 17 + s.residentId.charCodeAt(1) * 7}
                />
              </div>
              <div class="card__body">
                <div class="card__name">{s.name}</div>
                <div class="card__faction">{f.name.replace(/^The /, '').toLowerCase()}</div>
                <p class="card__epi">{shortEpitaph(s.epitaph)}</p>
                <div class="card__meta">
                  <span class="meta-pill meta-pill--cause">died of {s.deathCause}</span>
                  <span class="meta-dot" aria-hidden="true"></span>
                  <span class="meta-text">{s.livedTicks} ticks</span>
                  <span class="meta-dot" aria-hidden="true"></span>
                  <span class="meta-text meta-text--dim">{timeOf(s.archivedAt)}</span>
                </div>
              </div>
            </a>
          </li>
        {/each}
      </ul>
    {/if}

    <section class="breath">
      <ShardLine breath />
      <div class="breath__caption">
        <em>the library does not forget. the library does not resurrect.</em>
      </div>
    </section>
  </div>
</NavShell>

<style>
  .screen { padding-bottom: 32px; }

  .hero { position: relative; padding: 28px 20px 18px; }
  .hero__skyline {
    position: absolute;
    left: 0; right: 0; bottom: 8px;
    opacity: 0.13;
    pointer-events: none;
  }
  .hero__inner { position: relative; }
  .tag-wrap :global(.tag) { margin-bottom: 16px; }
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
  .count--total { color: var(--text-3); }
  .hero__epigraph {
    margin-top: 14px;
    max-width: 30ch;
    font-family: var(--serif);
    font-size: 12.5px;
    color: var(--text-3);
    line-height: 1.5;
  }

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 20px 8px;
    margin-top: 10px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px 6px 8px;
    border: 1px solid var(--ground-3);
    background: transparent;
    text-decoration: none;
    color: var(--text-2);
    font-family: var(--mono);
    font-size: 9.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }
  .chip--on {
    background: var(--ground-1);
    border-color: var(--accent, var(--s-gold));
    color: var(--text-0);
  }
  .chip__swatch {
    width: 8px;
    height: 8px;
    background: var(--accent, var(--text-3));
  }
  .chip--locks .chip__swatch {
    box-shadow: 0 0 4px var(--s-rose);
  }
  .chip__count {
    color: var(--text-3);
    font-size: 9px;
  }
  .chip--on .chip__count { color: var(--text-1); }

  .empty {
    margin: 36px 20px;
    padding: 40px 22px;
    text-align: center;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-3);
    line-height: 1.7;
  }

  .grid {
    list-style: none;
    margin: 18px 0 0;
    padding: 0 16px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;
  }
  .cell { margin: 0; padding: 0; }

  .card {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 14px;
    padding: 14px 14px 14px 12px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    text-decoration: none;
    color: inherit;
    height: 100%;
    transition: background 0.2s, border-color 0.2s;
  }
  .card:hover {
    background: var(--ground-2);
    border-color: var(--ground-4);
    border-left-color: var(--accent);
  }
  .card--locks {
    box-shadow: inset 0 0 14px rgba(212, 112, 122, 0.08);
  }

  .card__avatar {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
    filter: saturate(0.78);
    opacity: 0.92;
  }

  .card__body { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .card__name {
    font-family: var(--serif);
    font-size: 16px;
    color: var(--text-0);
    line-height: 1.15;
    letter-spacing: -0.005em;
  }
  .card__faction {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .card__epi {
    margin: 6px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .card__meta {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
  }
  .meta-pill {
    font-family: var(--mono);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    padding: 2px 6px;
    border: 1px solid var(--ground-4);
    color: var(--text-3);
  }
  .meta-pill--cause {
    border-color: var(--s-rose);
    color: var(--s-rose);
  }
  .meta-dot {
    width: 3px; height: 3px;
    background: var(--ground-4);
    border-radius: 50%;
  }
  .meta-text {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-2);
  }
  .meta-text--dim { color: var(--text-3); }

  .breath { padding: 20px 20px 24px; }
  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }
</style>
