<script lang="ts">
  import { EMOTIONS, type EmotionId } from '$lib/emotions';

  let {
    size = 56,
    emotion = 'reverie',
    monogram = 'M',
    seed = 1,
  }: {
    size?: number;
    emotion?: EmotionId;
    monogram?: string;
    seed?: number;
  } = $props();

  function mulberry32(s: number): () => number {
    return () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  interface Cell {
    cx: number;
    cy: number;
    w: number;
    h: number;
    rot: number;
    color: string;
    opacity: number;
  }

  const cells = $derived.by(() => {
    const palette = EMOTIONS[emotion].palette;
    const r = mulberry32(seed * 9301);
    const out: Cell[] = [];
    let i = 0;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        const cx = ((x + 0.5) / 5) * 100 + (r() - 0.5) * 14;
        const cy = ((y + 0.5) / 5) * 100 + (r() - 0.5) * 14;
        const w = 18 + r() * 6;
        const h = 18 + r() * 6;
        const rot = (r() - 0.5) * 30;
        const depth = r() < 0.33 ? 'near' : r() < 0.5 ? 'deep' : 'middle';
        const opacity = depth === 'deep' ? 0.45 : depth === 'middle' ? 0.78 : 0.92;
        out.push({
          cx,
          cy,
          w,
          h,
          rot,
          color: palette[i % palette.length],
          opacity,
        });
        i++;
      }
    }
    return out;
  });

  const vignetteId = $derived(`vg-${seed}-${emotion}`);
  const monogramChar = $derived(((monogram || 'M').trim().charAt(0) || 'M').toUpperCase());
</script>

<div class="sg" style:width="{size}px" style:height="{size}px">
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="sg__mosaic">
    {#each cells as c, i (i)}
      <rect
        x={c.cx - c.w / 2}
        y={c.cy - c.h / 2}
        width={c.w}
        height={c.h}
        transform="rotate({c.rot} {c.cx} {c.cy})"
        fill={c.color}
        opacity={c.opacity}
      />
    {/each}
    <defs>
      <radialGradient id={vignetteId} cx="50%" cy="50%" r="65%">
        <stop offset="60%" stop-color="#000" stop-opacity="0" />
        <stop offset="100%" stop-color="#000" stop-opacity="0.7" />
      </radialGradient>
    </defs>
    <rect width="100" height="100" fill="url(#{vignetteId})" />
  </svg>

  <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="sg__leads">
    {#each [20, 40, 60, 80] as v (v)}
      <line x1={v} y1="0" x2={v} y2="100" stroke="var(--ground-0)" stroke-width="0.6" opacity="0.7" />
      <line x1="0" y1={v} x2="100" y2={v} stroke="var(--ground-0)" stroke-width="0.6" opacity="0.7" />
    {/each}
  </svg>

  <div class="sg__mono" style:font-size="{size * 0.46}px">{monogramChar}</div>
</div>

<style>
  .sg {
    position: relative;
    overflow: hidden;
    background: #050403;
    border: 1px solid var(--ground-4);
    flex-shrink: 0;
  }

  .sg__mosaic,
  .sg__leads {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .sg__mosaic rect {
    mix-blend-mode: screen;
  }

  .sg__leads {
    pointer-events: none;
  }

  .sg__mono {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--serif);
    font-weight: 900;
    color: var(--text-0);
    opacity: 0.12;
    letter-spacing: -0.04em;
    text-shadow: 0 0 12px rgba(237, 232, 224, 0.18);
    pointer-events: none;
  }
</style>
