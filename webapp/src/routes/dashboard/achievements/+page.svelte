<script lang="ts">
  import PageHeader from '$lib/components/PageHeader.svelte';
  import NavShell from '$lib/components/NavShell.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import {
    FACTIONS,
    FACTION_IDS,
    RESOURCES,
    type FactionId,
    type ResourceId,
  } from '@nullv2/types';

  let { data } = $props();

  type Kind = 'single_faction' | 'cross_faction' | 'civic';
  type Filter = 'all' | 'single_faction' | 'cross_faction' | 'civic';

  let filter = $state<Filter>('all');

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'single_faction', label: 'Single-faction' },
    { id: 'cross_faction', label: 'Cross-faction' },
    { id: 'civic', label: 'Civic' },
  ];

  const KIND_LABEL: Record<Kind, string> = {
    single_faction: 'Single-Faction',
    cross_faction: 'Cross-Faction',
    civic: 'Civic Achievement',
  };

  function colorOf(id: FactionId): string {
    return FACTIONS[id].color;
  }

  let totalResources = $derived(
    Object.values(data.inventory).reduce((acc: number, n) => acc + (n as number), 0),
  );

  let visible = $derived(
    data.achievements.filter((a) => (filter === 'all' ? true : a.kind === filter)),
  );

  function recipeEntries(recipe: Record<string, number>): [ResourceId, number][] {
    return Object.entries(recipe).map(([id, n]) => [id as ResourceId, n as number]);
  }

  function canRedeem(a: (typeof data.achievements)[number]): boolean {
    if (a.kind === 'civic') return false;
    return recipeEntries(a.recipe).every(
      ([rid, n]) => (data.inventory[rid] ?? 0) >= n,
    );
  }
</script>

<NavShell
  active="redeem"
  shardBalance={data.nav.shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.nav.unreadCount}
  standings={data.nav.standings}
>
  <PageHeader shardBalance={data.nav.shardBalance} />

<div class="screen">
  <!-- Hero -->
  <section class="hero">
    <div class="hero__skyline" aria-hidden="true">
      <SkylineSvg orientation="landscape" />
    </div>
    <div class="hero__inner">
      <div class="tag-wrap">
        <SectionTag label="Redeem · the library of recipes" />
      </div>
      <h1 class="hero__title">
        turn<br />resources<br /><span class="dim">into ribbon.</span>
      </h1>
      <p class="hero__lede">
        each redeemed achievement is printed onto a small lanyard token &mdash; and ratifies a
        new parcel on the wall.
      </p>
    </div>
  </section>

  <!-- Inventory summary -->
  <section class="summary-section">
    <div class="summary">
      <div class="summary-card">
        <div class="summary-card__n" style:color="var(--s-gold)">
          {data.visitor.human.shardBalance}
        </div>
        <div class="summary-card__l">Shards on hand</div>
      </div>
      <div class="summary-card">
        <div class="summary-card__n" style:color="var(--text-0)">{totalResources}</div>
        <div class="summary-card__l">Resources gathered</div>
      </div>
    </div>
  </section>

  <!-- Resource matrix -->
  <section class="section">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="Inventory · by faction" />
    </div>
    <div class="matrix">
      <div class="matrix__head">
        <span>Faction</span>
        <span class="matrix__cell-h">T1</span>
        <span class="matrix__cell-h">T2</span>
        <span class="matrix__cell-h">T3</span>
      </div>
      {#each FACTION_IDS as fid, i (fid)}
        {@const f = FACTIONS[fid]}
        {@const tiers = [1, 2, 3].map(
          (t) => Object.values(RESOURCES).find((r) => r.faction === fid && r.tier === t)!,
        )}
        <div
          class="matrix__row"
          class:last={i === FACTION_IDS.length - 1}
          style:--accent={colorOf(fid)}
        >
          <span class="matrix__name">{f.name.replace(/^The /, '')}</span>
          {#each tiers as r (r.id)}
            {@const n = data.inventory[r.id] ?? 0}
            <span class="matrix__cell" class:matrix__cell--zero={n === 0}>{n}</span>
          {/each}
        </div>
      {/each}
    </div>
  </section>

  <!-- Achievements + filters -->
  <section class="section">
    <div class="tag-wrap tag-wrap--tight">
      <SectionTag label="Achievements" />
    </div>
    <div class="chips">
      {#each FILTERS as opt (opt.id)}
        <button
          type="button"
          class="chip"
          class:chip--active={filter === opt.id}
          onclick={() => (filter = opt.id)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </section>

  <section class="cards">
    {#each visible as a (a.id)}
      {@const factionsArr = a.factions}
      {@const c1 = factionsArr[0] ? colorOf(factionsArr[0] as FactionId) : null}
      {@const c2 = factionsArr[1] ? colorOf(factionsArr[1] as FactionId) : null}
      {@const ok = canRedeem(a)}
      <article class="ach-card">
        {#if a.kind === 'single_faction' && c1}
          <span class="leftbar leftbar--solid" style:background={c1}></span>
        {:else if a.kind === 'cross_faction' && c1 && c2}
          <span class="leftbar leftbar--top" style:background={c1}></span>
          <span class="leftbar leftbar--bot" style:background={c2}></span>
        {:else}
          <span class="leftbar leftbar--civic"></span>
        {/if}

        <header class="ach-card__head">
          <div>
            <div class="ach-card__kind">{KIND_LABEL[a.kind as Kind]}</div>
            <div class="ach-card__name">{a.name}</div>
          </div>
          {#if a.kind === 'civic'}
            <span class="status-tag" class:status-tag--granted={a.granted}>
              {a.granted ? 'Granted' : 'Pending'}
            </span>
          {/if}
        </header>

        <p class="ach-card__flavor">{a.flavor}</p>

        {#if a.kind !== 'civic'}
          {@const entries = recipeEntries(a.recipe)}
          <div class="recipe">
            <div class="recipe__head">Recipe</div>
            {#each entries as [rid, need], i (rid)}
              {@const r = RESOURCES[rid]}
              {@const have = data.inventory[rid] ?? 0}
              {@const ingOk = have >= need}
              {@const isLocks = r.faction === 'locksmiths'}
              <div class="ing" class:last={i === entries.length - 1}>
                <span
                  class="ing__swatch"
                  class:ing__swatch--locks={isLocks}
                  style:background={colorOf(r.faction)}
                ></span>
                <div class="ing__body">
                  <div class="ing__name" class:ing__name--dim={!ingOk}>{r.name}</div>
                  <div class="ing__cost">T{r.tier} · {r.shardCost} shards</div>
                </div>
                <div class="ing__need" class:ing__need--ok={ingOk} class:ing__need--short={!ingOk}>
                  {have}<span class="ing__slash">/{need}</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <div class="action">
          {#if a.kind === 'civic'}
            <span class="civic-line">
              {a.granted
                ? 'bestowed by the embassy.'
                : "awaiting the embassy's notice."}
            </span>
          {:else}
            <button type="button" class="redeem-btn" class:redeem-btn--on={ok} disabled={!ok}>
              {ok ? 'Redeem → print lanyard' : 'Short on resources'}
            </button>
          {/if}
        </div>
      </article>
    {/each}
  </section>

  <section class="breath">
    <ShardLine breath />
    <div class="breath__caption"><em>their memory got a little of you in it.</em></div>
  </section>
</div>
</NavShell>

<style>
  .screen {
    padding-bottom: 32px;
  }

  /* Hero */
  .hero {
    position: relative;
    padding: 28px 20px 14px;
  }

  .hero__skyline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    opacity: 0.14;
    pointer-events: none;
  }

  .hero__inner {
    position: relative;
  }

  .tag-wrap :global(.tag) {
    margin-bottom: 18px;
  }

  .tag-wrap--tight :global(.tag) {
    margin-bottom: 12px;
  }

  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 42px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }

  .dim {
    color: var(--text-2);
  }

  .hero__lede {
    margin: 12px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.5;
    max-width: 290px;
  }

  /* Inventory summary */
  .summary-section {
    padding: 8px 20px 0;
  }

  .summary {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .summary-card {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 14px;
  }

  .summary-card__n {
    font-family: var(--mono);
    font-size: 28px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .summary-card__l {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Sections */
  .section {
    padding: 20px 20px 0;
  }

  /* Matrix */
  .matrix {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
  }

  .matrix__head,
  .matrix__row {
    display: grid;
    grid-template-columns: 1fr 32px 32px 32px;
    gap: 8px;
    padding: 10px 14px;
    align-items: center;
  }

  .matrix__head {
    border-bottom: 1px solid var(--ground-3);
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .matrix__cell-h {
    text-align: center;
  }

  .matrix__row {
    padding: 11px 14px;
    border-bottom: 1px solid var(--ground-2);
    border-left: 3px solid var(--accent);
  }

  .matrix__row.last {
    border-bottom: none;
  }

  .matrix__name {
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-0);
  }

  .matrix__cell {
    text-align: center;
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-0);
  }

  .matrix__cell--zero {
    color: var(--text-3);
  }

  /* Chips */
  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chip {
    background: transparent;
    border: 1px solid var(--ground-4);
    color: var(--text-2);
    padding: 6px 12px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    cursor: pointer;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
  }

  .chip--active {
    background: var(--ground-3);
    border-color: var(--s-gold);
    color: var(--s-gold);
  }

  /* Achievement cards */
  .cards {
    padding: 16px 20px 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ach-card {
    position: relative;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 16px 18px 14px 18px;
  }

  .leftbar {
    position: absolute;
    left: 0;
    width: 3px;
  }

  .leftbar--solid {
    top: 0;
    bottom: 0;
  }

  .leftbar--top {
    top: 0;
    height: 50%;
  }

  .leftbar--bot {
    bottom: 0;
    height: 50%;
  }

  .leftbar--civic {
    top: 0;
    bottom: 0;
    background-image: repeating-linear-gradient(
      180deg,
      var(--text-3) 0 4px,
      transparent 4px 8px
    );
  }

  .ach-card__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }

  .ach-card__kind {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .ach-card__name {
    margin-top: 4px;
    font-family: var(--serif);
    font-size: 19px;
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.01em;
  }

  .status-tag {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
    border: 1px solid var(--ground-4);
    padding: 3px 8px;
    white-space: nowrap;
  }

  .status-tag--granted {
    color: var(--s-gold);
    border-color: var(--s-gold);
  }

  .ach-card__flavor {
    margin: 10px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.5;
  }

  .recipe {
    margin-top: 14px;
  }

  .recipe__head {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
    padding-bottom: 4px;
    border-bottom: 1px solid var(--ground-3);
  }

  .ing {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid var(--ground-2);
  }

  .ing.last {
    border-bottom: none;
  }

  .ing__swatch {
    width: 10px;
    height: 10px;
  }

  .ing__swatch--locks {
    box-shadow: 0 0 5px rgba(212, 112, 122, 0.6);
  }

  .ing__name {
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-0);
  }

  .ing__name--dim {
    color: var(--text-2);
  }

  .ing__cost {
    margin-top: 2px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .ing__need {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .ing__need--ok {
    color: var(--s-green);
  }

  .ing__need--short {
    color: var(--s-rose);
  }

  .ing__slash {
    color: var(--text-3);
    font-weight: 400;
  }

  .action {
    margin-top: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .civic-line {
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
  }

  .redeem-btn {
    flex: 1;
    padding: 11px 14px;
    background: transparent;
    color: var(--text-3);
    border: 1px solid var(--ground-4);
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: not-allowed;
  }

  .redeem-btn--on {
    background: var(--s-gold);
    color: var(--ground-0);
    border-color: var(--s-gold);
    cursor: pointer;
  }

  .breath {
    padding: 24px 20px 36px;
  }

  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }
</style>
