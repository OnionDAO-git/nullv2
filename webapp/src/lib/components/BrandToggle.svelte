<script lang="ts">
  import type { Brand } from '$lib/theme';
  import { BRAND_LABELS } from '$lib/theme';

  let {
    activeBrand = $bindable<Brand>('null-city')
  }: {
    activeBrand: Brand;
  } = $props();

  const brands: Brand[] = ['onion-dao', 'null-city'];

  const navLinks = $derived<{ href: string; label: string }[]>(
    activeBrand === 'onion-dao'
      ? [
          { href: '/about', label: 'About' },
        ]
      : [
          { href: '/about', label: 'About' },
          { href: '/wiki', label: 'Wiki' },
        ]
  );

  let sponsorOpen = $state(false);

  function switchTo(brand: Brand) {
    if (brand === activeBrand) return;
    activeBrand = brand;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
</script>

<nav class="nav-bar">
  <div class="nav-group">
    {#each brands as brand}
      <button
        class="nav-btn"
        class:nav-btn--active={activeBrand === brand}
        onclick={() => switchTo(brand)}
      >
        {BRAND_LABELS[brand]}
      </button>
    {/each}
  </div>

  <div class="nav-group">
    {#each navLinks as link}
      <a href={link.href} class="nav-link">{link.label}</a>
    {/each}

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="dropdown"
      onmouseenter={() => { sponsorOpen = true; }}
      onmouseleave={() => { sponsorOpen = false; }}
    >
      <button
        class="nav-link dropdown__trigger"
        onclick={() => { sponsorOpen = !sponsorOpen; }}
      >
        Sponsors
      </button>
      {#if sponsorOpen}
        <div class="dropdown__menu">
          <a href="/sponsors" class="dropdown__item" onclick={() => { sponsorOpen = false; }}>Our Sponsors</a>
          <a href="/sponsor" class="dropdown__item" onclick={() => { sponsorOpen = false; }}>Sponsor Deck</a>
        </div>
      {/if}
    </div>

    <a href="/application" class="nav-link nav-link--login">Apply</a>
    <a href="/login" class="nav-link nav-link--login">Login</a>
  </div>
</nav>

<style>
  :global(:root) {
    --brand-toggle-height: 46px;
  }

  .nav-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--brand-toggle-height);
    background: var(--ground-1);
    border-bottom: 1px solid var(--ground-4);
    padding: 0 8px;
  }

  .nav-group {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .nav-btn,
  .nav-link {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    line-height: 1;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color 0.25s, background 0.25s;
    text-decoration: none;
  }

  .nav-btn:hover,
  .nav-link:hover {
    color: var(--text-1);
  }

  .nav-btn--active {
    color: var(--text-0);
    background: var(--ground-0);
    border-bottom: 2px solid var(--s-gold);
  }

  /* Dropdown */
  .dropdown {
    position: relative;
    height: 100%;
  }

  .dropdown__trigger {
    height: 100%;
  }

  .dropdown__menu {
    position: absolute;
    top: 100%;
    right: 0;
    min-width: 160px;
    background: var(--ground-1);
    border: 1px solid var(--ground-4);
    border-top: none;
    display: flex;
    flex-direction: column;
  }

  .dropdown__item {
    padding: 12px 16px;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-3);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }

  .dropdown__item:hover {
    color: var(--text-0);
    background: var(--ground-2);
  }

  .nav-link--login {
    color: var(--s-blue);
  }

  .nav-link--login:hover {
    color: var(--text-0);
  }

  @media (max-width: 520px) {
    :global(:root) {
      --brand-toggle-height: 37px;
    }

    .nav-btn,
    .nav-link {
      padding: 0 8px;
      font-size: 8px;
      letter-spacing: 1.5px;
    }
  }
</style>
