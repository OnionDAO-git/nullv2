<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { FACTIONS, ROOMS, type RoomId } from '@nullv2/types';
  import { type EmotionId } from '$lib/emotions';

  let { data } = $props();

  const f = $derived(FACTIONS[data.soul.faction]);
  const monogram = $derived(data.soul.name.trim().charAt(0).toUpperCase() || '?');
  const roomLabel = $derived(
    (ROOMS as Record<string, { name: string } | undefined>)[data.soul.roomId as RoomId]?.name
      ?? data.soul.roomId,
  );

  function fmtDate(iso: string): string {
    const d = new Date(iso);
    const dateStr = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return `${dateStr} · ${timeStr}`;
  }

  function fmtDuration(ticks: number, tickMinutes: number = 5): string {
    const totalMinutes = ticks * tickMinutes;
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const bits: string[] = [];
    if (days) bits.push(`${days}d`);
    if (hours) bits.push(`${hours}h`);
    if (minutes && !days) bits.push(`${minutes}m`);
    return bits.length > 0 ? bits.join(' ') : '< 1m';
  }

  function paragraphsOf(body: string): string[] {
    return body
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  const epitaphParas = $derived(paragraphsOf(data.soul.epitaph));
  const seed = $derived(
    data.soul.residentId.charCodeAt(0) * 17 + data.soul.residentId.charCodeAt(1) * 7,
  );

  interface Stat { label: string; value: string }
  const stats = $derived<Stat[]>([
    { label: 'born', value: fmtDate(data.soul.bornAt) },
    {
      label: 'died',
      value: data.soul.diedAt ? fmtDate(data.soul.diedAt) : 'unknown',
    },
    { label: 'lived', value: fmtDuration(data.soul.livedTicks) },
    { label: 'cause', value: `${data.soul.deathCause}` },
    { label: 'last room', value: roomLabel },
    { label: 'visitors', value: `${data.stats.distinctVisitors}` },
    { label: 'shouts', value: `${data.stats.ambientShouts}` },
  ]);

  const soulFields = $derived(
    [
      { label: 'goals', value: data.soul.goals },
      { label: 'alignment', value: data.soul.alignment },
      { label: 'quirks', value: data.soul.quirks },
      { label: 'aesthetic', value: data.soul.aesthetic },
    ].filter((row) => row.value && row.value.trim().length > 0),
  );
</script>

<NavShell
  active="library"
  shardBalance={data.nav.shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.nav.unreadCount}
  standings={data.nav.standings}
>
  <PageHeader shardBalance={data.nav.shardBalance} />

  <div class="screen">
    <!-- Hero (large stained glass + name) -->
    <section
      class="hero"
      class:hero--locks={data.soul.faction === 'locksmiths'}
      style:--accent={f.color}
    >
      <div class="hero__skyline" aria-hidden="true">
        <SkylineSvg orientation="landscape" />
      </div>
      <div class="hero__inner">
        <a class="back" href="/library">← back to library</a>
        <div class="tag-wrap">
          <SectionTag label="Library of Souls · archived" />
        </div>
        <div class="hero__head">
          <div class="hero__avatar">
            <SimpleStainedGlass
              size={132}
              emotion={data.soul.emotion as EmotionId}
              monogram={monogram}
              seed={seed}
            />
          </div>
          <div class="hero__id">
            <div class="hero__faction">{f.name.replace(/^The /, '').toLowerCase()}</div>
            <h1 class="hero__name">{data.soul.name}</h1>
            <div class="hero__meta">
              <span class="meta-pill meta-pill--cause">died of {data.soul.deathCause}</span>
              <span class="meta-dot" aria-hidden="true"></span>
              <span class="meta-text">{fmtDuration(data.soul.livedTicks)}</span>
              <span class="meta-dot" aria-hidden="true"></span>
              <span class="meta-text meta-text--dim">in {roomLabel.toLowerCase()}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Epitaph -->
    <section class="epitaph">
      <div class="epitaph__rule" aria-hidden="true"></div>
      <blockquote class="epitaph__body">
        {#each epitaphParas as para, i (i)}
          <p>{para}</p>
        {/each}
      </blockquote>
      <div class="epitaph__attribution">— filed in the library of souls</div>
    </section>

    <!-- Vitals -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Vitals" />
      </div>
      <dl class="stats">
        {#each stats as s (s.label)}
          <div class="stat">
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        {/each}
      </dl>
    </section>

    {#if data.birthMotto}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag label="First words · the motto carved at birth" />
        </div>
        <p class="motto">"{data.birthMotto}"</p>
      </section>
    {/if}

    {#if soulFields.length > 0}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag label="Soul fields · what they were made of" />
        </div>
        <dl class="soul">
          {#each soulFields as row (row.label)}
            <div class="soul__row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          {/each}
        </dl>
      </section>
    {/if}

    {#if data.lastSpoken.length > 0}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag
            label={`Last lines · ${data.lastSpoken.length} ${data.lastSpoken.length === 1 ? 'utterance' : 'utterances'}`}
          />
        </div>
        <ul class="said">
          {#each data.lastSpoken as line (line.id)}
            <li class="said__row">
              <span class="said__channel">{line.channel === 'shout' ? 'shouted' : 'said'}</span>
              <p class="said__text">"{line.content}"</p>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if data.memories.length > 0}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag label="Memories they carried" />
        </div>
        <ul class="memories">
          {#each data.memories as m (m.id)}
            <li class="mem">
              <span class="mem__kind">{m.kind}</span>
              <p class="mem__body">{m.content}</p>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="breath">
      <ShardLine breath />
      <div class="breath__caption">
        <em>archived {fmtDate(data.soul.archivedAt)}. the library does not resurrect.</em>
      </div>
    </section>
  </div>
</NavShell>

<style>
  .screen { padding-bottom: 32px; }

  .back {
    display: inline-block;
    margin-bottom: 14px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
    text-decoration: none;
    border-bottom: 1px solid var(--ground-4);
    padding-bottom: 1px;
  }
  .back:hover { color: var(--text-1); }

  /* HERO */
  .hero {
    position: relative;
    padding: 24px 20px 22px;
    border-bottom: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
  }
  .hero--locks { box-shadow: inset 0 0 24px rgba(212, 112, 122, 0.08); }
  .hero__skyline {
    position: absolute;
    left: 0; right: 0; bottom: 8px;
    opacity: 0.10;
    pointer-events: none;
  }
  .hero__inner { position: relative; }
  .tag-wrap :global(.tag) { margin-bottom: 18px; }
  .tag-wrap--tight :global(.tag) { margin-bottom: 12px; }

  .hero__head {
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 20px;
    align-items: center;
  }
  .hero__avatar {
    width: 132px;
    height: 132px;
    filter: saturate(0.65);
    opacity: 0.95;
  }
  .hero__id { min-width: 0; }
  .hero__faction {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .hero__name {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-weight: 300;
    font-size: 38px;
    line-height: 1.0;
    letter-spacing: -0.02em;
    color: var(--text-0);
  }
  .hero__meta {
    margin-top: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .meta-pill {
    font-family: var(--mono);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    padding: 2px 6px;
    border: 1px solid var(--ground-4);
    color: var(--text-3);
  }
  .meta-pill--cause { border-color: var(--s-rose); color: var(--s-rose); }
  .meta-dot {
    width: 3px; height: 3px;
    background: var(--ground-4);
    border-radius: 50%;
  }
  .meta-text {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-2);
  }
  .meta-text--dim { color: var(--text-3); }

  /* EPITAPH */
  .epitaph {
    position: relative;
    padding: 60px 24px 36px;
    text-align: center;
    max-width: 760px;
    margin: 0 auto;
  }
  .epitaph__rule {
    width: 1px;
    height: 36px;
    background: var(--ground-4);
    margin: 0 auto 28px;
  }
  .epitaph__body {
    margin: 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: clamp(16px, 2.4vw, 22px);
    line-height: 1.55;
    color: var(--text-1);
  }
  .epitaph__body p {
    margin: 0 0 14px;
    white-space: pre-wrap;
  }
  .epitaph__body p:last-child { margin-bottom: 0; }
  .epitaph__attribution {
    margin-top: 22px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  /* SECTIONS */
  .section { padding: 14px 20px 0; max-width: 760px; margin: 0 auto; }

  .stats {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1px;
    background: var(--ground-3);
    border: 1px solid var(--ground-3);
  }
  .stat {
    margin: 0;
    padding: 12px 12px 10px;
    background: var(--ground-1);
  }
  .stat dt {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .stat dd {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-size: 14px;
    color: var(--text-0);
    letter-spacing: -0.005em;
  }

  .motto {
    margin: 0;
    padding: 18px 18px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--s-gold);
    font-family: var(--serif);
    font-style: italic;
    font-size: 15px;
    line-height: 1.55;
    color: var(--text-1);
    white-space: pre-wrap;
  }

  .soul {
    margin: 0;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
  }
  .soul__row {
    padding: 12px 16px;
    border-bottom: 1px solid var(--ground-2);
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 12px;
    align-items: baseline;
  }
  .soul__row:last-child { border-bottom: none; }
  .soul__row dt {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .soul__row dd {
    margin: 0;
    font-family: var(--serif);
    font-size: 13px;
    line-height: 1.55;
    color: var(--text-1);
  }

  .said { list-style: none; margin: 0; padding: 0; }
  .said__row {
    padding: 12px 16px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    margin-bottom: 8px;
    border-left: 2px solid var(--ground-4);
  }
  .said__row:last-child { margin-bottom: 0; }
  .said__channel {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .said__text {
    margin: 6px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13.5px;
    line-height: 1.55;
    color: var(--text-1);
  }

  .memories { list-style: none; margin: 0; padding: 0; }
  .mem {
    padding: 12px 16px;
    background: var(--ground-0);
    border: 1px solid var(--ground-3);
    margin-bottom: 6px;
  }
  .mem:last-child { margin-bottom: 0; }
  .mem__kind {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .mem__body {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--text-2);
  }

  .breath { padding: 24px 20px 24px; max-width: 760px; margin: 0 auto; }
  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }

  @media (max-width: 520px) {
    .hero__head { grid-template-columns: 96px 1fr; gap: 14px; }
    .hero__avatar { width: 96px; height: 96px; }
    .hero__name { font-size: 30px; }
    .soul__row { grid-template-columns: 1fr; gap: 2px; }
  }
</style>
