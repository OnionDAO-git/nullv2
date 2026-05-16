<script lang="ts">
  import SectionTag from '$lib/components/SectionTag.svelte';

  let { data } = $props();
</script>

<section class="factions">
  <SectionTag label="Factions" />

  <div class="grid">
    {#each data.standing as row (row.faction.id)}
      <article class="card" style:--accent={row.faction.color}>
        <header class="card__head">
          <h3>{row.faction.name}</h3>
          <span class="tier">{row.tier}</span>
        </header>
        <p class="motto">{row.faction.motto}</p>
        <p class="points">
          <span class="points__n">{row.points}</span>
          <span class="points__l">standing</span>
        </p>
      </article>
    {/each}
  </div>
</section>

<style>
  .factions {
    max-width: 1100px;
    margin: 0 auto;
    padding: 64px 32px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .card {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent, var(--ground-5));
    padding: 24px;
    transition: border-color 0.2s, background 0.2s;
  }

  .card:hover {
    background: var(--ground-2);
    border-color: var(--ground-4);
    border-left-color: var(--accent, var(--ground-5));
  }

  .card__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  h3 {
    font-family: var(--serif);
    font-size: 20px;
    font-weight: 500;
    color: var(--text-0);
    margin: 0;
  }

  .tier {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .motto {
    font-family: var(--serif);
    font-style: italic;
    font-size: 14px;
    color: var(--text-2);
    margin: 0 0 16px;
    line-height: 1.5;
  }

  .points {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin: 0;
  }

  .points__n {
    font-family: var(--mono);
    font-size: 18px;
    color: var(--text-1);
    font-variant-numeric: tabular-nums;
  }

  .points__l {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
  }
</style>
