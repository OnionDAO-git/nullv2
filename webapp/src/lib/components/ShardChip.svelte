<script lang="ts">
  let { count = 0 }: { count?: number } = $props();
</script>

<span class="chip">
  <span class="diamond" aria-hidden="true"></span>
  <span class="n">{count}</span>
  <span class="l">shards</span>
</span>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--ground-2);
    border: 1px solid var(--ground-4);
  }

  .diamond {
    width: 8px;
    height: 8px;
    transform: rotate(45deg);
    background: var(--s-gold);
    box-shadow: 0 0 6px rgba(228, 184, 64, 0.5);
  }

  .n {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--s-gold);
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .l {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
    line-height: 1;
  }
</style>
