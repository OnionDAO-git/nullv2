<script lang="ts">
  import ShardChip from './ShardChip.svelte';
  import Hamburger from './Hamburger.svelte';

  let { shardBalance = 0 }: { shardBalance?: number } = $props();
</script>

<header class="page-header">
  <div class="left">
    <Hamburger />
    <span class="brand__mark" aria-hidden="true"></span>
    <span class="brand__word">Null City</span>
  </div>
  <ShardChip count={shardBalance} />
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
