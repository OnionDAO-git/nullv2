<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import { FACTIONS, type FactionId } from '@nullv2/types';

  let { data } = $props();

  function relativeTime(iso: string | null): string {
    if (!iso) return 'unscheduled';
    const d = new Date(iso);
    const today = new Date();
    const ms = d.getTime() - today.getTime();
    const future = ms > 0;
    const abs = Math.abs(ms);
    const days = Math.floor(abs / 86_400_000);
    const hours = Math.floor((abs % 86_400_000) / 3_600_000);
    if (days >= 1) {
      const part = `${days}d ${hours}h`;
      return future ? `in ${part}` : `${part} ago`;
    }
    return future ? `in ${hours}h` : `${hours}h ago`;
  }

  function jobStatusLabel(s: string): string {
    if (s === 'queued') return 'queued · printing soon';
    if (s === 'printing') return 'printing now';
    if (s === 'ready') return 'ready · collect at desk';
    return s;
  }
</script>

<NavShell
  active="embassy"
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
          <SectionTag label="The Embassy · where the city meets the floor" />
        </div>
        <h1 class="hero__title">
          the front desk<br /><span class="dim">of null city.</span>
        </h1>
        <p class="hero__epigraph">
          <em>
            this is where staff hand you Shards for showing up, and where the
            print desk turns your recipes into lanyard tokens. everything else
            in the city is downstream of this room.
          </em>
        </p>
      </div>
    </section>

    <!-- City snapshot -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="City snapshot" />
      </div>
      <dl class="snapshot">
        <div class="snap">
          <dt>living residents</dt>
          <dd>{data.cityCounts.living}</dd>
        </div>
        <div class="snap">
          <dt>archived souls</dt>
          <dd>{data.cityCounts.archived}</dd>
        </div>
      </dl>
    </section>

    <!-- Open print jobs / claim codes -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag
          label={`Your claim codes · ${data.openJobs.length} ${data.openJobs.length === 1 ? 'piece' : 'pieces'} pending`}
        />
      </div>
      {#if data.openJobs.length === 0}
        <div class="empty">
          <em>
            no pieces waiting. when you redeem an achievement, your claim code
            will appear here. show it at the print desk.
          </em>
        </div>
      {:else}
        <ul class="jobs">
          {#each data.openJobs as job (job.id)}
            {@const f = job.factions[0] ? FACTIONS[job.factions[0] as FactionId] : null}
            <li
              class="job"
              class:job--ready={job.status === 'ready'}
              class:job--locks={job.factions.includes('locksmiths')}
              style:--accent={f?.color ?? 'var(--ground-4)'}
            >
              <div class="job__head">
                <div class="job__name">{job.achievementName}</div>
                <div class="job__status">{jobStatusLabel(job.status)}</div>
              </div>
              <div class="job__code-wrap">
                <span class="job__code-label">claim</span>
                <span class="job__code">{job.claimCode}</span>
              </div>
              <div class="job__hint">
                <em>bring this code to the print desk at the embassy.</em>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Workshop schedule -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag
          label={`Workshops · ${data.workshops.length} on the schedule`}
        />
      </div>
      {#if data.workshops.length === 0}
        <div class="empty">
          <em>no workshops scheduled. ask staff what is happening today.</em>
        </div>
      {:else}
        <ul class="workshops">
          {#each data.workshops as w (w.id)}
            {@const f = w.faction ? FACTIONS[w.faction] : null}
            <li
              class="ws"
              class:ws--locks={w.faction === 'locksmiths'}
              class:ws--active={w.status === 'active'}
              style:--accent={f?.color ?? 'var(--ground-4)'}
            >
              <div class="ws__head">
                <div class="ws__title">{w.title}</div>
                {#if w.status === 'active'}
                  <span class="ws__active">active now</span>
                {/if}
              </div>
              <div class="ws__meta">
                {#if f}
                  <span class="ws__faction">{f.name.replace(/^The /, '').toLowerCase()}</span>
                  <span class="ws__dot" aria-hidden="true"></span>
                {/if}
                <span class="ws__kind">{w.kind.replace('_', ' ')}</span>
                <span class="ws__dot" aria-hidden="true"></span>
                <span class="ws__reward">+{w.shardReward} shards</span>
                <span class="ws__dot" aria-hidden="true"></span>
                <span class="ws__time">{relativeTime(w.scheduledAt)}</span>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <!-- Civic achievements -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Civic achievements · granted, not bought" />
      </div>
      <ul class="civic">
        {#each data.civicAchievements as a (a.id)}
          <li class="civic-row" class:civic-row--earned={a.earned}>
            <div class="civic-row__head">
              <span class="civic-row__name">{a.name}</span>
              {#if a.earned}
                <span class="civic-row__badge">earned</span>
              {/if}
            </div>
            <p class="civic-row__blurb">{a.flavor}</p>
          </li>
        {/each}
      </ul>
    </section>

    <section class="breath">
      <ShardLine breath />
      <div class="breath__caption">
        <em>the embassy keeps the receipts. the city keeps the rest.</em>
      </div>
    </section>
  </div>
</NavShell>

<style>
  .screen { padding-bottom: 32px; }

  .hero { position: relative; padding: 28px 20px 14px; }
  .hero__skyline {
    position: absolute;
    left: 0; right: 0; bottom: 8px;
    opacity: 0.13;
    pointer-events: none;
  }
  .hero__inner { position: relative; }
  .tag-wrap :global(.tag) { margin-bottom: 16px; }
  .tag-wrap--tight :global(.tag) { margin-bottom: 12px; }
  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 38px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }
  .dim { color: var(--text-2); }
  .hero__epigraph {
    margin-top: 16px;
    max-width: 36ch;
    font-family: var(--serif);
    font-size: 13px;
    color: var(--text-3);
    line-height: 1.55;
  }

  .section { padding: 14px 20px 0; max-width: 760px; margin: 0 auto; }

  .snapshot {
    margin: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--ground-3);
    border: 1px solid var(--ground-3);
  }
  .snap { margin: 0; padding: 14px 16px; background: var(--ground-1); }
  .snap dt {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .snap dd {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-size: 22px;
    font-weight: 300;
    color: var(--text-0);
    letter-spacing: -0.01em;
  }

  .empty {
    margin: 0;
    padding: 22px 20px;
    text-align: center;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-3);
    line-height: 1.6;
  }

  /* JOBS */
  .jobs { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .job {
    padding: 14px 16px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
  }
  .job--ready {
    background: linear-gradient(180deg, rgba(228, 184, 64, 0.08), transparent 40%) var(--ground-1);
    border-color: var(--s-gold);
  }
  .job--locks { box-shadow: inset 0 0 14px rgba(212, 112, 122, 0.08); }
  .job__head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .job__name {
    font-family: var(--serif);
    font-size: 15px;
    color: var(--text-0);
  }
  .job__status {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .job--ready .job__status { color: var(--s-gold); }
  .job__code-wrap {
    margin-top: 10px;
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .job__code-label {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .job__code {
    font-family: var(--mono);
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    color: var(--text-0);
    user-select: all;
  }
  .job__hint {
    margin-top: 8px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-3);
  }

  /* WORKSHOPS */
  .workshops { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .ws {
    padding: 12px 14px;
    background: var(--ground-0);
    border: 1px solid var(--ground-3);
    border-left: 2px solid var(--accent);
  }
  .ws--active {
    background: var(--ground-1);
    border-left-color: var(--s-gold);
  }
  .ws--locks { box-shadow: inset 0 0 12px rgba(212, 112, 122, 0.06); }
  .ws__head { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .ws__title {
    font-family: var(--serif);
    font-size: 14px;
    color: var(--text-0);
    letter-spacing: -0.005em;
  }
  .ws__active {
    font-family: var(--mono);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--s-gold);
    padding: 2px 6px;
    border: 1px solid var(--s-gold);
  }
  .ws__meta {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-3);
  }
  .ws__faction { color: var(--accent, var(--text-2)); }
  .ws__reward { color: var(--s-gold); }
  .ws__dot {
    width: 3px; height: 3px;
    background: var(--ground-4);
    border-radius: 50%;
  }

  /* CIVIC */
  .civic { list-style: none; margin: 0; padding: 0; }
  .civic-row {
    padding: 12px 14px;
    background: var(--ground-0);
    border: 1px solid var(--ground-3);
    margin-bottom: 6px;
  }
  .civic-row:last-child { margin-bottom: 0; }
  .civic-row--earned {
    background: var(--ground-1);
    border-left: 3px solid var(--s-gold);
  }
  .civic-row__head { display: flex; align-items: baseline; gap: 8px; }
  .civic-row__name {
    font-family: var(--serif);
    font-size: 14px;
    color: var(--text-0);
  }
  .civic-row__badge {
    font-family: var(--mono);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--ground-0);
    background: var(--s-gold);
    padding: 2px 6px;
  }
  .civic-row__blurb {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    line-height: 1.55;
    color: var(--text-3);
  }

  .breath { padding: 22px 20px 24px; max-width: 760px; margin: 0 auto; }
  .breath__caption {
    margin-top: 14px;
    text-align: center;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-3);
  }
</style>
