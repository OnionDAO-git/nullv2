<script lang="ts">
  let { data } = $props();
</script>

<section>
  <h2>Factions</h2>
  <div class="grid">
    {#each data.standing as row (row.faction.id)}
      <article style:border-color={row.faction.color}>
        <header>
          <h3>{row.faction.name}</h3>
          <span class="tier">{row.tier}</span>
        </header>
        <p class="motto">{row.faction.motto}</p>
        <p class="points">{row.points} standing points</p>
      </article>
    {/each}
  </div>
</section>

<style>
  section {
    padding: 2rem 1.5rem;
    max-width: 64rem;
    margin: 0 auto;
  }
  h2 {
    font-size: 1rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #999;
    margin: 0 0 1rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
    gap: 1rem;
  }
  article {
    border: 1px solid #2a2a2a;
    border-left-width: 4px;
    padding: 1rem 1.25rem;
    background: #111;
  }
  article header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  h3 {
    margin: 0;
    font-size: 1.1rem;
  }
  .tier {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
  }
  .motto {
    font-style: italic;
    color: #c0c0c0;
    margin: 0.5rem 0;
  }
  .points {
    margin: 0;
    color: #777;
    font-variant-numeric: tabular-nums;
  }
</style>
