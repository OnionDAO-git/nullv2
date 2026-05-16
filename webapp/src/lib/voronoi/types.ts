export interface Point {
	x: number;
	y: number;
}

export type Polygon = Point[];

export type DepthPlane = 'deep' | 'middle' | 'near';

export interface SeedMeta {
	color: string;
	depth: DepthPlane;
}

export interface Shard {
	polygon: Polygon;
	clipPath: string;
	color: string;
	depth: DepthPlane;
	centroid: Point;
}
