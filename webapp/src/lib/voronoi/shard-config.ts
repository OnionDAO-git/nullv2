import type { DepthPlane } from './types';

/** The 8 shard signal colors as CSS variable references. */
export const SHARD_COLORS = [
	'var(--s-blue)',
	'var(--s-green)',
	'var(--s-gold)',
	'var(--s-rose)',
	'var(--s-teal)',
	'var(--s-amber)',
	'var(--s-mauve)',
	'var(--s-bone)'
] as const;

/** Depth plane distribution: 20% deep, 60% middle, 20% near. */
export const DEPTH_THRESHOLDS: { plane: DepthPlane; cumulative: number }[] = [
	{ plane: 'deep', cumulative: 0.2 },
	{ plane: 'middle', cumulative: 0.8 },
	{ plane: 'near', cumulative: 1.0 }
];

/** Visual properties per depth plane. */
export const DEPTH_STYLES: Record<DepthPlane, {
	zIndex: number;
	transform: string;
	filter: string;
	opacity: number;
}> = {
	deep: {
		zIndex: 1,
		transform: 'scale(0.78)',
		filter: 'blur(1px) brightness(0.7)',
		opacity: 0.55
	},
	middle: {
		zIndex: 2,
		transform: 'none',
		filter: 'none',
		opacity: 1
	},
	near: {
		zIndex: 3,
		transform: 'scale(1.18)',
		filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
		opacity: 0.95
	}
};

/** Inset factor — how far each polygon shrinks toward its centroid (0..1). */
export const GROUT_INSET = 0.02;

/** Minimum distance between seed points (normalized 0..1 space). */
export const MIN_SEED_DISTANCE = 0.08;

// ── Emotions ─────────────────────────────────────────────

export interface Emotion {
	label: string;
	driftSpeed: number;
	wanderRadius: number;
	overlayOpacity: number;
	shardSwing: number;
	swingPeriod: number;
	palette: readonly string[];
	accent: string;
}

export const EMOTIONS: Record<string, Emotion> = {
	stillness: {
		label: 'Stillness',
		driftSpeed: 0.06,
		wanderRadius: 0.015,
		overlayOpacity: 0.03,
		shardSwing: 0,
		swingPeriod: 0,
		palette: SHARD_COLORS,
		accent: 'var(--s-bone)'
	},
	reverie: {
		label: 'Reverie',
		driftSpeed: 0.15,
		wanderRadius: 0.04,
		overlayOpacity: 0.10,
		shardSwing: 2,
		swingPeriod: 8,
		palette: ['var(--s-gold)', 'var(--s-amber)', 'var(--s-bone)', 'var(--s-green)'],
		accent: 'var(--s-gold)'
	},
	unease: {
		label: 'Unease',
		driftSpeed: 0.4,
		wanderRadius: 0.08,
		overlayOpacity: 0.20,
		shardSwing: 5,
		swingPeriod: 3.5,
		palette: ['var(--s-mauve)', 'var(--s-blue)', 'var(--s-teal)', 'var(--s-bone)'],
		accent: 'var(--s-mauve)'
	},
	anguish: {
		label: 'Anguish',
		driftSpeed: 0.75,
		wanderRadius: 0.13,
		overlayOpacity: 0.30,
		shardSwing: 9,
		swingPeriod: 2,
		palette: ['var(--s-rose)', 'var(--s-mauve)', 'var(--s-blue)', 'var(--s-bone)'],
		accent: 'var(--s-rose)'
	},
	fury: {
		label: 'Fury',
		driftSpeed: 1.4,
		wanderRadius: 0.18,
		overlayOpacity: 0.40,
		shardSwing: 14,
		swingPeriod: 1.2,
		palette: ['var(--s-rose)', 'var(--s-amber)', 'var(--s-gold)', 'var(--s-mauve)'],
		accent: 'var(--s-amber)'
	}
};
