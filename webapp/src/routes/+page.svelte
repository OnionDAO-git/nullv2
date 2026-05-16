<script lang="ts">
  import SkylineSvg from '$lib/components/SkylineSvg.svelte';
  import ShardLine from '$lib/components/ShardLine.svelte';
  import SectionTag from '$lib/components/SectionTag.svelte';
</script>

<section class="gate">
  <SkylineSvg variant="dark" orientation="landscape" />

  <div class="copy">
    <SectionTag label="Embassy · Chicago" />
    <h1>Null City</h1>
    <p class="lede">
      You are not currently a credentialed guest at the embassy.
    </p>
    <p>
      Sign in at
      <a href="https://oniondao.dev/login">oniondao.dev</a>
      and return here. Your badge will be issued on first visit.
    </p>
  </div>

  <ShardLine breath />
</section>

<style>
  .gate {
    max-width: 720px;
    margin: 0 auto;
    padding: 96px 32px 64px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  .copy {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  h1 {
    font-family: var(--serif);
    font-size: clamp(48px, 9vw, 96px);
    font-weight: 300;
    line-height: 0.95;
    letter-spacing: -0.03em;
    color: var(--text-0);
    margin: 0;
  }

  .lede {
    font-family: var(--serif);
    font-size: clamp(18px, 2.6vw, 22px);
    font-weight: 300;
    color: var(--text-1);
    margin: 0;
  }

  p {
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.7;
    color: var(--text-2);
    margin: 0;
  }

  a {
    color: var(--s-gold);
    text-decoration: none;
    border-bottom: 1px solid rgba(228, 184, 64, 0.35);
    transition: border-color 0.2s;
  }

  a:hover {
    border-bottom-color: var(--s-gold);
  }
</style>
