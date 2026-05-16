<script lang="ts">
	import chicagoSkyline from '$lib/assets/chicago-skyline.png';
	import {
		generateSeeds,
		assignMeta,
		computeShardsFromSeeds,
		lerpSeeds,
		mulberry32
	} from '$lib/voronoi/voronoi';
	import { DEPTH_STYLES, SHARD_COLORS } from '$lib/voronoi/shard-config';
	import type { Shard, SeedMeta, Point } from '$lib/voronoi/types';

	interface Props {
		showImage?: boolean;
	}

	const { showImage = true }: Props = $props();

	const BASE_SHARD_COUNT = 22;
	const BASE_POOL_SIZE = 28;
	const BASE_ASPECT = 16 / 9;
	const DRIFT_SPEED = 0.36;
	const WANDER_RADIUS = 0.105;
	const OVERLAY_OPACITY = 0.06;
	const SEED = 42;

	/** Bleached palette — very low-saturation tints for Onion DAO light mode. */
	const BLEACHED_PALETTE = [
		'rgba(61,148,196,0.12)',   // blue
		'rgba(78,174,110,0.10)',   // green
		'rgba(228,184,64,0.10)',   // gold
		'rgba(212,112,122,0.08)',  // rose
		'rgba(88,192,180,0.10)',   // teal
		'rgba(240,184,76,0.08)',   // amber
		'rgba(176,128,160,0.08)',  // mauve
		'rgba(58,52,44,0.06)'     // bone
	] as const;

	const palette = showImage ? BLEACHED_PALETTE : SHARD_COLORS;

	let containerEl: HTMLDivElement | undefined = $state();
	let shards: Shard[] = $state([]);
	let animFrame: number = 0;
	let currentShardCount = BASE_SHARD_COUNT;
	let currentPoolSize = BASE_POOL_SIZE;

	// Pool state
	let poolSeeds: Point[] = [];
	let poolTargets: Point[] = [];
	let poolMeta: SeedMeta[] = [];
	let lerpProgress: number = 0;

	/** Scale shard count up when the container is wider than 16:9. */
	function computeCounts(width: number, height: number) {
		if (height <= 0) return { shardCount: BASE_SHARD_COUNT, poolSize: BASE_POOL_SIZE };
		const aspect = width / height;
		const scale = Math.max(1, aspect / BASE_ASPECT);
		const shardCount = Math.round(BASE_SHARD_COUNT * scale);
		const poolSize = Math.round(BASE_POOL_SIZE * scale);
		return { shardCount, poolSize };
	}

	function generateTargets(origins: Point[], rng: () => number): Point[] {
		return origins.map((o) => {
			const angle = rng() * Math.PI * 2;
			const r = rng() * WANDER_RADIUS;
			return {
				x: Math.max(0.01, Math.min(0.99, o.x + Math.cos(angle) * r)),
				y: Math.max(0.01, Math.min(0.99, o.y + Math.sin(angle) * r))
			};
		});
	}

	function smoothstep(t: number): number {
		return t * t * (3 - 2 * t);
	}

	function start(shardCount: number, poolSize: number) {
		cancelAnimationFrame(animFrame);

		const rng = mulberry32(SEED);
		poolSeeds = generateSeeds(poolSize, rng);
		poolMeta = assignMeta(poolSeeds.length, rng, palette);
		poolTargets = generateTargets(poolSeeds, rng);
		lerpProgress = 0;

		const count = Math.min(shardCount, poolSeeds.length);
		shards = computeShardsFromSeeds(poolSeeds.slice(0, count), poolMeta.slice(0, count));

		let lastTime = performance.now();
		const wanderRng = mulberry32(SEED + 3);

		function tick(now: number) {
			const dt = (now - lastTime) / 1000;
			lastTime = now;
			lerpProgress += dt * DRIFT_SPEED;

			if (lerpProgress >= 1) {
				poolSeeds = poolTargets;
				poolTargets = generateTargets(poolSeeds, wanderRng);
				lerpProgress = 0;
			}

			const interpolated = lerpSeeds(poolSeeds, poolTargets, smoothstep(lerpProgress));
			shards = computeShardsFromSeeds(
				interpolated.slice(0, count),
				poolMeta.slice(0, count)
			);

			animFrame = requestAnimationFrame(tick);
		}

		animFrame = requestAnimationFrame(tick);
	}

	$effect(() => {
		if (!containerEl) return;

		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			const { shardCount, poolSize } = computeCounts(width, height);
			if (shardCount !== currentShardCount) {
				currentShardCount = shardCount;
				currentPoolSize = poolSize;
				start(shardCount, poolSize);
			}
		});

		ro.observe(containerEl);
		start(currentShardCount, currentPoolSize);

		return () => {
			ro.disconnect();
			cancelAnimationFrame(animFrame);
		};
	});
</script>

<div class="hero-shards" bind:this={containerEl}>
	{#each shards as shard}
		{@const ds = DEPTH_STYLES[shard.depth]}
		<div
			class="hs"
			style="
				clip-path: {shard.clipPath};
				z-index: {ds.zIndex};
				transform: {ds.transform};
				filter: {ds.filter} saturate(0.3) brightness(1.15);
				opacity: {ds.opacity * (showImage ? 0.45 : 0.18)};
			"
		>
			{#if showImage}
				<img src={chicagoSkyline} alt="" class="hs__img" />
				<div class="hs__tint" style="background: {shard.color}; opacity: {OVERLAY_OPACITY};"></div>
			{:else}
				<div class="hs__fill" style="background: {shard.color};"></div>
			{/if}
		</div>
	{/each}
</div>

<style>
	.hero-shards {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.hs {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.hs__img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.hs__tint {
		position: absolute;
		inset: 0;
	}

	.hs__fill {
		width: 100%;
		height: 100%;
	}
</style>
