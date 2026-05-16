<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { FACTIONS, FACTION_IDS, type FactionId } from '@nullv2/types';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import NavShell from '$lib/components/NavShell.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import WallMap from '$lib/components/WallMap.svelte';

  let { data } = $props();

  let state = $derived(data.state);

  function factionName(id: string): string {
    return FACTIONS[id as FactionId]?.name ?? id;
  }

  function factionShort(id: string): string {
    // Use everything after "The " for a tight leaderboard label.
    return factionName(id).replace(/^The /, '');
  }

  function factionColor(id: string): string {
    return FACTIONS[id as FactionId]?.color ?? '#444';
  }

  let sortedLeaderboard = $derived(
    FACTION_IDS.map((id) => {
      const row = state.leaderboard.find((r) => r.faction === id);
      return { faction: id as string, count: row?.parcelCount ?? 0 };
    }).sort((a, b) => b.count - a.count),
  );

  let maxCount = $derived(Math.max(1, sortedLeaderboard[0]?.count ?? 0));

  interface TickerItem {
    kind: 'birth' | 'death' | 'achievement';
    icon: string;
    color: string;
    text: string;
    t: string;
    key: string;
  }

  function relTime(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
    if (diffSec < 60) return `${diffSec}s`;
    if (diffSec < 3600) return `${Math.round(diffSec / 60)}m`;
    if (diffSec < 86400) return `${Math.round(diffSec / 3600)}h`;
    return `${Math.round(diffSec / 86400)}d`;
  }

  let tickerItems = $derived<TickerItem[]>(
    [
      ...state.recentBirths.map((b, i) => ({
        kind: 'birth' as const,
        icon: '🥚',
        color: 'var(--s-green)',
        text: `${b.name} of the ${factionName(b.faction)} was born`,
        t: relTime(b.bornAt),
        key: `b-${b.residentId ?? b.name + i}`,
      })),
      ...state.recentDeaths.map((d, i) => ({
        kind: 'death' as const,
        icon: '💀',
        color: 'var(--s-rose)',
        text: `${d.name} went still — ${d.deathCause}`,
        t: relTime(d.diedAt),
        key: `d-${d.residentId ?? d.name + i}`,
      })),
      ...state.recentAchievements.map((a, i) => ({
        kind: 'achievement' as const,
        icon: '🏆',
        color: 'var(--s-gold)',
        text: `${a.humanName ?? 'a visitor'} forged ${a.achievement.name}`,
        t: relTime(a.earnedAt),
        key: `a-${(a.humanId ?? '') + a.achievement.id + i}`,
      })),
    ].slice(0, 10),
  );

  const residentsAlive = 0; // TODO: wire from a live count endpoint.
  const soulsArchived = 0;
  const daysSinceSeed = 0;

  onMount(() => {
    const id = setInterval(() => void invalidateAll(), 15_000);
    return () => clearInterval(id);
  });
</script>

<NavShell
  active="wall"
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
        <SectionTag label="The wall · null city" />
      </div>
      <h1 class="hero__title">territory<br /><span class="dim">as claimed.</span></h1>
      <p class="hero__lede">
        each parcel was once a redeemed achievement &mdash; a small piece of the city ratified
        into being.
      </p>
    </div>
  </section>

  <!-- Wall map -->
  <section class="section section--map">
    <WallMap
      parcels={state.parcels}
      showSeed
      topLeft="50×50 grid"
      bottomRight="{state.parcels.length} parcels claimed"
    />
  </section>

  <!-- Leaderboard -->
  <section class="section">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="Territory · leaderboard" />
    </div>
    <div class="leaderboard">
      {#each sortedLeaderboard as f, i (f.faction)}
        {@const isLocks = f.faction === 'locksmiths'}
        <div class="lb-row" class:last={i === sortedLeaderboard.length - 1}>
          <span class="lb-swatch" class:lb-swatch--locks={isLocks} style:background={factionColor(f.faction)}></span>
          <div class="lb-name-col">
            <div class="lb-name">{factionShort(f.faction)}</div>
            <div class="lb-bar">
              <div
                class="lb-bar__fill"
                class:lb-bar__fill--locks={isLocks}
                style:width="{(f.count / maxCount) * 100}%"
                style:background={factionColor(f.faction)}
              ></div>
            </div>
          </div>
          <div class="lb-count-col">
            <div class="lb-count">{f.count}</div>
            <div class="lb-count__label">parcels</div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Stats grid -->
  <section class="stats">
    <div class="stat">
      <div class="stat__n" style:color="var(--s-gold)">{state.parcels.length}</div>
      <div class="stat__l">Total parcels</div>
    </div>
    <div class="stat">
      <div class="stat__n" style:color="var(--s-green)">{residentsAlive}</div>
      <div class="stat__l">Residents alive</div>
    </div>
    <div class="stat">
      <div class="stat__n" style:color="var(--s-rose)">{soulsArchived}</div>
      <div class="stat__l">Souls archived</div>
    </div>
    <div class="stat">
      <div class="stat__n" style:color="var(--text-1)">{daysSinceSeed}</div>
      <div class="stat__l">Days since seed</div>
    </div>
  </section>

  <!-- Live ticker -->
  <section class="section">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="Live · ticker" />
    </div>
    <div class="ticker">
      {#if tickerItems.length === 0}
        <div class="ticker__empty">… the city is quiet for now …</div>
      {:else}
        {#each tickerItems as e, i (e.key)}
          <div class="ticker__row" class:last={i === tickerItems.length - 1}>
            <span class="ticker__icon">{e.icon}</span>
            <span class="ticker__text">{e.text}</span>
            {#if e.t}
              <span class="ticker__time">{e.t}</span>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <section class="breath">
    <ShardLine breath />
  </section>
</div>
</NavShell>

<style>
  .screen {
    padding-bottom: 32px;
  }

  /* Hero */
  .hero {
    position: relative;
    padding: 28px 20px 14px;
  }

  .hero__skyline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    opacity: 0.14;
    pointer-events: none;
  }

  .hero__inner {
    position: relative;
  }

  .tag-wrap :global(.tag) {
    margin-bottom: 18px;
  }

  .tag-wrap--tight :global(.tag) {
    margin-bottom: 14px;
  }

  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 42px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }

  .dim {
    color: var(--text-2);
  }

  .hero__lede {
    margin: 12px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.5;
    max-width: 290px;
  }

  /* Sections */
  .section--map {
    padding: 6px 20px 0;
  }

  .section {
    padding: 24px 20px 8px;
  }

  /* Leaderboard */
  .leaderboard {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
  }

  .lb-row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--ground-2);
  }

  .lb-row.last {
    border-bottom: none;
  }

  .lb-swatch {
    width: 14px;
    height: 14px;
  }

  .lb-swatch--locks {
    box-shadow: 0 0 6px rgba(212, 112, 122, 0.5);
    border: 1px solid rgba(212, 112, 122, 0.33);
  }

  .lb-name {
    font-family: var(--serif);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-0);
  }

  .lb-bar {
    margin-top: 6px;
    height: 1.5px;
    background: var(--ground-3);
    position: relative;
  }

  .lb-bar__fill {
    position: absolute;
    inset: 0 auto 0 0;
  }

  .lb-bar__fill--locks {
    box-shadow: 0 0 4px var(--s-rose);
  }

  .lb-count-col {
    text-align: right;
  }

  .lb-count {
    font-family: var(--mono);
    font-size: 16px;
    font-weight: 700;
    color: var(--s-gold);
    font-variant-numeric: tabular-nums;
  }

  .lb-count__label {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Stats grid */
  .stats {
    margin: 18px 20px 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 12px 14px;
  }

  .stat__n {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
  }

  .stat__l {
    margin-top: 4px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Ticker */
  .ticker {
    background: #050403;
    border: 1px solid var(--ground-3);
    max-height: 196px;
    overflow: hidden;
  }

  .ticker__empty {
    padding: 14px;
    text-align: center;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
  }

  .ticker__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    border-bottom: 1px solid var(--ground-2);
  }

  .ticker__row.last {
    border-bottom: none;
  }

  .ticker__icon {
    font-size: 11px;
    line-height: 1;
  }

  .ticker__text {
    font-family: var(--sans);
    font-size: 11px;
    color: var(--text-2);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ticker__time {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    color: var(--text-3);
    font-variant-numeric: tabular-nums;
  }

  .breath {
    padding: 12px 20px 36px;
  }
</style>
