<script lang="ts">
  let { children } = $props();
</script>

<div class="wall-root">
  {@render children?.()}
</div>

<style>
  .wall-root {
    background: var(--ground-0);
    min-height: 100vh;
    color: var(--text-1);
    font-family: var(--sans);
  }
</style>
