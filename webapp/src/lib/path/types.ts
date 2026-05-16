export interface Point {
	x: number;
	y: number;
}

export type SectionId = 'philosophy' | 'spark' | 'city' | 'stack' | 'gates';

export interface WorldVertex {
	along: number;
	x: number;
}

export interface GroundShard {
	worldAlong: number;    // center along (for sorting/culling)
	worldX: number;        // center X (for culling)
	verts: WorldVertex[];  // absolute world-space vertices (projected per-vertex at render)
	baseSize: number;
	color: string;
	baseOpacity: number;
	isOnPath: boolean;
	glisten: number;
	seed: number;
}

export interface PathStop {
	id: SectionId;
	along: number;
	label: string;
	color: string;
}

export interface Camera {
	scrollProgress: number;
	smoothProgress: number;
	vpW: number;
	vpH: number;
}

export interface StopScreenPosition {
	id: SectionId;
	screenX: number;
	screenY: number;
	opacity: number;
	side: 'left' | 'right';
}
