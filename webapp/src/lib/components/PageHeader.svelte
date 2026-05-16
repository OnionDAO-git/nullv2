<script lang="ts">
  import { page } from '$app/state';
  import ShardChip from './ShardChip.svelte';
  import Hamburger from './Hamburger.svelte';

  let { shardBalance = 0 }: { shardBalance?: number } = $props();

  let isAdmin = $derived(Boolean(page.data?.nav?.isAdmin));
</script>

<header class="page-header">
  <div class="left">
    <Hamburger />
    <span class="brand__mark" aria-hidden="true"></span>
    <span class="brand__word">Null City</span>
  </div>
  <div class="right">
    {#if isAdmin}
      <a class="staff-link" href="/staff">Staff</a>
    {/if}
    <ShardChip count={shardBalance} />
  </div>
</header>

<style>
  .page-header {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: var(--ground-1);
    border-bottom: 1px solid var(--ground-3);
    padding: 12px 16px 10px;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .staff-link {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--s-gold);
    text-decoration: none;
    padding: 4px 9px;
    border: 1px solid rgba(228, 184, 64, 0.45);
    transition: background 0.2s, color 0.2s;
  }

  .staff-link:hover {
    background: rgba(228, 184, 64, 0.12);
    color: var(--text-0);
  }

  .brand__mark {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    background: linear-gradient(
      135deg,
      var(--s-gold) 0%,
      var(--s-rose) 50%,
      var(--s-blue) 100%
    );
    clip-path: polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%);
  }

  .brand__word {
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.01em;
  }
</style>
