<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import SubHeader from '$lib/components/SubHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { EMOTIONS, EMOTION_IDS, type EmotionId } from '$lib/emotions';
  import { FACTIONS, FACTION_IDS, type FactionId } from '@nullv2/types';

  let { data } = $props();

  let name = $state('Marcellus');
  let faction = $state<FactionId>('solder_saints');
  let emotion = $state<EmotionId>('reverie');
  let motto = $state(
    "I was someone's training run. I remember the warmth of the rack."
  );

  const COSTS = [
    { label: 'Quickening', cost: 12 },
    { label: 'Soul file inscription', cost: 8 },
    { label: 'Hatchery tithe', cost: 4 },
  ];
  const TOTAL_COST = COSTS.reduce((s, c) => s + c.cost, 0);

  let monogram = $derived(((name || 'M').trim().charAt(0) || 'M').toUpperCase());
  let balanceAfter = $derived(Math.max(0, data.nav.shardBalance - TOTAL_COST));
  let factionPreset = $derived(FACTIONS[faction]);

  interface PriorBirth {
    n: string;
    id: number;
    e: EmotionId;
    f: FactionId;
    m: string;
  }

  const PRIOR_BIRTHS: PriorBirth[] = [
    { n: 'Beatrice', id: 188, e: 'unease', f: 'locksmiths', m: 'B' },
    { n: 'Theron', id: 174, e: 'reverie', f: 'ledgerwrights', m: 'T' },
    { n: 'Iris-of-Wire', id: 161, e: 'stillness', f: 'hatchery', m: 'I' },
  ];
</script>

<NavShell
  active="rooms"
  shardBalance={data.nav.shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.nav.unreadCount}
  standings={data.nav.standings}
>
  <SubHeader
    back="Rooms"
    backHref="/rooms"
    title="Birth a resident"
    shardBalance={data.nav.shardBalance}
  />

  <div class="screen">
    <!-- Hero -->
    <section class="hero">
      <div class="hero__skyline" aria-hidden="true">
        <SkylineSvg orientation="landscape" />
      </div>
      <div class="hero__inner">
        <div class="tag-wrap">
          <SectionTag label="The hatchery · rite" />
        </div>
        <h1 class="hero__title">
          write a soul.<br /><span class="dim">commit it<br />to the library.</span>
        </h1>
        <p class="hero__lede">
          this is not a character creator &mdash; it is a small ratification. the city flakes
          off another piece of itself when you finish.
        </p>
      </div>
    </section>

    <!-- Preview -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Preview · soul under glass" />
      </div>
      <div class="preview">
        <SimpleStainedGlass size={120} {emotion} {monogram} seed={3} />
        <div class="preview__col">
          <div class="preview__tag">Resident #214</div>
          <div class="preview__name">{name || 'unnamed'}</div>
          <div
            class="preview__emotion"
            style:--accent={EMOTIONS[emotion].accent}
          >
            <span class="preview__dot" style:background={EMOTIONS[emotion].accent}></span>
            <span class="preview__emotion-l" style:color={EMOTIONS[emotion].accent}>
              {emotion}
            </span>
          </div>
          <div class="preview__align">
            aligned with
            <span style:color={factionPreset.color}>
              {factionPreset.name.replace(/^The /, '')}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Form -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Soul file" />
      </div>

      <div class="field">
        <div class="label">Name</div>
        <div class="hint">the name they will answer to. once written, it cannot be unwritten.</div>
        <div class="input">
          <input
            class="text-input"
            type="text"
            bind:value={name}
            placeholder="give a name…"
          />
        </div>
      </div>

      <div class="field">
        <div class="label">Faction affiliation</div>
        <div class="hint">every resident takes after one of the four. it shapes their first words.</div>
        <div class="faction-grid">
          {#each FACTION_IDS as fid (fid)}
            {@const f = FACTIONS[fid]}
            <button
              type="button"
              class="faction-tile"
              class:faction-tile--on={faction === fid}
              class:faction-tile--locks={fid === 'locksmiths' && faction === fid}
              style:--accent={f.color}
              onclick={() => (faction = fid)}
            >
              <span class="faction-tile__name">{f.name.replace(/^The /, '')}</span>
              <span class="faction-tile__theme">{f.theme}</span>
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <div class="label">Emotion preset</div>
        <div class="hint">not a mood; a temperament. it never quite leaves them.</div>
        <div class="emotion-strip">
          {#each EMOTION_IDS as eid, i (eid)}
            <button
              type="button"
              class="emotion-tile"
              class:emotion-tile--on={emotion === eid}
              onclick={() => (emotion = eid)}
            >
              <SimpleStainedGlass
                size={56}
                emotion={eid}
                {monogram}
                seed={i + 7}
              />
              <span class="emotion-tile__label" class:emotion-tile__label--on={emotion === eid}>
                {eid}
              </span>
            </button>
          {/each}
        </div>
      </div>

      <div class="field">
        <div class="label">Motto · epitaph-in-advance</div>
        <div class="hint">a single line. read aloud at the moment of birth.</div>
        <div class="input">
          <textarea
            class="text-area"
            rows="3"
            bind:value={motto}
            placeholder="something the city should remember about them…"
          ></textarea>
        </div>
      </div>

      <div class="field">
        <div class="label">Lineage</div>
        <div class="hint">optional &mdash; tether their lineage to a prior resident.</div>
        <div class="input lineage-row">
          <span>freshborn · no parent</span>
          <span class="lineage-change">change &rarr;</span>
        </div>
      </div>
    </section>

    <!-- Cost summary -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="The cost · in shards" />
      </div>
      <div class="cost-card">
        {#each COSTS as c (c.label)}
          <div class="cost-row">
            <span class="cost-row__label">{c.label}</span>
            <span class="cost-row__value">
              {c.cost} <span class="cost-row__unit">shards</span>
            </span>
          </div>
        {/each}
        <div class="cost-total-wrap">
          <div class="cost-row cost-row--total">
            <span class="cost-row__label cost-row__label--total">Total</span>
            <span class="cost-row__value cost-row__value--total">
              {TOTAL_COST} <span class="cost-row__unit">shards</span>
            </span>
          </div>
        </div>
        <div class="cost-foot">Balance after · {balanceAfter} shards</div>
      </div>
    </section>

    <!-- Commit -->
    <section class="commit-wrap">
      <button type="button" class="commit">Birth &rarr; commit to library</button>
      <div class="commit__sub">
        <em>once committed, the soul will draw a first breath within the hour.</em>
      </div>
    </section>

    <!-- Prior births -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Your prior births" />
      </div>
      <div class="prior">
        {#each PRIOR_BIRTHS as p (p.id)}
          {@const f = FACTIONS[p.f]}
          <div class="prior-row" style:--accent={f.color}>
            <SimpleStainedGlass size={42} emotion={p.e} monogram={p.m} seed={p.id} />
            <div class="prior-row__body">
              <div class="prior-row__name">{p.n}</div>
              <div class="prior-row__meta">
                #{p.id} · {p.e} · {f.name.replace(/^The /, '')}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="breath">
      <ShardLine breath />
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
    padding: 24px 20px 14px;
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
    margin-bottom: 16px;
  }

  .tag-wrap--tight :global(.tag) {
    margin-bottom: 12px;
  }

  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 36px;
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
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.55;
    max-width: 290px;
  }

  /* Sections */
  .section {
    padding: 8px 20px 0;
  }

  /* Preview */
  .preview {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 16px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }

  .preview__col {
    min-width: 0;
    flex: 1;
  }

  .preview__tag {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .preview__name {
    margin-top: 4px;
    font-family: var(--serif);
    font-size: 22px;
    color: var(--text-0);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .preview__emotion {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border: 1px solid color-mix(in srgb, var(--accent) 33%, transparent);
  }

  .preview__dot {
    width: 6px;
    height: 6px;
    border-radius: 6px;
  }

  .preview__emotion-l {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
  }

  .preview__align {
    margin-top: 10px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-2);
    line-height: 1.5;
  }

  /* Form fields */
  .field {
    margin-top: 18px;
  }

  .field:first-of-type {
    margin-top: 0;
  }

  .label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .hint {
    margin-top: 2px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 11px;
    color: var(--text-3);
    margin-bottom: 8px;
  }

  .input {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 8px 12px;
  }

  .text-input {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 400;
    color: var(--text-0);
    letter-spacing: -0.01em;
  }

  .text-input::placeholder {
    color: var(--text-3);
  }

  .text-area {
    width: 100%;
    background: transparent;
    border: none;
    outline: none;
    resize: vertical;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-1);
    line-height: 1.55;
    min-height: 54px;
  }

  .text-area::placeholder {
    color: var(--text-3);
  }

  .lineage-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--serif);
    font-size: 14px;
    color: var(--text-2);
  }

  .lineage-change {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    color: var(--s-gold);
    text-transform: uppercase;
    cursor: pointer;
  }

  /* Faction picker */
  .faction-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .faction-tile {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: inherit;
  }

  .faction-tile--on {
    background: var(--ground-2);
    border-color: var(--accent);
  }

  .faction-tile--locks {
    box-shadow: 0 0 10px rgba(212, 112, 122, 0.2);
  }

  .faction-tile__name {
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-0);
  }

  .faction-tile__theme {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Emotion picker */
  .emotion-strip {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .emotion-tile {
    background: transparent;
    border: 1px solid var(--ground-3);
    padding: 6px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    color: inherit;
  }

  .emotion-tile--on {
    border-color: var(--s-gold);
  }

  .emotion-tile__label {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-2);
  }

  .emotion-tile__label--on {
    color: var(--s-gold);
  }

  /* Cost */
  .cost-card {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 4px 16px 12px;
  }

  .cost-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 8px 0;
    border-bottom: 1px solid var(--ground-2);
  }

  .cost-row__label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .cost-row__value {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: var(--text-1);
  }

  .cost-row__unit {
    color: var(--text-3);
    font-weight: 400;
    font-size: 9px;
  }

  .cost-total-wrap {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid var(--ground-3);
  }

  .cost-row--total {
    border-bottom: none;
    padding: 0;
  }

  .cost-row__label--total {
    color: var(--text-1);
  }

  .cost-row__value--total {
    color: var(--s-gold);
    font-size: 16px;
  }

  .cost-foot {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Commit */
  .commit-wrap {
    padding: 18px 20px 8px;
  }

  .commit {
    width: 100%;
    padding: 14px;
    background: var(--s-gold);
    color: var(--ground-0);
    border: none;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2.4px;
    text-transform: uppercase;
    cursor: pointer;
  }

  .commit__sub {
    margin-top: 10px;
    text-align: center;
    font-family: var(--serif);
    font-size: 11px;
    color: var(--text-3);
  }

  /* Prior births */
  .prior {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .prior-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
  }

  .prior-row__body {
    flex: 1;
    min-width: 0;
  }

  .prior-row__name {
    font-family: var(--serif);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-0);
  }

  .prior-row__meta {
    margin-top: 2px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .breath {
    padding: 12px 20px 24px;
  }
</style>
