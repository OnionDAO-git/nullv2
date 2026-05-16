<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    attribution = '',
    children
  }: {
    attribution?: string;
    children: Snippet;
  } = $props();
</script>

<div class="pull">
  <blockquote class="pull__t">
    {@render children()}
  </blockquote>
  {#if attribution}
    <div class="pull__a">{attribution}</div>
  {/if}
</div>

<style>
  .pull {
    padding: 100px 72px;
    text-align: center;
    max-width: 1080px;
    margin: 0 auto;
  }

  .pull__t {
    font-family: var(--serif);
    font-size: clamp(24px, 3.5vw, 38px);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.5px;
    color: var(--text-0);
    max-width: 720px;
    margin: 0 auto;
  }

  .pull__a {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--text-3);
    margin-top: 28px;
  }

  @media (max-width: 900px) {
    .pull {
      padding: 64px 24px;
    }
  }

  @media (max-width: 520px) {
    .pull {
      padding: 48px 16px;
    }
  }
</style>
