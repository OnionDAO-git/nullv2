<script lang="ts">
  let { label }: { label: string } = $props();
</script>

<div class="tag">
  {label}
</div>

<style>
  .tag {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 300;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 64px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .tag::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--ground-4);
  }

  @media (max-width: 520px) {
    .tag {
      margin-bottom: 40px;
      letter-spacing: 3px;
    }
  }
</style>
