<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { FACTIONS, FACTION_IDS, type FactionId } from '@nullv2/types';

  interface ParcelWire {
    id?: string;
    faction: string;
    x: number;
    y: number;
    achievementId?: string | null;
    week?: number | null;
  }

  interface LeaderRow {
    faction: string;
    name?: string;
    color?: string;
    parcelCount: number;
  }

  interface RecentDeath {
    residentId?: string;
    name: string;
    faction: string;
    deathCause: string;
    diedAt?: string;
  }

  interface RecentBirth {
    residentId?: string;
    name: string;
    faction: string;
    bornAt?: string;
  }

  interface RecentAchievement {
    humanId?: string;
    humanName: string | null;
    achievement: { id: string; name: string };
    earnedAt?: string;
  }

  interface WallState {
    parcels: ParcelWire[];
    leaderboard: LeaderRow[];
    recentDeaths: RecentDeath[];
    recentBirths: RecentBirth[];
    recentAchievements: RecentAchievement[];
  }

  let { data } = $props<{ data: { state: WallState } }>();

  const GRID = 50;

  let state = $derived(data.state);

  function factionColor(id: string): string {
    return FACTIONS[id as FactionId]?.color ?? '#444';
  }
  function factionName(id: string): string {
    return FACTIONS[id as FactionId]?.name ?? id;
  }
  function isLocksmith(id: string): boolean {
    return id === 'locksmiths';
  }

  let sortedLeaderboard = $derived(
    FACTION_IDS.map((id) => {
      const row = state.leaderboard.find((r) => r.faction === id);
      return { faction: id, count: row?.parcelCount ?? 0 };
    }).sort((a, b) => b.count - a.count),
  );

  interface TickerItem {
    kind: 'birth' | 'death' | 'achievement';
    text: string;
    key: string;
  }

  let tickerItems = $derived<TickerItem[]>([
    ...state.recentBirths.map((b, i) => ({
      kind: 'birth' as const,
      text: `🥚 ${b.name} of the ${factionName(b.faction)} was hatched`,
      key: `b-${b.residentId ?? b.name + i}`,
    })),
    ...state.recentDeaths.map((d, i) => ({
      kind: 'death' as const,
      text: `💀 ${d.name} of the ${factionName(d.faction)} died of ${d.deathCause}`,
      key: `d-${d.residentId ?? d.name + i}`,
    })),
    ...state.recentAchievements.map((a, i) => ({
      kind: 'achievement' as const,
      text: `🏆 ${a.humanName ?? 'A visitor'} earned the ${a.achievement.name}`,
      key: `a-${(a.humanId ?? '') + a.achievement.id + i}`,
    })),
  ]);

  onMount(() => {
    const id = setInterval(() => {
      void invalidateAll();
    }, 15000);
    return () => clearInterval(id);
  });
</script>

<div class="wall">
  <div class="map">
    <div class="grid">
      {#each state.parcels as p (p.id ?? `${p.faction}-${p.x}-${p.y}`)}
        <div
          class="cell"
          class:locksmith={isLocksmith(p.faction)}
          style:left="{(p.x / GRID) * 100}%"
          style:top="{(p.y / GRID) * 100}%"
          style:background={isLocksmith(p.faction) ? '#000' : factionColor(p.faction)}
          style:border-color={isLocksmith(p.faction) ? '#a01818' : 'transparent'}
        ></div>
      {/each}
    </div>

    <aside class="leaderboard">
      <h2>Territory</h2>
      <ul>
        {#each sortedLeaderboard as row (row.faction)}
          <li>
            <span class="swatch" style:background={factionColor(row.faction)}></span>
            <span class="name">{factionName(row.faction)}</span>
            <span class="count">{row.count}</span>
          </li>
        {/each}
      </ul>
    </aside>
  </div>

  <div class="ticker">
    {#if tickerItems.length === 0}
      <div class="ticker-track empty">
        <span class="item">… the city is quiet for now …</span>
      </div>
    {:else}
      <div class="ticker-track">
        {#each tickerItems as item (item.key)}
          <span class="item item-{item.kind}">{item.text}</span>
        {/each}
        {#each tickerItems as item (item.key + '-dup')}
          <span class="item item-{item.kind}" aria-hidden="true">{item.text}</span>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .wall {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #000;
  }

  .map {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  .grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
    background-size: 2% 2%;
  }

  .cell {
    position: absolute;
    width: 1.8%;
    height: 1.8%;
    border-radius: 1px;
    border: 1px solid transparent;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.05);
  }
  .cell.locksmith {
    box-shadow: 0 0 6px rgba(160, 24, 24, 0.5);
  }

  .leaderboard {
    position: absolute;
    top: 1.5rem;
    right: 1.5rem;
    background: rgba(10, 10, 10, 0.85);
    border: 1px solid #1f1f1f;
    padding: 1rem 1.25rem;
    min-width: 18rem;
    backdrop-filter: blur(4px);
  }
  .leaderboard h2 {
    margin: 0 0 0.75rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: #888;
  }
  .leaderboard ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .leaderboard li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.95rem;
  }
  .swatch {
    display: inline-block;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 2px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .name {
    flex: 1;
    color: #d5d5d5;
  }
  .count {
    color: #e6b800;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    min-width: 2.5rem;
    text-align: right;
  }

  .ticker {
    flex: 0 0 auto;
    height: 3.5rem;
    background: #050505;
    border-top: 1px solid #1a1a1a;
    overflow: hidden;
    position: relative;
  }
  .ticker-track {
    display: flex;
    align-items: center;
    gap: 3rem;
    height: 100%;
    width: max-content;
    padding-left: 100%;
    animation: scroll 60s linear infinite;
    white-space: nowrap;
  }
  .ticker-track.empty {
    padding-left: 1.5rem;
    animation: none;
  }
  .item {
    color: #c0c0c0;
    font-size: 1.1rem;
    letter-spacing: 0.02em;
  }
  .item-birth {
    color: #b6f5b6;
  }
  .item-death {
    color: #ff9b9b;
  }
  .item-achievement {
    color: #e6b800;
  }

  @keyframes scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-50%);
    }
  }
</style>
