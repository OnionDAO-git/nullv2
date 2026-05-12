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
    background: #000;
    overflow: hidden;
  }
  .wall-root {
    width: 100vw;
    height: 100vh;
    background: #000;
    color: #e5e5e5;
    overflow: hidden;
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  }
</style>
