/**
 * Stained Glass Tessellation Engine
 *
 * Pure geometry functions for generating Voronoi-based stained glass patterns.
 * Poisson-disk seeding → Lloyd relaxation → Voronoi cells → vertex perturbation.
 * No DOM dependencies — used by StainedGlassCanvas.svelte for rendering.
 */

export const VOID = '#0E0C0A';
export const CHALK = '#EDE8E0';

export const PALETTE: [number, number, number][] = [
	[88, 192, 180], // teal
	[228, 184, 64], // gold
	[61, 148, 196], // blue
	[212, 112, 122], // rose
	[240, 184, 76], // amber
	[78, 174, 110], // green
	[176, 128, 160] // mauve
];

export type GlassCell = {
	cx: number;
	cy: number;
	poly: [number, number][];
	color: [number, number, number];
};

/** Linear congruential generator — deterministic pseudo-random */
export function lcg(seed: number): () => number {
	let r = seed;
	return () => {
		r = (r * 1664525 + 1013904223) & 0xffffffff;
		return (r >>> 0) / 0xffffffff;
	};
}

/** Poisson-disk sampling — ensures cells are large and varied, not grid-like */
export function poissonDisk(
	w: number,
	h: number,
	minDist: number,
	maxPts: number,
	seed: number
): [number, number][] {
	const rand = lcg(seed);
	const pts: [number, number][] = [];
	const active: [number, number][] = [];

	const first: [number, number] = [w * (0.3 + rand() * 0.4), h * (0.3 + rand() * 0.4)];
	pts.push(first);
	active.push(first);

	while (active.length && pts.length < maxPts) {
		const idx = Math.floor(rand() * active.length);
		const base = active[idx];
		let found = false;
		for (let a = 0; a < 24; a++) {
			const angle = rand() * Math.PI * 2;
			const d = minDist * (1.0 + rand() * 1.2);
			const nx = base[0] + Math.cos(angle) * d;
			const ny = base[1] + Math.sin(angle) * d;
			if (
				nx < -minDist * 0.4 ||
				nx > w + minDist * 0.4 ||
				ny < -minDist * 0.4 ||
				ny > h + minDist * 0.4
			)
				continue;
			if (pts.some((p) => Math.hypot(p[0] - nx, p[1] - ny) < minDist)) continue;
			pts.push([nx, ny]);
			active.push([nx, ny]);
			found = true;
			break;
		}
		if (!found) active.splice(idx, 1);
	}
	return pts;
}

type VoronoiResult = { cx: number; cy: number; poly: [number, number][] } | null;

/** Voronoi cell via half-plane clipping */
export function voronoiCell(
	p: [number, number],
	all: [number, number][],
	w: number,
	h: number
): VoronoiResult {
	let poly: [number, number][] = [
		[0, 0],
		[w, 0],
		[w, h],
		[0, h]
	];
	for (const q of all) {
		if (q === p) continue;
		const mx = (p[0] + q[0]) / 2,
			my = (p[1] + q[1]) / 2;
		const nx = q[0] - p[0],
			ny = q[1] - p[1];
		const clipped = clipHP(poly, mx, my, nx, ny);
		if (!clipped || clipped.length < 3) return null;
		poly = clipped;
	}
	return { cx: p[0], cy: p[1], poly };
}

function clipHP(
	poly: [number, number][],
	mx: number,
	my: number,
	nx: number,
	ny: number
): [number, number][] | null {
	const out: [number, number][] = [];
	const n = poly.length;
	for (let i = 0; i < n; i++) {
		const a = poly[i],
			b = poly[(i + 1) % n];
		const da = (a[0] - mx) * nx + (a[1] - my) * ny;
		const db = (b[0] - mx) * nx + (b[1] - my) * ny;
		if (da <= 0) out.push(a);
		if (da < 0 !== db < 0) {
			const t = da / (da - db);
			out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
		}
	}
	return out.length >= 3 ? out : null;
}

/** One pass of Lloyd relaxation — push seed points toward cell centroids */
export function lloydRelax(
	pts: [number, number][],
	w: number,
	h: number
): [number, number][] {
	const cells = pts.map((p) => voronoiCell(p, pts, w, h)).filter(Boolean) as NonNullable<
		VoronoiResult
	>[];
	return cells.map((c) => {
		const cx = c.poly.reduce((s, v) => s + v[0], 0) / c.poly.length;
		const cy = c.poly.reduce((s, v) => s + v[1], 0) / c.poly.length;
		return [c.cx * 0.4 + cx * 0.6, c.cy * 0.4 + cy * 0.6] as [number, number];
	});
}

/** Vertex perturbation — breaks mathematical perfection, makes edges feel hand-cut */
export function perturbPoly(poly: [number, number][], amount: number): [number, number][] {
	return poly.map(([x, y]) => {
		const h1 = Math.sin(x * 0.137 + y * 0.293) * 43758.5453;
		const h2 = Math.sin(x * 0.293 + y * 0.137) * 43758.5453;
		const dx = (h1 - Math.floor(h1) - 0.5) * amount * 2;
		const dy = (h2 - Math.floor(h2) - 0.5) * amount * 2;
		return [x + dx, y + dy];
	});
}

/** Shrink polygon inward for lead line gap */
export function shrinkPoly(poly: [number, number][], gap: number): [number, number][] | null {
	const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
	const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
	const result: [number, number][] = poly.map(([x, y]) => {
		const dx = x - cx,
			dy = y - cy,
			len = Math.sqrt(dx * dx + dy * dy) || 1;
		return [x - (dx / len) * gap, y - (dy / len) * gap];
	});
	return result.length >= 3 ? result : null;
}

/** Build glass panels — Poisson + Lloyd + assign colors avoiding adjacent repeats */
export function buildGlass(
	w: number,
	h: number,
	minDist: number,
	maxPts: number,
	seed: number
): GlassCell[] {
	const rand = lcg(seed + 99);
	let pts = poissonDisk(w, h, minDist, maxPts, seed);
	pts = lloydRelax(pts, w, h);
	pts = lloydRelax(pts, w, h);

	const cells = pts
		.map((p) => voronoiCell(p, pts, w, h))
		.filter(Boolean) as NonNullable<VoronoiResult>[];

	// Assign palette colors — simple greedy so adjacent cells differ
	const colorIdx = new Array(cells.length).fill(-1);
	cells.forEach((c, i) => {
		const used = new Set<number>();
		cells.forEach((n, j) => {
			if (j === i || colorIdx[j] === -1) return;
			const shared = c.poly.some(([x, y]) =>
				n.poly.some(([nx, ny]) => Math.hypot(x - nx, y - ny) < 4)
			);
			if (shared) used.add(colorIdx[j]);
		});
		let pick = Math.floor(rand() * PALETTE.length);
		let tries = 0;
		while (used.has(pick) && tries++ < 12) pick = (pick + 1) % PALETTE.length;
		colorIdx[i] = pick;
	});

	return cells.map((c, i) => ({
		cx: c.cx,
		cy: c.cy,
		poly: c.poly,
		color: PALETTE[colorIdx[i]]
	}));
}
