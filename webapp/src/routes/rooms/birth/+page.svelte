<script lang="ts">
  import NavShell from '$lib/components/NavShell.svelte';
  import SubHeader from '$lib/components/SubHeader.svelte';
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SimpleStainedGlass from '$lib/components/SimpleStainedGlass.svelte';
  import { EMOTIONS, EMOTION_IDS, type EmotionId } from '$lib/emotions';
  import {
    FACTIONS,
    FACTION_IDS,
    type FactionId,
    BIRTH_QUICKENING,
    BIRTH_INSCRIPTION,
    BIRTH_TITHE,
    BIRTH_TOTAL_COST,
  } from '@nullv2/types';
  import { goto } from '$app/navigation';

  let { data } = $props();

  let name = $state('');
  let faction = $state<FactionId>('solder_saints');
  let emotion = $state<EmotionId>('reverie');
  let motto = $state('');
  // SPARK soul fields — optional, opened on demand.
  let advancedOpen = $state(false);
  let goals = $state('');
  let alignment = $state('');
  let quirks = $state('');
  let aesthetic = $state('');
  let submitting = $state(false);
  let errorMsg = $state<string | null>(null);

  // Avatar upload state.
  const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
  let avatarFile = $state<File | null>(null);
  let avatarPreviewUrl = $state<string | null>(null);
  let avatarUploadedUrl = $state<string | null>(null);
  let avatarUploading = $state(false);
  let avatarError = $state<string | null>(null);
  let avatarInputEl: HTMLInputElement | null = null;

  const COSTS = [
    { label: 'Quickening', cost: BIRTH_QUICKENING },
    { label: 'Soul file inscription', cost: BIRTH_INSCRIPTION },
    { label: 'Hatchery tithe', cost: BIRTH_TITHE },
  ];

  let monogram = $derived(((name || 'a').trim().charAt(0) || 'A').toUpperCase());
  let balanceAfter = $derived(Math.max(0, data.nav.shardBalance - BIRTH_TOTAL_COST));
  let factionPreset = $derived(FACTIONS[faction]);
  let onCooldown = $derived(
    !!data.cooldownUntil && new Date(data.cooldownUntil).getTime() > Date.now(),
  );
  let canSubmit = $derived(
    !submitting &&
      !onCooldown &&
      name.trim().length > 0 &&
      motto.trim().length > 0 &&
      data.nav.shardBalance >= BIRTH_TOTAL_COST,
  );

  function cooldownLabel(): string {
    if (!data.cooldownUntil) return '';
    const ms = new Date(data.cooldownUntil).getTime() - Date.now();
    if (ms <= 0) return '';
    const hrs = Math.floor(ms / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    return `${hrs}h ${mins}m`;
  }

  function clearAvatar() {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    avatarFile = null;
    avatarPreviewUrl = null;
    avatarUploadedUrl = null;
    avatarError = null;
    if (avatarInputEl) avatarInputEl.value = '';
  }

  async function onAvatarChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    avatarInputEl = input;
    const file = input.files?.[0] ?? null;
    if (!file) {
      clearAvatar();
      return;
    }
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      avatarError = 'image must be jpeg, png, or webp.';
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      avatarError = 'image must be under 10 MB.';
      return;
    }
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    avatarFile = file;
    avatarPreviewUrl = URL.createObjectURL(file);
    avatarUploadedUrl = null;
    avatarError = null;
  }

  async function uploadAvatarIfNeeded(): Promise<string | null> {
    if (!avatarFile) return null;
    if (avatarUploadedUrl) return avatarUploadedUrl;
    avatarUploading = true;
    avatarError = null;
    try {
      const presignRes = await fetch('/v1/uploads/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'resident_avatar',
          contentType: avatarFile.type,
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}) as { error?: string });
        throw new Error((body as { error?: string }).error ?? `presign_${presignRes.status}`);
      }
      const presign = (await presignRes.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'content-type': avatarFile.type },
        body: avatarFile,
      });
      if (!putRes.ok) {
        throw new Error(`upload failed (${putRes.status})`);
      }
      avatarUploadedUrl = presign.publicUrl;
      return avatarUploadedUrl;
    } catch (err) {
      avatarError = err instanceof Error ? err.message : 'upload failed';
      throw err;
    } finally {
      avatarUploading = false;
    }
  }

  async function commit() {
    if (!canSubmit) return;
    errorMsg = null;
    submitting = true;
    try {
      let avatarUrl: string | null = null;
      try {
        avatarUrl = await uploadAvatarIfNeeded();
      } catch {
        submitting = false;
        return;
      }
      const goalsT = goals.trim();
      const alignmentT = alignment.trim();
      const quirksT = quirks.trim();
      const aestheticT = aesthetic.trim();
      const res = await fetch(`/v1/rooms/birth`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          faction,
          emotion,
          motto: motto.trim(),
          ...(goalsT ? { goals: goalsT } : {}),
          ...(alignmentT ? { alignment: alignmentT } : {}),
          ...(quirksT ? { quirks: quirksT } : {}),
          ...(aestheticT ? { aesthetic: aestheticT } : {}),
          ...(avatarUrl ? { avatarUrl } : {}),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string; message?: string });
        const code = (body as { error?: string }).error ?? `http_${res.status}`;
        const msg = (body as { message?: string }).message;
        errorMsg = msg ?? code;
        submitting = false;
        return;
      }
      const body = (await res.json()) as {
        resident: { id: string };
        newShardBalance: number;
      };
      await goto(`/residents/${body.resident.id}`);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'birth failed';
      submitting = false;
    }
  }
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
        {#if avatarPreviewUrl}
          <img class="preview__avatar" src={avatarPreviewUrl} alt="resident likeness preview" />
        {:else}
          <SimpleStainedGlass size={120} {emotion} {monogram} seed={3} />
        {/if}
        <div class="preview__col">
          <div class="preview__tag">Soul under glass</div>
          <div class="preview__name">{name || 'unnamed'}</div>
          <div class="preview__emotion" style:--accent={EMOTIONS[emotion].accent}>
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

    <!-- Likeness · profile picture -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Likeness · optional" />
      </div>
      <div class="field">
        <div class="label">Profile picture</div>
        <div class="hint">
          jpeg, png, or webp · under 10 MB. omit to keep the stained-glass monogram.
        </div>
        <div class="avatar-row">
          {#if avatarPreviewUrl}
            <img class="avatar-thumb" src={avatarPreviewUrl} alt="chosen likeness" />
          {:else}
            <span class="avatar-thumb avatar-thumb--empty">·</span>
          {/if}
          <div class="avatar-controls">
            <label class="avatar-btn">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onchange={onAvatarChange}
                class="avatar-input"
              />
              {avatarPreviewUrl ? 'Replace' : 'Choose image'}
            </label>
            {#if avatarPreviewUrl}
              <button type="button" class="avatar-clear" onclick={clearAvatar}>Remove</button>
            {/if}
          </div>
        </div>
        {#if avatarUploading}
          <div class="avatar-status">uploading…</div>
        {/if}
        {#if avatarError}
          <div class="avatar-status avatar-status--error">{avatarError}</div>
        {/if}
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
            maxlength="60"
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
              <SimpleStainedGlass size={56} emotion={eid} {monogram} seed={i + 7} />
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
            maxlength="400"
          ></textarea>
        </div>
      </div>
    </section>

    <!-- Advanced soul fields · optional -->
    <section class="section">
      <div class="tag-wrap tag-wrap--tight">
        <SectionTag label="Advanced soul fields · optional" />
      </div>
      <button
        type="button"
        class="spark-toggle"
        onclick={() => (advancedOpen = !advancedOpen)}
      >
        {#if !advancedOpen}
          <span class="spark-toggle__line">
            their goals, alignment, quirks, aesthetic &mdash; the parts that won't fit in a motto.
            open if you have more to say.
          </span>
          <span class="spark-toggle__toggle">Open ↘</span>
        {:else}
          <span class="spark-toggle__line">
            the SPARK fields. leave any blank and the resident will improvise.
          </span>
          <span class="spark-toggle__toggle">Close ↗</span>
        {/if}
      </button>

      {#if advancedOpen}
        <div class="field">
          <div class="label">Goals</div>
          <div class="hint">what they want, even when they can't say why.</div>
          <div class="input">
            <textarea
              class="text-area"
              rows="3"
              bind:value={goals}
              placeholder="what drives them through the city…"
              maxlength="400"
            ></textarea>
          </div>
        </div>

        <div class="field">
          <div class="label">Moral alignment</div>
          <div class="hint">their ethical grain. can be dark; can be flexible.</div>
          <div class="input">
            <input
              class="text-input"
              type="text"
              bind:value={alignment}
              placeholder="chaotic-tender, lawful-curious, …"
              maxlength="200"
            />
          </div>
        </div>

        <div class="field">
          <div class="label">Quirks</div>
          <div class="hint">a verbal tic, a specific fear, a way of seeing.</div>
          <div class="input">
            <textarea
              class="text-area"
              rows="3"
              bind:value={quirks}
              placeholder="what makes them recognizable in three sentences…"
              maxlength="400"
            ></textarea>
          </div>
        </div>

        <div class="field">
          <div class="label">Aesthetic register</div>
          <div class="hint">watercolor minimalist? neon brutalist? soft and organic?</div>
          <div class="input">
            <input
              class="text-input"
              type="text"
              bind:value={aesthetic}
              placeholder="the visual / verbal register they carry…"
              maxlength="200"
            />
          </div>
        </div>
      {/if}
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
              {BIRTH_TOTAL_COST} <span class="cost-row__unit">shards</span>
            </span>
          </div>
        </div>
        <div class="cost-foot">Balance after · {balanceAfter} shards</div>
      </div>
    </section>

    <!-- Commit -->
    <section class="commit-wrap">
      {#if onCooldown}
        <div class="cooldown">
          you have already birthed a resident today. next eligible in {cooldownLabel()}.
        </div>
      {/if}
      {#if errorMsg}
        <div class="error">{errorMsg}</div>
      {/if}
      <button
        type="button"
        class="commit"
        onclick={commit}
        disabled={!canSubmit}
      >
        {submitting ? 'committing…' : 'Birth → commit to library'}
      </button>
      <div class="commit__sub">
        <em>once committed, the soul will draw a first breath within the hour.</em>
      </div>
    </section>

    <!-- Prior births -->
    {#if data.priorBirths.length > 0}
      <section class="section">
        <div class="tag-wrap tag-wrap--tight">
          <SectionTag label="Your prior births" />
        </div>
        <div class="prior">
          {#each data.priorBirths as p (p.id)}
            {@const f = FACTIONS[p.faction as FactionId]}
            <a href={`/residents/${p.id}`} class="prior-row" style:--accent={f.color}>
              <SimpleStainedGlass
                size={42}
                emotion={p.emotion as EmotionId}
                monogram={p.name.charAt(0).toUpperCase() || '?'}
                seed={p.id.charCodeAt(0) * 13}
              />
              <div class="prior-row__body">
                <div class="prior-row__name">{p.name}</div>
                <div class="prior-row__meta">
                  {p.status} · {p.emotion} · {f.name.replace(/^The /, '')}
                </div>
              </div>
            </a>
          {/each}
        </div>
      </section>
    {/if}

    <section class="breath">
      <ShardLine breath />
    </section>
  </div>
</NavShell>

<style>
  .screen { padding-bottom: 32px; }

  .hero { position: relative; padding: 24px 20px 14px; }
  .hero__skyline {
    position: absolute; left: 0; right: 0; bottom: 8px;
    opacity: 0.14; pointer-events: none;
  }
  .hero__inner { position: relative; }
  .tag-wrap :global(.tag) { margin-bottom: 16px; }
  .tag-wrap--tight :global(.tag) { margin-bottom: 12px; }
  .hero__title {
    font-family: var(--serif);
    font-weight: 300;
    font-size: 36px;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }
  .dim { color: var(--text-2); }
  .hero__lede {
    margin: 12px 0 0;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.55;
    max-width: 290px;
  }

  .section { padding: 8px 20px 0; }

  .preview {
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    padding: 16px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .preview__avatar {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border: 1px solid var(--ground-3);
    flex-shrink: 0;
  }
  .preview__col { min-width: 0; flex: 1; }

  .avatar-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .avatar-thumb {
    width: 64px;
    height: 64px;
    object-fit: cover;
    border: 1px solid var(--ground-3);
    background: var(--ground-1);
    flex-shrink: 0;
  }
  .avatar-thumb--empty {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
    font-family: var(--mono);
    font-size: 18px;
  }
  .avatar-controls {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .avatar-btn {
    position: relative;
    display: inline-block;
    padding: 8px 14px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-1);
    cursor: pointer;
  }
  .avatar-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .avatar-clear {
    background: transparent;
    border: 1px solid var(--ground-3);
    padding: 6px 10px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
    cursor: pointer;
  }
  .avatar-status {
    margin-top: 8px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }
  .avatar-status--error { color: var(--s-rose); }
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
  .preview__dot { width: 6px; height: 6px; border-radius: 6px; }
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

  .field { margin-top: 18px; }
  .field:first-of-type { margin-top: 0; }
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
  .text-input::placeholder { color: var(--text-3); }
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
  .text-area::placeholder { color: var(--text-3); }

  .spark-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    cursor: pointer;
    text-align: left;
    color: inherit;
  }
  .spark-toggle__line {
    flex: 1;
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-2);
    line-height: 1.5;
  }
  .spark-toggle__toggle {
    flex-shrink: 0;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--s-gold);
  }

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
  .emotion-tile--on { border-color: var(--s-gold); }
  .emotion-tile__label {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-2);
  }
  .emotion-tile__label--on { color: var(--s-gold); }

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
  .cost-row__unit { color: var(--text-3); font-weight: 400; font-size: 9px; }
  .cost-total-wrap { margin-top: 6px; padding-top: 10px; border-top: 1px solid var(--ground-3); }
  .cost-row--total { border-bottom: none; padding: 0; }
  .cost-row__label--total { color: var(--text-1); }
  .cost-row__value--total { color: var(--s-gold); font-size: 16px; }
  .cost-foot {
    margin-top: 6px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .commit-wrap { padding: 18px 20px 8px; }
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
  .commit:disabled {
    background: var(--ground-3);
    color: var(--text-3);
    cursor: not-allowed;
  }
  .commit__sub {
    margin-top: 10px;
    text-align: center;
    font-family: var(--serif);
    font-size: 11px;
    color: var(--text-3);
  }
  .cooldown {
    margin-bottom: 10px;
    padding: 10px 12px;
    border: 1px solid var(--ground-3);
    background: var(--ground-1);
    font-family: var(--serif);
    font-style: italic;
    font-size: 12px;
    color: var(--text-2);
  }
  .error {
    margin-bottom: 10px;
    padding: 10px 12px;
    border: 1px solid var(--s-rose);
    background: color-mix(in srgb, var(--s-rose) 12%, transparent);
    color: var(--s-rose);
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .prior { display: flex; flex-direction: column; gap: 8px; }
  .prior-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    background: var(--ground-1);
    border: 1px solid var(--ground-3);
    border-left: 3px solid var(--accent);
    text-decoration: none;
    color: inherit;
  }
  .prior-row__body { flex: 1; min-width: 0; }
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

  .breath { padding: 12px 20px 24px; }
</style>
