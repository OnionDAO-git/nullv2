<script lang="ts">
  import { page } from '$app/state';
  import { afterNavigate } from '$app/navigation';
  import Hamburger from '$lib/components/Hamburger.svelte';
  import SideMenu from '$lib/components/SideMenu.svelte';
  import { menuOpen, closeMenu } from '$lib/stores/nav';

  let { data, children } = $props();

  const navItems = [
    { href: '/staff', label: 'Workshops' },
    { href: '/staff/print-jobs', label: 'Print Queue' },
    { href: '/staff/residents', label: 'Residents' },
  ];

  let current = $derived(page.url.pathname);
  let nav = $derived(page.data?.nav);

  afterNavigate(() => closeMenu());
</script>

<header class="nav">
  <div class="nav__left">
    <Hamburger />
    <a href="/staff" class="wordmark">Null City</a>
    <span class="badge">Staff</span>
    <nav class="links">
      {#each navItems as item (item.href)}
        <a href={item.href} class:active={current === item.href}>{item.label}</a>
      {/each}
    </nav>
  </div>
  <div class="nav__right">
    <span class="who">{data.visitor.user.name ?? data.visitor.user.email}</span>
    <a class="logout" href="https://oniondao.dev/account">Log out</a>
  </div>
</header>

{@render children?.()}

{#if $menuOpen}
  <SideMenu
    active={null}
    shardBalance={nav?.shardBalance ?? 0}
    visitorHandle={nav?.visitorHandle ?? data.visitor.user.name ?? 'staff'}
    unreadCount={nav?.unreadCount ?? 0}
    standings={nav?.standings ?? []}
  />
{/if}

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 50;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--ground-1);
    border-bottom: 1px solid var(--ground-4);
    padding: 0 8px;
  }

  .nav__left,
  .nav__right {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .nav__left :global(.hamburger) {
    margin-left: 8px;
  }

  .wordmark {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-family: var(--serif);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.2px;
    color: var(--text-0);
    text-decoration: none;
  }

  .badge {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--s-gold);
    padding: 3px 8px;
    border: 1px solid rgba(228, 184, 64, 0.45);
  }

  .links {
    display: flex;
    height: 100%;
    margin-left: 12px;
  }

  .links a {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
    text-decoration: none;
    transition: color 0.2s;
  }

  .links a:hover {
    color: var(--text-0);
  }

  .links a.active {
    color: var(--text-0);
    background: var(--ground-2);
  }

  .who {
    font-family: var(--sans);
    font-size: 12px;
    color: var(--text-2);
    padding: 0 12px;
  }

  .logout {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 16px;
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
    text-decoration: none;
    border-left: 1px solid var(--ground-4);
    transition: color 0.2s;
  }

  .logout:hover {
    color: var(--s-rose);
  }
</style>
