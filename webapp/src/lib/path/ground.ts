import type { GroundShard, WorldVertex } from './types';
import { GROUND_COLORS, PATH_COLORS, SHARD_COUNT_DESKTOP, SHARD_COUNT_MOBILE } from './config';

/** Deterministic hash (from commons-view-draft) */
export function hash(a: number, b: number): number {
	const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
	return x - Math.floor(x);
}

/** Path X position as fraction of width — winding S-curve meander */
export function pathX(along: number, W: number): number {
	const base = 0.5 + Math.sin(along * Math.PI * 1.2) * 0.12
		- along * 0.06
		+ Math.sin(along * Math.PI * 2.5 + 0.5) * 0.05;
	return base * W;
}

function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

/** Generate scattered irregular shards covering the full ground */
export function generateGroundShards(W: number, _H: number, isMobile: boolean): GroundShard[] {
	const count = isMobile ? SHARD_COUNT_MOBILE : SHARD_COUNT_DESKTOP;

	// World-space along extends beyond 0→1 so horizon always has shards
	const ALONG_START = -0.1;
	const ALONG_END = 1.2;
	const alongRange = ALONG_END - ALONG_START;

	const shards: GroundShard[] = [];

	for (let i = 0; i < count; i++) {
		const seed = i;

		// Depth distribution: denser near viewer, thinner toward horizon.
		const u = hash(seed, 1);
		const nearBiased = Math.pow(u, 2.25);
		const alongT = clamp(0.25 * u + 0.75 * nearBiased, 0, 1);
		const along = ALONG_START + alongT * alongRange;

		// Full width coverage with explicit edge-biased sampling to prevent side gutters.
		let worldX = hash(seed, 2) * W;
		const edgePick = hash(seed, 22);
		if (edgePick < 0.36) {
			const side = hash(seed, 23) < 0.5 ? 0 : 1;
			const edgeBand = Math.pow(hash(seed, 24), 1.6) * 0.22;
			worldX = (side === 0 ? edgeBand : 1 - edgeBand) * W;
		}

		// Shard size: significantly larger near camera, smaller far away
		const depthFraction = (along - ALONG_START) / alongRange;
		const baseSizeMultiplier = clamp(1.75 - depthFraction * 1.35, 0.32, 1.75);
		const baseSize = (W / 58) * baseSizeMultiplier * (0.45 + hash(seed, 3) * 0.75);

		// Generate irregular polygon vertices (3–6 sides)
		const numVerts = 3 + Math.floor(hash(seed, 4) * 4);
		const verts: WorldVertex[] = [];
		for (let v = 0; v < numVerts; v++) {
			const angle = (v / numVerts) * Math.PI * 2 + hash(seed * 7 + v, 5) * 0.8;
			const r = baseSize * (0.4 + hash(seed * 7 + v, 6) * 0.6);
			// Convert polar offset to world-space absolute position
			const vx = worldX + Math.cos(angle) * r;
			const va = along + Math.sin(angle) * r / W * 0.3;
			verts.push({ along: va, x: Math.max(0, Math.min(W, vx)) });
		}

		// Soft path influence only (no hard path corridor)
		const pathDistNorm = Math.abs(worldX - pathX(along, W)) / W;
		const centerInfluence = clamp(1 - pathDistNorm / 0.55, 0, 1);
		const edgeInfluence = Math.abs(worldX / W - 0.5) * 2;
		const isOnPath = centerInfluence > 0.78;

		// Color and opacity based on location
		const cr = hash(seed, 15);
		let color: string;
		let baseOpacity: number;

		if (along > 0.8) {
			// Near city gates — teal tones
			const gateColors = ['#58C0B4', '#3D94C4', '#3A8A7A', '#5C5040', '#80E0D4'];
			const idx = Math.floor(cr * gateColors.length);
			color = gateColors[Math.min(idx, gateColors.length - 1)];
			baseOpacity = 0.18 + hash(seed, 18) * 0.22 + centerInfluence * 0.04;
		} else if (centerInfluence > 0.35) {
			// Center-biased mix, but still scattered across width
			const mixColors = [...PATH_COLORS, ...GROUND_COLORS.slice(0, 5), '#D4CDB8'];
			const idx = Math.floor(cr * mixColors.length);
			color = mixColors[Math.min(idx, mixColors.length - 1)];
			baseOpacity = 0.17 + hash(seed, 19) * 0.20 + centerInfluence * 0.06;
		} else {
			// Outer ground keeps color and visibility to avoid dark side bands
			const outerColors = [...GROUND_COLORS.slice(0, 5), '#D4CDB8', '#B080A0', '#4EAE6E'];
			const idx = Math.floor(cr * outerColors.length);
			color = outerColors[Math.min(idx, outerColors.length - 1)];
			baseOpacity = 0.19 + hash(seed, 20) * 0.20 + edgeInfluence * 0.09;
		}

		const glisten = hash(seed, 21) > (0.90 - centerInfluence * 0.15 + edgeInfluence * 0.08)
			? (0.04 + centerInfluence * 0.06 + edgeInfluence * 0.04)
			: 0;

		shards.push({
			worldAlong: along,
			worldX,
			verts,
			baseSize,
			color,
			baseOpacity,
			isOnPath,
			glisten,
			seed
		});
	}

	// Sort: far first (high worldAlong drawn first)
	shards.sort((a, b) => b.worldAlong - a.worldAlong);
	return shards;
}
