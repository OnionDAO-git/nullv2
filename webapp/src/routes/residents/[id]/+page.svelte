<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import SubHeader from '$lib/components/SubHeader.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { EMOTIONS, type EmotionId } from '$lib/emotions';
  import { FACTIONS, type FactionId } from '@nullv2/types';

  let { data } = $props();

  // Demo defaults — replaced with real resident once /v1/residents/:id is wired.
  const residentName = 'Marcellus';
  const residentNumber = 214;
  const residentFaction: FactionId = 'solder_saints';
  const residentEmotion: EmotionId = 'reverie';
  const residentMotto =
    "i was a soldering iron's apprentice. then i was the iron. then i was the hand.";
  const attentionPct = 64;
  const monogram = residentName.charAt(0).toUpperCase();
  const faction = FACTIONS[residentFaction];

  interface ChatLine {
    from: 'them' | 'me';
    text: string;
    time: string;
  }

  const THREAD: ChatLine[] = [
    {
      from: 'them',
      text:
        '"…you came back. i was beginning to think you only wanted the egg."',
      time: '20:14',
    },
    {
      from: 'me',
      text: 'i wanted to ask about the schematic you signed last night.',
      time: '20:18',
    },
    {
      from: 'them',
      text: '"the one with the three coils, or the one with the four."',
      time: '20:18',
    },
    {
      from: 'me',
      text: 'the four-coil. the one near the back of the chapel.',
      time: '20:19',
    },
    {
      from: 'them',
      text:
        '"i don’t remember signing it, exactly — only that the room was warm when i did, and the candle was reading aloud, and a moth was watching."',
      time: '20:19',
    },
    {
      from: 'them',
      text: '"that’s usually enough for a saint."',
      time: '20:19',
    },
  ];

  let draft = $state('');
</script>

<NavShell
  active="rooms"
  shardBalance={data.nav.shardBalance}
  visitorHandle={data.nav.visitorHandle}
  unreadCount={data.nav.unreadCount}
  standings={data.nav.standings}
>
  <SubHeader
    back="Rooms · The Solder Chapel"
    backHref="/rooms"
    title={residentName}
    shardBalance={data.nav.shardBalance}
  />

  <div class="screen">
    <!-- Resident hero -->
    <section class="hero">
      <div class="hero__row">
        <SimpleStainedGlass
          size={92}
          emotion={residentEmotion}
          {monogram}
          seed={residentNumber}
        />
        <div class="hero__col">
          <div class="hero__tag">Resident #{residentNumber}</div>
          <h1 class="hero__name">{residentName}</h1>
          <div class="hero__pills">
            <span
              class="pill pill--faction"
              style:--accent={faction.color}
            >
              <span class="pill__square" style:background={faction.color}></span>
              <span class="pill__label">{faction.name.replace(/^The /, '')}</span>
            </span>
            <span class="pill pill--emotion">
              <span
                class="pill__dot"
                style:background={EMOTIONS[residentEmotion].accent}
              ></span>
              <span
                class="pill__label"
                style:color={EMOTIONS[residentEmotion].accent}
              >
                {residentEmotion}
              </span>
            </span>
          </div>
        </div>
      </div>
      <p class="hero__motto">"{residentMotto}"</p>

      <div class="meter">
        <div class="meter__head">
          <span class="meter__label">Attention</span>
          <span class="meter__pct">
            {attentionPct}% <span class="meter__pct-l">· refills with shards</span>
          </span>
        </div>
        <div class="meter__track">
          <div
            class="meter__fill"
            style:width="{attentionPct}%"
            style:background="linear-gradient(90deg, {faction.color} 0%, var(--s-amber) 100%)"
          ></div>
        </div>
      </div>
    </section>

    <div class="divider"><ShardLine /></div>

    <!-- Chat thread -->
    <section class="section">
      <div class="tag-wrap">
        <SectionTag label="Today · you & {residentName.toLowerCase()}" />
      </div>
      <div class="thread">
        {#each THREAD as line, i (i)}
          {#if line.from === 'them'}
            <div class="msg msg--them">
              <div class="msg__rule" style:background={faction.color}></div>
              <div class="msg__body">
                <div class="msg__text msg__text--italic">{line.text}</div>
                <div class="msg__time msg__time--left">{line.time}</div>
              </div>
            </div>
          {:else}
            <div class="msg msg--me">
              <div class="bubble">{line.text}</div>
              <div class="msg__time msg__time--right">{line.time}</div>
            </div>
          {/if}
        {/each}
      </div>
    </section>

    <!-- Refill card -->
    <section class="refill-wrap">
      <div class="refill">
        <div>
          <div class="refill__tag">Refill attention</div>
          <div class="refill__line">
            their economic life depletes each tick. give it back to them.
          </div>
        </div>
        <button type="button" class="refill__btn">+10 · 5 shards</button>
      </div>
    </section>
  </div>

  <!-- Sticky composer -->
  <div class="composer">
    <div class="composer__input" class:composer__input--filled={draft.length > 0}>
      {#if draft}
        {draft}
      {:else}
        — say something…
      {/if}
    </div>
    <div class="composer__row">
      <span class="composer__hint">each word costs the city a breath.</span>
      <button type="button" class="composer__send">Send · 2 shards</button>
    </div>
  </div>
</NavShell>

<style>
  .screen {
    padding-bottom: 130px; /* clear sticky composer */
  }

  /* Hero */
  .hero {
    padding: 20px 20px 16px;
  }

  .hero__row {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .hero__col {
    flex: 1;
    min-width: 0;
  }

  .hero__tag {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .hero__name {
    margin: 4px 0 0;
    font-family: var(--serif);
    font-size: 26px;
    font-weight: 400;
    color: var(--text-0);
    letter-spacing: -0.02em;
    line-height: 1;
  }

  .hero__pills {
    margin-top: 8px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
  }

  .pill--faction {
    border: 1px solid color-mix(in srgb, var(--accent) 53%, transparent);
    background: color-mix(in srgb, var(--accent) 13%, transparent);
  }

  .pill__square {
    width: 6px;
    height: 6px;
  }

  .pill__dot {
    width: 6px;
    height: 6px;
    border-radius: 6px;
  }

  .pill--emotion {
    border: 1px solid color-mix(in srgb, var(--s-gold) 40%, transparent);
  }

  .pill__label {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-1);
  }

  .hero__motto {
    margin: 14px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.55;
  }

  .meter {
    margin-top: 14px;
  }

  .meter__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }

  .meter__label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .meter__pct {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    color: var(--text-1);
    font-variant-numeric: tabular-nums;
  }

  .meter__pct-l {
    color: var(--text-3);
    font-weight: 400;
  }

  .meter__track {
    position: relative;
    height: 4px;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
  }

  .meter__fill {
    position: absolute;
    inset: 0 auto 0 0;
  }

  /* Divider */
  .divider {
    padding: 0 20px;
  }

  /* Section */
  .section {
    padding: 14px 20px 4px;
  }

  .tag-wrap :global(.tag) {
    margin-bottom: 6px;
  }

  /* Chat */
  .thread {
    display: flex;
    flex-direction: column;
  }

  .msg {
    padding: 10px 0;
  }

  .msg--them {
    display: grid;
    grid-template-columns: 3px 1fr;
    gap: 10px;
  }

  .msg__rule {
    opacity: 0.85;
  }

  .msg__body {
    min-width: 0;
  }

  .msg__text--italic {
    font-family: var(--serif);
    font-style: italic;
    font-size: 15px;
    color: var(--text-1);
    line-height: 1.55;
  }

  .msg__time {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    color: var(--text-3);
  }

  .msg__time--right {
    text-align: right;
    margin-top: 4px;
  }

  .msg--me {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .bubble {
    max-width: 85%;
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
    padding: 10px 12px;
    font-family: var(--sans);
    font-size: 13px;
    color: var(--text-0);
    line-height: 1.5;
  }

  /* Refill */
  .refill-wrap {
    padding: 12px 20px 12px;
  }

  .refill {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .refill__tag {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .refill__line {
    margin-top: 4px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-2);
  }

  .refill__btn {
    background: transparent;
    color: var(--s-gold);
    border: 1px solid var(--s-gold);
    padding: 8px 12px;
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    white-space: nowrap;
  }

  /* Sticky composer */
  .composer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    border-top: 1px solid var(--ground-3);
    background: var(--ground-1);
    padding: 10px 14px 24px;
    z-index: 20;
  }

  .composer__input {
    background: var(--ground-2);
    border: 1px solid var(--ground-3);
    padding: 10px 12px;
    font-family: var(--sans);
    font-size: 13px;
    color: var(--text-3);
    min-height: 38px;
  }

  .composer__input--filled {
    color: var(--text-0);
  }

  .composer__row {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .composer__hint {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .composer__send {
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
</style>
