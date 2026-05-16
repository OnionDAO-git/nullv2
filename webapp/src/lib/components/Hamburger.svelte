<script lang="ts">
  import { openMenu } from '$lib/stores/nav';

  let { onclick = openMenu }: { onclick?: () => void } = $props();
</script>

<button type="button" class="hamburger" aria-label="Open menu" {onclick}>
  <span></span>
  <span></span>
  <span></span>
</button>

<style>
  .hamburger {
    width: 30px;
    height: 30px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--ground-4);
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .hamburger span {
    width: 14px;
    height: 1px;
    background: var(--text-1);
  }
</style>
