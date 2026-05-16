<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import NavShell from '$lib/components/NavShell.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import WallMap from '$lib/components/WallMap.svelte';
  import type { StandingTier } from '@nullv2/types';

  let { data } = $props();

  const TIER_DOT: Record<StandingTier, string> = {
    none: 'var(--ground-5)',
    acquaintance: 'var(--s-teal)',
    ally: 'var(--s-green)',
    officer: 'var(--s-gold)',
  };

  const TIER_LABEL: Record<StandingTier, string> = {
    none: 'stranger',
    acquaintance: 'acquaintance',
    ally: 'ally',
    officer: 'officer',
  };

  const EVENT_LABEL = {
    birth: { color: 'var(--s-green)', icon: '🥚', tag: 'birth' },
    achievement: { color: 'var(--s-gold)', icon: '🏆', tag: 'achievement' },
    death: { color: 'var(--s-rose)', icon: '💀', tag: 'death' },
  } as const;
</script>

<NavShell
  active="dashboard"
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
        <SectionTag label="Embassy · Chicago" />
      </div>
      <h1 class="hero__title">
        good<br />evening,<br /><span class="dim">visitor.</span>
      </h1>
      <p class="hero__lede">
        the city flaked off a tiny piece of itself when you arrived &mdash; it has been noticing
        you all night.
      </p>
    </div>
  </section>

  <div class="divider">
    <ShardLine heavy />
  </div>

  <!-- Standing -->
  <section class="section">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="Your standing · with the factions" />
    </div>
    <div class="faction-list">
      {#each data.standing as row (row.faction.id)}
        {@const isLocks = row.faction.id === 'locksmiths'}
        <article
          class="faction-row"
          class:faction-row--locks={isLocks}
          style:--accent={row.faction.color}
        >
          <div class="faction-row__name-col">
            <div class="faction-row__name">{row.faction.name}</div>
            <div class="faction-row__theme">{row.faction.theme}</div>
          </div>
          <div class="faction-row__meta-col">
            <span class="pill">
              <span class="pill__dot" style:background={TIER_DOT[row.tier]}></span>
              {TIER_LABEL[row.tier]}
            </span>
            <div class="parcels">
              <span class="parcels__n">{row.parcels}</span>
              <span class="parcels__l">parcels</span>
            </div>
          </div>
          <div class="faction-row__bar-col">
            <div class="bar">
              <div class="bar__fill" style:width="{row.pctToOfficer}%"></div>
              {#each [20, 40, 60, 80] as p (p)}
                <div class="bar__tick" style:left="{p}%"></div>
              {/each}
            </div>
            <div class="bar-meta">
              <span>{row.points} shards given</span>
              <span class="bar-meta__right">{row.pctToOfficer}% &rarr; officer</span>
            </div>
          </div>
          <div class="faction-row__motto">{row.faction.motto}</div>
        </article>
      {/each}
    </div>
  </section>

  <!-- Wall preview -->
  <section class="section section--map">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="The wall · tap to expand" />
    </div>
    <a href="/wall" class="map-link" aria-label="open the wall">
      <WallMap
        parcels={data.parcels}
        topLeft="50×50 · the wall"
        bottomRight={String(data.parcels.length)}
        capacity={2500}
      />
    </a>
  </section>

  <!-- Ticker peek -->
  <section class="section section--ticker">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="Latest · from the city" />
    </div>
    <div class="ticker-peek">
      {#if data.ticker.length === 0}
        <div class="ticker-empty">… the city is quiet for now …</div>
      {:else}
        {#each data.ticker as e, i (i)}
          {@const def = EVENT_LABEL[e.kind]}
          <div class="ticker-row">
            <span class="ticker-row__icon">{def.icon}</span>
            <span class="ticker-row__tag" style:color={def.color}>{def.tag}</span>
            <span class="ticker-row__text">{e.text}</span>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <!-- Breath -->
  <section class="breath">
    <ShardLine breath />
    <div class="breath__caption"><em>the city is still breathing.</em></div>
  </section>
</div>
</NavShell>

<style>
  .screen {
    padding-bottom: 32px; /* home-indicator clearance */
  }

  /* Hero */
  .hero {
    position: relative;
    padding: 36px 20px 22px;
  }

  .hero__skyline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 12px;
    opacity: 0.18;
    pointer-events: none;
  }

  .hero__inner {
    position: relative;
  }

  .tag-wrap :global(.tag) {
    margin-bottom: 24px;
  }

  .tag-wrap--tight :global(.tag) {
    margin-bottom: 16px;
  }

  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 40px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }

  .dim {
    color: var(--text-2);
  }

  .hero__lede {
    margin: 14px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.5;
    max-width: 280px;
  }

  /* Section frame */
  .divider {
    padding: 0 20px;
  }

  .section {
    padding: 28px 20px 8px;
  }

  .section--map {
    padding: 36px 20px 12px;
  }

  .section--ticker {
    padding: 24px 20px 16px;
  }

  /* Faction rows */
  .faction-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .faction-row {
    background: var(--ground-1);
    border-top: 1px solid var(--ground-3);
    border-bottom: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    padding: 14px 18px 14px 15px;
    display: grid;
    grid-template-columns: 1fr auto;
    row-gap: 10px;
    column-gap: 12px;
    align-items: baseline;
  }

  .faction-row--locks {
    box-shadow: 0 0 12px rgba(212, 112, 122, 0.13) inset;
  }

  .faction-row__name {
    font-family: var(--serif);
    font-size: 17px;
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.01em;
  }

  .faction-row__theme {
    margin-top: 3px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .faction-row__meta-col {
    text-align: right;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-2);
  }

  .pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 6px;
  }

  .parcels {
    margin-top: 4px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text-1);
    font-variant-numeric: tabular-nums;
  }

  .parcels__n {
    font-weight: 700;
  }

  .parcels__l {
    color: var(--text-3);
  }

  .faction-row__bar-col {
    grid-column: 1 / -1;
  }

  .bar {
    position: relative;
    height: 2px;
    background: var(--ground-3);
  }

  .bar__fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--accent);
  }

  .bar__tick {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 1px;
    background: var(--ground-4);
  }

  .bar-meta {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    color: var(--text-3);
    text-transform: uppercase;
  }

  .bar-meta__right {
    color: var(--text-2);
  }

  .faction-row__motto {
    grid-column: 1 / -1;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-2);
    line-height: 1.5;
    padding-top: 2px;
  }

  /* Map preview */
  .map-link {
    display: block;
    text-decoration: none;
    color: inherit;
  }

  /* Ticker peek */
  .ticker-peek {
    background: #050403;
    border: 1px solid var(--ground-3);
  }

  .ticker-empty {
    padding: 14px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
    text-align: center;
  }

  .ticker-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid var(--ground-2);
  }

  .ticker-row:last-child {
    border-bottom: none;
  }

  .ticker-row__icon {
    font-size: 12px;
    line-height: 1;
  }

  .ticker-row__tag {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    min-width: 56px;
  }

  .ticker-row__text {
    font-family: var(--sans);
    font-size: 11px;
    color: var(--text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  /* Breath line */
  .breath {
    padding: 20px 20px 36px;
  }

  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }
</style>
