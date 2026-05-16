<script lang="ts">
  import ShardChip from './ShardChip.svelte';
  import Hamburger from './Hamburger.svelte';

  let {
    back,
    backHref,
    title,
    shardBalance = 0,
  }: {
    back: string;
    backHref?: string;
    title: string;
    shardBalance?: number;
  } = $props();
</script>

<header class="sub-header">
  <div class="left">
    <Hamburger />
    {#if backHref}
      <a href={backHref} class="back" aria-label="Back to {back}">←</a>
    {:else}
      <span class="back" aria-hidden="true">←</span>
    {/if}
    <div class="crumb">
      <div class="crumb__back">{@html back}</div>
      <div class="crumb__title">{title}</div>
    </div>
  </div>
  <ShardChip count={shardBalance} />
</header>

<style>
  .sub-header {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    background: var(--ground-1);
    border-bottom: 1px solid var(--ground-3);
    padding: 12px 14px 10px;
  }

  .left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .back {
    width: 24px;
    height: 24px;
    border: 1px solid var(--ground-4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-1);
    flex-shrink: 0;
    font-family: var(--serif);
    font-size: 14px;
    text-decoration: none;
  }

  .crumb {
    min-width: 0;
  }

  .crumb__back {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .crumb__title {
    font-family: var(--serif);
    font-size: 15px;
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.01em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 180px;
  }
</style>
