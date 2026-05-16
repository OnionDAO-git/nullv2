<script lang="ts">
  import { onMount } from 'svelte';

  let status = $state('reading session…');

  onMount(() => {
    const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
    if (!isLocal) {
      status = 'this route only works on localhost';
      return;
    }

    const hash = location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get('session');

    if (!token) {
      status = 'no session token in URL fragment';
      return;
    }

    document.cookie = `session=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    status = 'logged in — redirecting…';
    history.replaceState(null, '', '/dev-login');
    setTimeout(() => location.replace('/'), 200);
  });
</script>

<section class="wrap">
  <h1>dev-login</h1>
  <p>{status}</p>
</section>

<style>
  .wrap {
    max-width: 480px;
    margin: 0 auto;
    padding: 96px 32px;
    font-family: var(--sans);
    color: var(--text-1);
  }
  h1 {
    font-family: var(--serif);
    font-weight: 300;
    margin: 0 0 16px;
  }
</style>
