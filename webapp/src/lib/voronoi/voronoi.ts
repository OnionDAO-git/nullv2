import type { Point, Polygon, Shard, SeedMeta, DepthPlane } from './types';
import {
	SHARD_COLORS,
	DEPTH_THRESHOLDS,
	GROUT_INSET,
	MIN_SEED_DISTANCE
} from './shard-config';

// ── Helpers ──────────────────────────────────────────────

function distance(a: Point, b: Point): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

function centroid(poly: Polygon): Point {
	let cx = 0;
	let cy = 0;
	for (const p of poly) {
		cx += p.x;
		cy += p.y;
	}
	return { x: cx / poly.length, y: cy / poly.length };
}

// ── Seed Generation ──────────────────────────────────────

/** Generate N seed points in [0,1]² with minimum-distance filtering. */
export function generateSeeds(count: number, rng: () => number): Point[] {
	const seeds: Point[] = [];
	const maxAttempts = count * 50;
	let attempts = 0;

	while (seeds.length < count && attempts < maxAttempts) {
		const candidate: Point = { x: rng(), y: rng() };
		attempts++;

		const tooClose = seeds.some((s) => distance(s, candidate) < MIN_SEED_DISTANCE);
		if (!tooClose) {
			seeds.push(candidate);
		}
	}

	return seeds;
}

// ── Sutherland-Hodgman Clipping ──────────────────────────

/** Clip polygon to the half-plane defined by: all points closer to `inside` than `outside`. */
function clipToHalfPlane(polygon: Polygon, inside: Point, outside: Point): Polygon {
	if (polygon.length === 0) return polygon;

	// The bisecting line between inside and outside
	const mx = (inside.x + outside.x) / 2;
	const my = (inside.y + outside.y) / 2;

	// Normal pointing toward `inside`
	const nx = inside.x - outside.x;
	const ny = inside.y - outside.y;

	const result: Polygon = [];

	for (let i = 0; i < polygon.length; i++) {
		const current = polygon[i];
		const next = polygon[(i + 1) % polygon.length];

		const dCurrent = (current.x - mx) * nx + (current.y - my) * ny;
		const dNext = (next.x - mx) * nx + (next.y - my) * ny;

		if (dCurrent >= 0) {
			result.push(current);
			if (dNext < 0) {
				result.push(intersect(current, next, mx, my, nx, ny));
			}
		} else if (dNext >= 0) {
			result.push(intersect(current, next, mx, my, nx, ny));
		}
	}

	return result;
}

/** Line-plane intersection. */
function intersect(
	a: Point,
	b: Point,
	mx: number,
	my: number,
	nx: number,
	ny: number
): Point {
	const dA = (a.x - mx) * nx + (a.y - my) * ny;
	const dB = (b.x - mx) * nx + (b.y - my) * ny;
	const t = dA / (dA - dB);
	return {
		x: a.x + t * (b.x - a.x),
		y: a.y + t * (b.y - a.y)
	};
}

// ── Voronoi Cell Computation ─────────────────────────────

/** Compute Voronoi cell for seed[i] by clipping the bounding rect against all other seeds. */
function computeCell(seeds: Point[], index: number): Polygon {
	let cell: Polygon = [
		{ x: 0, y: 0 },
		{ x: 1, y: 0 },
		{ x: 1, y: 1 },
		{ x: 0, y: 1 }
	];

	const seed = seeds[index];

	for (let j = 0; j < seeds.length; j++) {
		if (j === index) continue;
		cell = clipToHalfPlane(cell, seed, seeds[j]);
		if (cell.length === 0) break;
	}

	return cell;
}

// ── Polygon Inset ────────────────────────────────────────

/** Shrink polygon toward its centroid by `factor` (0..1) to create grout gaps. */
function insetPolygon(poly: Polygon, factor: number): Polygon {
	const c = centroid(poly);
	return poly.map((p) => ({
		x: p.x + (c.x - p.x) * factor,
		y: p.y + (c.y - p.y) * factor
	}));
}

// ── Clip Path String ─────────────────────────────────────

function toClipPath(poly: Polygon): string {
	const points = poly.map((p) => `${(p.x * 100).toFixed(2)}% ${(p.y * 100).toFixed(2)}%`);
	return `polygon(${points.join(', ')})`;
}

// ── Depth Plane Assignment ───────────────────────────────

function assignDepth(rng: () => number): DepthPlane {
	const r = rng();
	for (const { plane, cumulative } of DEPTH_THRESHOLDS) {
		if (r < cumulative) return plane;
	}
	return 'middle';
}

// ── Simple Seeded RNG ────────────────────────────────────

/** Mulberry32 PRNG — deterministic from a 32-bit seed. */
export function mulberry32(seed: number): () => number {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// ── Seed Metadata ────────────────────────────────────────

/** Assign stable color + depth to each seed (persists across animation frames). */
export function assignMeta(
	count: number,
	rng: () => number,
	palette: readonly string[] = SHARD_COLORS
): SeedMeta[] {
	return Array.from({ length: count }, () => ({
		color: palette[Math.floor(rng() * palette.length)],
		depth: assignDepth(rng)
	}));
}

// ── Shards From Explicit Seeds ───────────────────────────

/** Compute shards from explicit seed positions + pre-assigned metadata. */
export function computeShardsFromSeeds(seeds: Point[], meta: SeedMeta[]): Shard[] {
	return seeds
		.map((_, i) => {
			const rawPoly = computeCell(seeds, i);
			if (rawPoly.length < 3) return null;

			const poly = insetPolygon(rawPoly, GROUT_INSET);
			const m = meta[i];
			return {
				polygon: poly,
				clipPath: toClipPath(poly),
				color: m.color,
				depth: m.depth,
				centroid: centroid(poly)
			} satisfies Shard;
		})
		.filter((s): s is Shard => s !== null);
}

// ── Seed Lerp ────────────────────────────────────────────

/** Linearly interpolate between two seed arrays. */
export function lerpSeeds(from: Point[], to: Point[], t: number): Point[] {
	return from.map((f, i) => {
		const toPt = to[i];
		return {
			x: f.x + (toPt.x - f.x) * t,
			y: f.y + (toPt.y - f.y) * t
		};
	});
}

// ── Main API ─────────────────────────────────────────────

export function generateShards(count: number, seed: number): Shard[] {
	const rng = mulberry32(seed);
	const seeds = generateSeeds(count, rng);
	const meta = assignMeta(seeds.length, rng);
	return computeShardsFromSeeds(seeds, meta);
}
