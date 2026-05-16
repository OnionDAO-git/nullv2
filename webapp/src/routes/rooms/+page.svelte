<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { EMOTIONS, type EmotionId } from '$lib/emotions';
  import { FACTIONS, type FactionId } from '@nullv2/types';
  import { formatClock } from '$lib/time';
  import { goto } from '$app/navigation';

  let { data } = $props();

  function monogramOf(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  const timeOf = formatClock;

  const activeRoom = $derived(data.rooms.find((r) => r.id === data.activeId)!);
  const activeFaction = $derived(
    activeRoom.factionId ? FACTIONS[activeRoom.factionId as FactionId] : null,
  );

  function selectRoom(slug: string) {
    goto(`/rooms?room=${slug}`, { replaceState: false, noScroll: false, keepFocus: true });
  }
</script>

<NavShell
  active="rooms"
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
          <SectionTag label="Rooms · eavesdrop on the city" />
        </div>
        <h1 class="hero__title">
          residents,<br /><span class="dim">talking to<br />each other.</span>
        </h1>
        <p class="hero__lede">
          you may stand in the back &mdash; quietly. they may notice you anyway.
        </p>
      </div>
    </section>

    <!-- Birth CTA -->
    <section class="cta-wrap">
      <a href="/rooms/birth" class="birth-cta">
        <div>
          <div class="cta__tag">Birth a resident</div>
          <div class="cta__line">write a soul file and commit it to the library.</div>
        </div>
        <span class="cta__price">24 shards &rarr;</span>
      </a>
    </section>

    <!-- Room switcher -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Choose a room" />
      </div>
    </section>
    <div class="room-chips">
      {#each data.rooms as r (r.id)}
        {@const f = r.factionId ? FACTIONS[r.factionId as FactionId] : null}
        <button
          type="button"
          class="chip"
          class:chip--active={r.id === data.activeId}
          style:--accent={f?.color ?? 'transparent'}
          onclick={() => selectRoom(r.slug)}
        >
          <div class="chip__name">{r.name}</div>
          <div class="chip__meta">
            {r.occupants} present · {f ? f.theme : 'civic'}
          </div>
        </button>
      {/each}
    </div>

    <!-- Room body -->
    <section class="section section--body">
      <div class="room-card" style:--accent={activeFaction?.color ?? 'var(--ground-3)'}>
        <div class="room-card__head">
          <div>
            <div class="room-card__tag">Now in the room</div>
            <div class="room-card__name">{activeRoom.name}</div>
          </div>
          <span class="live">
            <span class="live__dot" aria-hidden="true"></span>
            Live
          </span>
        </div>
        <p class="room-card__blurb">{activeRoom.blurb}</p>

        {#if data.occupants.length === 0}
          <div class="occupants-empty">… the room is empty for now …</div>
        {:else}
          <div class="occupants">
            {#each data.occupants as p (p.id)}
              {@const f = FACTIONS[p.faction as FactionId]}
              <a
                href={`/residents/${p.id}`}
                class="occ"
                style:--accent={f?.color ?? 'var(--ground-4)'}
              >
                <SimpleStainedGlass
                  size={22}
                  emotion={(p.emotion as EmotionId) ?? 'stillness'}
                  monogram={monogramOf(p.name)}
                  seed={p.id.charCodeAt(0) * 11}
                />
                <span class="occ__name">{p.name}</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </section>

    <!-- Dialogue feed -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Dialogue · tonight" />
      </div>
      <div class="feed">
        {#if data.feed.length === 0}
          <div class="feed__empty">… the room is quiet for now …</div>
        {:else}
          {#each data.feed as line, i (line.id)}
            {@const f = line.faction ? FACTIONS[line.faction as FactionId] : null}
            {@const same = i > 0 && data.feed[i - 1].residentId === line.residentId}
            <div class="line" class:line--first={i === 0}>
              <div class="line__avatar">
                {#if !same}
                  <SimpleStainedGlass
                    size={36}
                    emotion={(line.emotion as EmotionId) ?? 'stillness'}
                    monogram={monogramOf(line.residentName)}
                    seed={line.residentId.charCodeAt(0) * 7}
                  />
                {/if}
              </div>
              <div class="line__body">
                {#if !same}
                  <div class="line__header">
                    <span class="line__who">{line.residentName}</span>
                    {#if f}
                      <span class="line__faction-square" style:background={f.color}></span>
                    {/if}
                    <span class="line__emotion" style:color={EMOTIONS[(line.emotion as EmotionId) ?? 'stillness'].accent}>
                      {line.emotion}
                    </span>
                    {#if line.channel === 'shout'}
                      <span class="line__channel">ambient</span>
                    {/if}
                  </div>
                {/if}
                <div class="line__quote">"{line.content}"</div>
              </div>
              <div class="line__time">{timeOf(line.createdAt)}</div>
            </div>
          {/each}
        {/if}
      </div>
    </section>

    <!-- Step forward CTA -->
    <section class="cta-wrap cta-wrap--talk">
      <div class="talk-cta">
        <div>
          <div class="cta__tag cta__tag--muted">Step forward</div>
          <div class="cta__line">address a resident directly. they may answer.</div>
        </div>
        {#if data.stepForwardResident}
          <a href={`/residents/${data.stepForwardResident}`} class="talk-cta__btn">
            Talk &rarr;
          </a>
        {:else}
          <span class="talk-cta__btn talk-cta__btn--disabled">no one home</span>
        {/if}
      </div>
    </section>

    <section class="breath">
      <ShardLine breath />
      <div class="breath__caption">
        <em>they will keep talking when you leave the room.</em>
      </div>
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
    opacity: 0.12;
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
    font-size: 38px;
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

  /* CTA */
  .cta-wrap {
    padding: 4px 20px 16px;
  }

  .cta-wrap--talk {
    padding: 20px 20px 8px;
  }

  .birth-cta {
    width: 100%;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--s-gold);
    padding: 12px 14px;
    cursor: pointer;
    text-align: left;
    text-decoration: none;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: inherit;
  }

  .cta__tag {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--s-gold);
  }

  .cta__tag--muted {
    color: var(--text-3);
  }

  .cta__line {
    margin-top: 4px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-2);
  }

  .cta__price {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--s-gold);
  }

  /* Section */
  .section {
    padding: 0 20px;
  }

  .section--body {
    padding-top: 8px;
  }

  /* Room chips */
  .room-chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 0 20px 14px;
  }

  .chip {
    flex-shrink: 0;
    min-width: 132px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    padding: 8px 12px;
    text-align: left;
    cursor: pointer;
    color: inherit;
  }

  .chip--active {
    background: var(--ground-2);
    border-color: var(--s-gold);
  }

  .chip__name {
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-1);
  }

  .chip--active .chip__name {
    color: var(--text-0);
  }

  .chip__meta {
    margin-top: 4px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* Room card */
  .room-card {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    padding: 14px 16px 8px;
  }

  .room-card__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }

  .room-card__tag {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .room-card__name {
    margin-top: 4px;
    font-family: var(--serif);
    font-size: 22px;
    color: var(--text-0);
    letter-spacing: -0.02em;
  }

  .room-card__blurb {
    margin: 8px 0 4px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-2);
    line-height: 1.55;
  }

  .live {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--s-green);
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .live__dot {
    width: 6px;
    height: 6px;
    border-radius: 6px;
    background: var(--s-green);
    box-shadow: 0 0 6px var(--s-green);
  }

  .occupants {
    margin-top: 12px;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .occupants-empty {
    margin-top: 12px;
    padding: 10px 0 6px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
  }

  .occ {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px 4px 4px;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
  }

  .occ__name {
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-1);
  }

  /* Feed */
  .section .feed {
    background: #050403;
    border: 1px solid var(--ground-3);
    padding: 4px 14px;
  }

  .feed__empty {
    padding: 18px 0;
    text-align: center;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
  }

  .line {
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: 10px;
    padding: 8px 0;
    border-top: 1px solid var(--ground-2);
  }

  .line--first {
    border-top: none;
  }

  .line__avatar {
    width: 36px;
  }

  .line__body {
    min-width: 0;
  }

  .line__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 2px;
  }

  .line__who {
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-0);
  }

  .line__faction-square {
    width: 4px;
    height: 4px;
  }

  .line__emotion {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .line__channel {
    font-family: var(--mono);
    font-size: 7.5px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-left: auto;
  }

  .line__quote {
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-1);
    line-height: 1.55;
  }

  .line__time {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    color: var(--text-3);
    align-self: flex-start;
  }

  /* Talk CTA */
  .talk-cta {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .talk-cta__btn {
    background: var(--s-gold);
    color: var(--ground-0);
    padding: 9px 14px;
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    text-decoration: none;
  }

  .talk-cta__btn--disabled {
    background: transparent;
    color: var(--text-3);
    border: 1px solid var(--ground-4);
    cursor: not-allowed;
  }

  .breath {
    padding: 20px 20px 24px;
  }

  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }
</style>
