<script lang="ts">
  import { closeMenu } from '$lib/stores/nav';
  import ShardChip from './ShardChip.svelte';
  import ShardLine from './ShardLine.svelte';
  import { FACTIONS, FACTION_IDS, type StandingTier } from '@nullv2/types';

  type NavId =
    | 'dashboard'
    | 'wall'
    | 'rooms'
    | 'inbox'
    | 'redeem'
    | 'library'
    | 'embassy'
    | 'public';

  interface StandingRow {
    factionId: string;
    tier: StandingTier;
  }

  let {
    active,
    shardBalance = 0,
    visitorHandle = 'visitor',
    unreadCount = 0,
    standings = [],
  }: {
    active: NavId;
    shardBalance?: number;
    visitorHandle?: string;
    unreadCount?: number;
    standings?: StandingRow[];
  } = $props();

  interface NavItem {
    id: NavId;
    label: string;
    glyph: string;
    href: string;
    badge?: number;
    muted?: boolean;
  }

  const PRIMARY = $derived<NavItem[]>([
    { id: 'dashboard', label: 'Home', glyph: 'H', href: '/dashboard' },
    { id: 'wall', label: 'The Wall', glyph: 'W', href: '/wall' },
    { id: 'rooms', label: 'Rooms', glyph: 'R', href: '/rooms' },
    {
      id: 'inbox',
      label: 'Inbox',
      glyph: 'I',
      href: '/inbox',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'redeem', label: 'Redeem', glyph: 'S', href: '/dashboard/achievements' },
  ]);

  const CITY: NavItem[] = [
    { id: 'library', label: 'Library of Souls', glyph: '†', href: '/library' },
    { id: 'embassy', label: 'The Embassy', glyph: '❖', href: '/embassy' },
    { id: 'public', label: 'Public Wall View', glyph: '▣', href: '/wall', muted: true },
  ];

  const TIER_LABEL: Record<StandingTier, string> = {
    none: 'stranger',
    acquaintance: 'acquaintance',
    ally: 'ally',
    officer: 'officer',
  };

  function tierFor(factionId: string): string {
    const row = standings.find((s) => s.factionId === factionId);
    return row ? TIER_LABEL[row.tier] : 'stranger';
  }
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Navigation menu">
  <aside class="drawer">
    <!-- Header strip -->
    <div class="drawer__head">
      <div class="head-id">
        <div class="brand">
          <span class="brand__mark" aria-hidden="true"></span>
          <span class="brand__word">Null City</span>
        </div>
        <div class="visitor-tag">Visitor</div>
        <div class="visitor-handle">{visitorHandle}</div>
      </div>
      <button type="button" class="close" onclick={closeMenu} aria-label="Close menu">✕</button>
    </div>

    <!-- Scrollable nav region -->
    <div class="drawer__main">
      <div class="section-tag">Navigate</div>
      {#each PRIMARY as item (item.id)}
        <a
          class="nav-row"
          class:nav-row--active={item.id === active}
          href={item.href}
          onclick={closeMenu}
        >
          <span class="glyph">{item.glyph}</span>
          <span class="label">{item.label}</span>
          {#if item.badge}
            <span class="badge">{item.badge}</span>
          {/if}
        </a>
      {/each}

      <div class="section-tag section-tag--later">The city</div>
      {#each CITY as item (item.id)}
        <a
          class="nav-row"
          class:nav-row--active={item.id === active}
          class:nav-row--muted={item.muted}
          href={item.href}
          onclick={closeMenu}
        >
          <span class="glyph">{item.glyph}</span>
          <span class="label">{item.label}</span>
        </a>
      {/each}

      <div class="line-gutter">
        <ShardLine />
      </div>

      <div class="section-tag section-tag--later">Your standing</div>
      <div class="standing">
        {#each FACTION_IDS as fid (fid)}
          {@const f = FACTIONS[fid]}
          <div class="standing-row">
            <span
              class="standing-swatch"
              class:standing-swatch--locks={fid === 'locksmiths'}
              style:background={f.color}
            ></span>
            <span class="standing-name">{f.name.replace(/^The /, '')}</span>
            <span class="standing-tier">{tierFor(fid)}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Footer -->
    <div class="drawer__foot">
      <ShardChip count={shardBalance} />
      <a class="sign-out" href="/logout">Sign out</a>
    </div>
  </aside>

  <button
    type="button"
    class="scrim"
    aria-label="Close menu"
    onclick={closeMenu}
  ></button>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .drawer {
    position: relative;
    width: 290px;
    max-width: 85%;
    height: 100%;
    background: var(--ground-1);
    border-right: 1px solid var(--ground-3);
    display: flex;
    flex-direction: column;
    box-shadow: 6px 0 24px rgba(0, 0, 0, 0.6);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .drawer__head {
    padding: 18px 18px 14px;
    border-bottom: 1px solid var(--ground-3);
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .head-id {
    min-width: 0;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .brand__mark {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    background: linear-gradient(
      135deg,
      var(--s-gold) 0%,
      var(--s-rose) 50%,
      var(--s-blue) 100%
    );
    clip-path: polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%);
  }

  .brand__word {
    font-family: var(--serif);
    font-size: 17px;
    font-weight: 500;
    color: var(--text-0);
    letter-spacing: -0.01em;
  }

  .visitor-tag {
    margin-top: 10px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.8px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .visitor-handle {
    margin-top: 2px;
    font-family: var(--serif);
    font-style: italic;
    font-size: 14px;
    color: var(--text-1);
  }

  .close {
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: 1px solid var(--ground-4);
    color: var(--text-2);
    cursor: pointer;
    font-family: var(--serif);
    font-size: 16px;
    line-height: 1;
    flex-shrink: 0;
  }

  .drawer__main {
    flex: 1;
    overflow-y: auto;
  }

  .section-tag {
    padding: 14px 18px 8px;
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .section-tag--later {
    padding-top: 18px;
  }

  .nav-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 11px 18px;
    border-left: 3px solid transparent;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s, border-left-color 0.2s;
  }

  .nav-row--active {
    background: var(--ground-2);
    border-left-color: var(--s-gold);
  }

  .glyph {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border: 1px solid var(--ground-4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-2);
  }

  .nav-row--active .glyph {
    border-color: var(--s-gold);
    color: var(--s-gold);
  }

  .nav-row--muted .glyph {
    color: var(--text-3);
  }

  .label {
    flex: 1;
    font-family: var(--serif);
    font-size: 15px;
    color: var(--text-1);
    letter-spacing: -0.005em;
  }

  .nav-row--active .label {
    color: var(--text-0);
  }

  .nav-row--muted .label {
    color: var(--text-3);
  }

  .badge {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 700;
    color: var(--ground-0);
    background: var(--s-gold);
    padding: 2px 7px;
    min-width: 18px;
    text-align: center;
  }

  .line-gutter {
    padding: 18px 18px 0;
  }

  .standing {
    padding: 0 14px 14px;
  }

  .standing-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 4px;
  }

  .standing-swatch {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }

  .standing-swatch--locks {
    box-shadow: 0 0 4px var(--s-rose);
  }

  .standing-name {
    flex: 1;
    font-family: var(--serif);
    font-size: 12px;
    color: var(--text-1);
  }

  .standing-tier {
    font-family: var(--mono);
    font-size: 8.5px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .drawer__foot {
    padding: 12px 16px 16px;
    border-top: 1px solid var(--ground-3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }

  .sign-out {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--text-3);
    text-decoration: none;
    border-bottom: 1px solid var(--ground-4);
    padding-bottom: 1px;
  }

  .scrim {
    flex: 1;
    height: 100%;
    background: rgba(5, 4, 3, 0.72);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    cursor: pointer;
    border: 0;
    padding: 0;
    appearance: none;
  }
</style>
