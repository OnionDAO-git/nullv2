<script lang="ts">
  const DEFAULT_COLORS = [
    'var(--s-blue)',
    'var(--s-green)',
    'var(--s-gold)',
    'var(--s-rose)',
    'var(--s-teal)',
    'var(--s-amber)',
    'var(--s-mauve)',
    'var(--s-bone)'
  ];

  let {
    heavy = false,
    breath = false,
    colors = DEFAULT_COLORS
  }: {
    heavy?: boolean;
    breath?: boolean;
    colors?: string[];
  } = $props();
</script>

<div
  class="shard-line"
  class:shard-line--heavy={heavy}
  class:shard-line--breath={breath}
>
  {#each colors as color}
    <span style:background={color}></span>
  {/each}
</div>

<style>
  .shard-line {
    display: flex;
    gap: var(--grout-narrow);
    background: var(--grout);
    padding: var(--grout-narrow);
  }

  .shard-line span {
    flex: 1;
    min-width: 4px;
    height: 5px;
    opacity: 0.75;
  }

  .shard-line--heavy {
    gap: 2px;
    padding: 2px;
  }

  .shard-line--heavy span {
    height: 8px;
    opacity: 0.85;
  }

  .shard-line--breath span {
    height: 3px;
    opacity: 0.4;
  }
</style>
