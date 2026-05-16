<script lang="ts">
  import type { Snippet } from 'svelte';
  import { menuOpen, closeMenu } from '$lib/stores/nav';
  import { afterNavigate } from '$app/navigation';
  import SideMenu from './SideMenu.svelte';
  import type { StandingTier } from '@nullv2/types';

  type NavId =
    | 'dashboard'
    | 'wall'
    | 'rooms'
    | 'inbox'
    | 'redeem'
    | 'library'
    | 'embassy'
    | 'public';

  interface StandingRow {
    factionId: string;
    tier: StandingTier;
  }

  let {
    active,
    shardBalance = 0,
    visitorHandle = 'visitor',
    unreadCount = 0,
    standings = [],
    children,
  }: {
    active: NavId;
    shardBalance?: number;
    visitorHandle?: string;
    unreadCount?: number;
    standings?: StandingRow[];
    children?: Snippet;
  } = $props();

  // Close the drawer automatically after navigation finishes.
  afterNavigate(() => closeMenu());
</script>

<div class="shell">
  {@render children?.()}
  {#if $menuOpen}
    <SideMenu
      {active}
      {shardBalance}
      {visitorHandle}
      {unreadCount}
      {standings}
    />
  {/if}
</div>

<style>
  .shell {
    position: relative;
    background: var(--ground-0);
    color: var(--text-1);
    font-family: var(--sans);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }
</style>
