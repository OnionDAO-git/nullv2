<script lang="ts">
  let { children } = $props();
</script>

<div class="wall-root">
  {@render children?.()}
</div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--ground-0);
    overflow: hidden;
  }
  .wall-root {
    width: 100vw;
    height: 100vh;
    background: var(--ground-0);
    color: var(--text-1);
    overflow: hidden;
    font-family: var(--sans);
  }
</style>
