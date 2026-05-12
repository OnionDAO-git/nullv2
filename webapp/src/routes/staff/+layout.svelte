<script lang="ts">
  import { page } from '$app/state';

  let { data, children } = $props();

  const navItems = [
    { href: '/staff', label: 'Workshops' },
    { href: '/staff/print-jobs', label: 'Print Queue' },
  ];

  let current = $derived(page.url.pathname);
</script>

<header>
  <strong>Null City</strong>
  <span class="badge">STAFF</span>
  <nav>
    {#each navItems as item (item.href)}
      <a href={item.href} class:active={current === item.href}>{item.label}</a>
    {/each}
  </nav>
  <span class="who">
    {data.visitor.user.name ?? data.visitor.user.email}
  </span>
  <a class="logout" href="https://oniondao.dev/account">Log out</a>
</header>

{@render children?.()}

<style>
  header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    border-bottom: 1px solid #1f1f1f;
    background: #0d0d0d;
  }
  strong {
    letter-spacing: -0.01em;
  }
  .badge {
    font-size: 0.7rem;
    letter-spacing: 0.15em;
    padding: 0.15rem 0.5rem;
    border: 1px solid #e6b800;
    color: #e6b800;
    border-radius: 2px;
  }
  nav {
    display: flex;
    gap: 0.25rem;
    margin-left: 1rem;
  }
  nav a {
    color: #999;
    text-decoration: none;
    padding: 0.35rem 0.75rem;
    border: 1px solid transparent;
    font-size: 0.9rem;
  }
  nav a:hover {
    color: #e5e5e5;
  }
  nav a.active {
    color: #e5e5e5;
    border-color: #2a2a2a;
    background: #161616;
  }
  .who {
    margin-left: auto;
    color: #888;
    font-size: 0.85rem;
  }
  .logout {
    color: #e6b800;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .logout:hover {
    text-decoration: underline;
  }
</style>
