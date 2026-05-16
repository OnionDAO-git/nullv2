<script lang="ts">
  import { FACTIONS, type FactionId } from '@nullv2/types';

  interface ParcelPos {
    x: number;
    y: number;
    faction: string;
  }

  let {
    parcels = [],
    showSeed = false,
    topLeft = '',
    bottomRight = '',
    gridSize = 50,
    capacity,
  }: {
    parcels?: ParcelPos[];
    showSeed?: boolean;
    topLeft?: string;
    bottomRight?: string;
    gridSize?: number;
    capacity?: number;
  } = $props();

  // Unique pattern id per instance — prevents collisions when both mini and full are mounted.
  const patternId = `wall-grid-${Math.random().toString(36).slice(2, 9)}`;

  function fillFor(faction: string): string {
    if (faction === 'locksmiths') return '#000';
    return FACTIONS[faction as FactionId]?.color ?? '#444';
  }
</script>

<div class="wall-map">
  <svg viewBox="0 0 {gridSize} {gridSize}" preserveAspectRatio="xMidYMid meet">
    <defs>
      <pattern id={patternId} width="5" height="5" patternUnits="userSpaceOnUse">
        <path d="M 5 0 L 0 0 0 5" fill="none" stroke="var(--ground-3)" stroke-width="0.08" />
      </pattern>
    </defs>
    <rect width={gridSize} height={gridSize} fill="url(#{patternId})" />

    {#each parcels as p, i (i)}
      {@const locks = p.faction === 'locksmiths'}
      <rect
        x={p.x}
        y={p.y}
        width="1"
        height="1"
        fill={fillFor(p.faction)}
        opacity={locks ? 1 : 0.92}
        style:filter={locks ? 'drop-shadow(0 0 0.4px rgba(212,112,122,0.7))' : ''}
      />
    {/each}

    {#if showSeed}
      <circle
        cx={gridSize / 2}
        cy={gridSize / 2}
        r="0.6"
        fill="none"
        stroke="var(--text-0)"
        stroke-width="0.12"
        opacity="0.5"
      />
    {/if}
  </svg>

  {#if topLeft}
    <div class="corner corner--tl">{topLeft}</div>
  {/if}
  {#if bottomRight}
    <div class="corner corner--br">
      {bottomRight}{#if capacity != null}<span class="cap"> / {capacity}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .wall-map {
    position: relative;
    background: #050403;
    border: 1px solid var(--ground-3);
    padding: 8px;
  }

  .wall-map svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .corner {
    position: absolute;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .corner--tl {
    top: 12px;
    left: 14px;
    color: var(--text-3);
  }

  .corner--br {
    bottom: 12px;
    right: 14px;
    color: var(--text-2);
  }

  .cap {
    color: var(--text-3);
  }
</style>
