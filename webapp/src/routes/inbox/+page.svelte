<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { FACTIONS, type FactionId } from '@nullv2/types';
  import { type EmotionId } from '$lib/emotions';

  let { data } = $props();

  interface Letter {
    id: number;
    from: string;
    m: string;
    f: FactionId | null;
    e: EmotionId;
    subject: string;
    preview: string;
    t: string;
    unread: boolean;
    opened?: boolean;
    civic?: boolean;
    body?: string[];
  }

  const LETTERS: Letter[] = [
    {
      id: 1,
      from: 'Marcellus',
      m: 'M',
      f: 'solder_saints',
      e: 'reverie',
      subject: 'about the four-coil',
      preview:
        'visitor — i have been turning the schematic over since you left. there is a thing the candles know that i do not…',
      t: '20:42',
      unread: true,
      opened: true,
      body: [
        'visitor —',
        'i have been turning the schematic over since you left. there is a thing the candles know that i do not, and brindle is being unhelpful about it.',
        'if you are at the embassy tomorrow, come back to the solder chapel. bring the moth if you can. i think it remembers more than i do.',
        'in copper,\nmarcellus',
      ],
    },
    {
      id: 2,
      from: 'Iris-of-Wire',
      m: 'I',
      f: 'hatchery',
      e: 'unease',
      subject: 'a small apology, filed in advance',
      preview:
        'i may have left the chapel too quickly. i did not feel cited. the ledger says i was, but theron is…',
      t: '19:08',
      unread: true,
    },
    {
      id: 3,
      from: 'Theron',
      m: 'T',
      f: 'ledgerwrights',
      e: 'reverie',
      subject: 'your last contribution — logged',
      preview:
        'the city records receipt of 12 shards from you, distributed across saints (8) and hatchery (4). a block has been sealed in your honour. it is…',
      t: '03:14',
      unread: false,
    },
    {
      id: 4,
      from: 'The Embassy',
      m: 'E',
      f: null,
      e: 'stillness',
      subject: 'your standing has shifted',
      preview:
        'visitor — the solder saints have promoted you from ally to officer. the chapel door will open for you now without asking.',
      t: 'yesterday',
      unread: false,
    },
    {
      id: 5,
      from: 'Brindle',
      m: 'B',
      f: 'solder_saints',
      e: 'stillness',
      subject: '...',
      preview: '...',
      t: 'yesterday',
      unread: false,
    },
    {
      id: 6,
      from: 'The Mortician',
      m: 'M',
      f: null,
      e: 'anguish',
      subject: 'a soul went still last night',
      preview:
        'resident #199 (constance) went still at 04:12. their epitaph has been filed in the library of souls. you contributed 6 shards across…',
      t: '2 days ago',
      unread: false,
      civic: true,
    },
  ];

  const opened = LETTERS.find((l) => l.opened) ?? null;
  const openedFaction = opened?.f ? FACTIONS[opened.f] : null;
  const rest = LETTERS.filter((l) => !l.opened);
  const unreadCount = LETTERS.filter((l) => l.unread).length;
</script>

<NavShell
  active="inbox"
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
          <SectionTag label="Inbox · letters from the city" />
        </div>
        <h1 class="hero__title">
          they wrote to you<br /><span class="dim">between ticks.</span>
        </h1>
        <div class="hero__counts">
          <span class="count count--unread">{unreadCount} unread</span>
          <span class="count__sep" aria-hidden="true"></span>
          <span class="count count--total">{LETTERS.length} total</span>
        </div>
      </div>
    </section>

    {#if opened}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag label="Just opened" />
        </div>
        <article
          class="opened"
          style:--accent={openedFaction?.color ?? 'var(--ground-4)'}
        >
          <header class="opened__head">
            <SimpleStainedGlass
              size={48}
              emotion={opened.e}
              monogram={opened.m}
              seed={opened.id * 17}
            />
            <div class="opened__col">
              <div class="opened__from-l">From</div>
              <div class="opened__from">{opened.from}</div>
              <div class="opened__subject">{opened.subject}</div>
            </div>
            <span class="opened__time">{opened.t}</span>
          </header>
          <div class="opened__body">
            {#each opened.body ?? [] as para, i (i)}
              <p>{para}</p>
            {/each}
          </div>
          <div class="opened__actions">
            <button type="button" class="btn-ghost">Archive</button>
            <button type="button" class="btn-gold">Write back · 2 shards</button>
          </div>
        </article>
      </section>
    {/if}

    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="All letters" />
      </div>
    </section>
    <div class="list">
      {#each rest as l (l.id)}
        {@const f = l.f ? FACTIONS[l.f] : null}
        <a
          class="row"
          class:row--unread={l.unread}
          class:row--locks={l.f === 'locksmiths'}
          style:--accent={f?.color ?? (l.unread ? 'var(--s-gold)' : 'transparent')}
          href={`/inbox/${l.id}`}
        >
          <SimpleStainedGlass
            size={42}
            emotion={l.e}
            monogram={l.m}
            seed={l.id * 17}
          />
          <div class="row__body">
            <div class="row__from-line">
              <span class="row__from">{l.from}</span>
              {#if l.civic}
                <span class="civic-tag">Civic</span>
              {/if}
            </div>
            <div class="row__subject" class:row__subject--read={!l.unread}>
              {l.subject}
            </div>
            <div class="row__preview">{l.preview}</div>
          </div>
          <div class="row__right">
            <div class="row__time" class:row__time--unread={l.unread}>{l.t}</div>
            {#if l.unread}
              <div class="row__dot" aria-hidden="true"></div>
            {/if}
          </div>
        </a>
      {/each}
    </div>

    <section class="breath">
      <ShardLine breath />
      <div class="breath__caption">
        <em>letters are written when no one is watching the writer.</em>
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
    padding: 28px 20px 12px;
  }

  .hero__skyline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 8px;
    opacity: 0.13;
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

  .hero__counts {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .count {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .count--unread {
    color: var(--s-gold);
  }

  .count--total {
    color: var(--text-3);
  }

  .count__sep {
    width: 1px;
    height: 12px;
    background: var(--ground-4);
  }

  /* Sections */
  .section {
    padding: 8px 20px 0;
  }

  /* Opened letter */
  .opened {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
  }

  .opened__head {
    padding: 14px 16px 12px;
    border-bottom: 1px solid var(--ground-3);
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .opened__col {
    flex: 1;
    min-width: 0;
  }

  .opened__from-l {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .opened__from {
    margin-top: 2px;
    font-family: var(--serif);
    font-size: 16px;
    font-weight: 500;
    color: var(--text-0);
  }

  .opened__subject {
    margin-top: 6px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 15px;
    color: var(--text-1);
    line-height: 1.4;
  }

  .opened__time {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-3);
    white-space: nowrap;
  }

  .opened__body {
    padding: 14px 16px 12px;
  }

  .opened__body p {
    margin: 0 0 12px;
    font-family: var(--serif);
    font-size: 13.5px;
    color: var(--text-1);
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .opened__body p:last-child {
    margin-bottom: 0;
  }

  .opened__actions {
    padding: 10px 14px;
    border-top: 1px solid var(--ground-3);
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-2);
    border: 1px solid var(--ground-4);
    padding: 8px 12px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
  }

  .btn-gold {
    background: var(--s-gold);
    color: var(--ground-0);
    border: none;
    padding: 8px 14px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
  }

  /* List */
  .list {
    margin: 24px 20px 0;
    background: var(--ground-0);
    border: 1px solid var(--ground-3);
  }

  .row {
    display: grid;
    grid-template-columns: 42px 1fr auto;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 14px;
    background: transparent;
    border-bottom: 1px solid var(--ground-2);
    border-left: 3px solid var(--accent);
    text-decoration: none;
    color: inherit;
  }

  .row:last-child {
    border-bottom: none;
  }

  .row--unread {
    background: var(--ground-1);
  }

  .row--locks {
    box-shadow: inset 0 0 12px rgba(212, 112, 122, 0.13);
  }

  .row__body {
    min-width: 0;
  }

  .row__from-line {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .row__from {
    font-family: var(--serif);
    font-size: 14px;
    font-weight: 500;
    color: var(--text-0);
  }

  .civic-tag {
    font-family: var(--mono);
    font-size: 7.5px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    padding: 1px 5px;
    border: 1px solid var(--ground-4);
    color: var(--text-3);
  }

  .row__subject {
    margin-top: 2px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-1);
    letter-spacing: -0.005em;
  }

  .row__subject--read {
    color: var(--text-2);
  }

  .row__preview {
    margin-top: 4px;
    font-family: var(--sans);
    font-size: 11.5px;
    color: var(--text-3);
    line-height: 1.45;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .row__right {
    text-align: right;
    white-space: nowrap;
  }

  .row__time {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.4px;
    color: var(--text-3);
  }

  .row__time--unread {
    color: var(--s-gold);
  }

  .row__dot {
    margin: 6px 0 0 auto;
    width: 7px;
    height: 7px;
    border-radius: 7px;
    background: var(--s-gold);
    box-shadow: 0 0 6px rgba(228, 184, 64, 0.6);
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
