<script lang="ts">
  let { data, children } = $props();
</script>

<header>
  <strong>Null City</strong>
  <span>·</span>
  <span>{data.visitor.user.name ?? data.visitor.user.email}</span>
  <span class="balance">{data.visitor.human.shardBalance} Shards</span>
</header>

{@render children?.()}

<style>
  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #1f1f1f;
  }
  .balance {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    color: #e6b800;
  }
</style>
