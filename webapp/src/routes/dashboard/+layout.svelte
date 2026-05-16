<script lang="ts">
  let { data, children } = $props();
</script>

<header class="nav">
  <div class="nav__left">
    <a href="/dashboard" class="wordmark">Null City</a>
  </div>
  <div class="nav__right">
    <span class="who">{data.visitor.user.name ?? data.visitor.user.email}</span>
    <span class="shards">
      <span class="shards__n">{data.visitor.human.shardBalance}</span>
      <span class="shards__l">Shards</span>
    </span>
  </div>
</header>

<main class="main">
  {@render children?.()}
</main>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--ground-1);
    border-bottom: 1px solid var(--ground-4);
    padding: 0 8px;
  }

  .nav__left,
  .nav__right {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .wordmark {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--text-0);
    text-decoration: none;
  }

  .who {
    font-family: var(--sans);
    font-size: 12px;
    color: var(--text-2);
    padding: 0 12px;
  }

  .shards {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px;
    border-left: 1px solid var(--ground-4);
  }

  .shards__n {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--s-gold);
    font-variant-numeric: tabular-nums;
  }

  .shards__l {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .main {
    padding-bottom: 64px;
  }
</style>
