import type { SectionId, PathStop } from './types';

export const VOID_COLOR = '#0E0C0A';
export const HORIZON_RATIO = 0.36;
export const HORIZON_RATIO_ZOOMED = 0.68;
export const SCROLL_PAGES = 7;
export const CAMERA_SMOOTHING = 0.06;

export const FADE_WINDOW = 0.04;

/** Camera advances to 85% of the path at max scroll (arrives at the gates) */
export const CAM_MAX_ALONG = 0.85;
/** Forward view range (constant — no dynamic zoom) */
export const VIEW_RANGE = 0.45;

export const SHARD_COUNT_DESKTOP = 2400;
export const SHARD_COUNT_MOBILE = 1000;

export const STOPS: PathStop[] = [
	{ id: 'philosophy', along: 0.0, label: 'Origin', color: '#EDE8E0' },
	{ id: 'spark', along: 0.25, label: 'Spark', color: '#F0B84C' },
	{ id: 'city', along: 0.5, label: 'Null City', color: '#E4B840' },
	{ id: 'stack', along: 0.75, label: 'Null Stack', color: '#58C0B4' },
	{ id: 'gates', along: 1.0, label: 'City Gates', color: '#58C0B4' }
];

export const SECTION_RANGES: Record<SectionId, [number, number]> = {
	philosophy: [0.0, 0.18],
	spark: [0.15, 0.38],
	city: [0.35, 0.58],
	stack: [0.55, 0.78],
	gates: [0.75, 1.0]
};

export const GROUND_COLORS = [
	'#E4B840', '#F0B84C', '#C8A030', '#D4A838', '#B09028',
	'#3A342C', '#5C5040', '#D4707A', '#4EAE6E', '#B080A0'
];

export const PATH_COLORS = [
	'#DCC060', '#C8B868', '#E4D080', '#B0C8C0', '#D4CDB8', '#80B8B0'
];
