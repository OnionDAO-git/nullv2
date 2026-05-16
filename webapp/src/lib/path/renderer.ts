import type { GroundShard, Camera, SectionId, StopScreenPosition } from './types';
import {
	HORIZON_RATIO, HORIZON_RATIO_ZOOMED, SECTION_RANGES, FADE_WINDOW, STOPS,
	CAM_MAX_ALONG, VIEW_RANGE
} from './config';
import { hash, pathX } from './ground';
import { drawCityGates } from './gates';

function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

function hr(hex: string, a: number): string {
	return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
}

function horizonRatioForProgress(progress: number): number {
	const t = clamp(progress, 0, 1);
	const eased = clamp(Math.pow(t, 1.05) * 0.62 + Math.pow(t, 2.3) * 0.38, 0, 1);
	return HORIZON_RATIO + (HORIZON_RATIO_ZOOMED - HORIZON_RATIO) * eased;
}

function cameraVanishX(progress: number, W: number): number {
	const along = getCamAlong(progress);
	const pathDrift = (pathX(along + 0.12, W) - W * 0.5) * 0.55;
	const swayA = Math.sin(progress * Math.PI * 4.6 + 0.7) * W * 0.05;
	const swayB = Math.sin(progress * Math.PI * 9.2 + 1.9) * W * 0.02;
	const raw = W * 0.5 + pathDrift + swayA + swayB;
	return clamp(raw, W * 0.24, W * 0.76);
}

/** Returns 0–1 opacity for a section's HTML panel */
export function sectionOpacity(section: SectionId, progress: number): number {
	const [start, end] = SECTION_RANGES[section];

	if (progress < start) return 0;
	if (progress > end) return 0;
	if (progress < start + FADE_WINDOW) return (progress - start) / FADE_WINDOW;
	if (progress > end - FADE_WINDOW) return (end - progress) / FADE_WINDOW;
	return 1;
}

// ── Perspective projection helpers ──

function getCamAlong(smoothProgress: number): number {
	return smoothProgress * CAM_MAX_ALONG;
}

function relDepth(worldAlong: number, camAlong: number): number {
	return (worldAlong - camAlong) / VIEW_RANGE;
}

function perspScale(rd: number): number {
	return Math.max(0.08, 1.0 - clamp(rd, 0, 1) * 0.92);
}

function screenY(rd: number, horizonY: number, groundH: number): number {
	return horizonY + (1 - clamp(rd, 0, 1)) * groundH;
}

function screenXPersp(worldX: number, ps: number, W: number, vanishX: number): number {
	return vanishX + (worldX - vanishX) * ps;
}

function screenXGround(worldX: number, ps: number, W: number, driftX: number): number {
	const driftScale = 0.7 + (1 - ps) * 0.35;
	const x = worldX + driftX * driftScale;
	return clamp(x, -W * 0.25, W * 1.25);
}

// ── Drawing layers ──

function drawSky(ctx: CanvasRenderingContext2D, W: number, horizonY: number, time: number): void {
	const sg = ctx.createLinearGradient(0, 0, 0, horizonY);
	sg.addColorStop(0, '#0A0908');
	sg.addColorStop(0.7, '#0E0C0A');
	sg.addColorStop(1, '#121010');
	ctx.fillStyle = sg;
	ctx.fillRect(0, 0, W, horizonY + 2);

	for (let i = 0; i < 20; i++) {
		const sx = (hash(i, 200) + Math.sin(time * 0.2 + i * 1.1) * 0.02) * W;
		const sy = hash(i, 201) * horizonY * 0.7;
		const sz = 0.5 + hash(i, 202) * 1.5;
		const pulse = Math.sin(time * 0.8 + i * 2.3) * 0.5 + 0.5;
		const colors = ['#58C0B4', '#3D94C4', '#E4B840'];
		const color = colors[Math.floor(hash(i, 203) * 3)];
		ctx.fillStyle = hr(color, 0.015 * pulse);
		ctx.fillRect(sx - sz, sy - sz * 0.4, sz * 2, sz * 0.8);
	}
}

/** Dark ground fill */
function drawGround(
	ctx: CanvasRenderingContext2D,
	W: number,
	horizonY: number,
	groundH: number
): void {
	const gg = ctx.createLinearGradient(0, horizonY, 0, horizonY + groundH);
	gg.addColorStop(0, '#100E0C');
	gg.addColorStop(0.3, '#120F0C');
	gg.addColorStop(1, '#0E0B09');
	ctx.fillStyle = gg;
	ctx.fillRect(0, horizonY, W, groundH);
}

function drawHorizonSeamBlend(
	ctx: CanvasRenderingContext2D,
	W: number,
	horizonY: number,
	groundH: number,
	progress: number
): void {
	const seamTop = horizonY - groundH * 0.08;
	const seamBottom = horizonY + groundH * (0.2 + progress * 0.07);
	const band = ctx.createLinearGradient(0, seamTop, 0, seamBottom);
	band.addColorStop(0, hr('#58C0B4', 0));
	band.addColorStop(0.30, hr('#1E3B38', 0.16));
	band.addColorStop(0.64, hr('#0E0C0A', 0.38));
	band.addColorStop(1, hr('#0E0C0A', 0));
	ctx.fillStyle = band;
	ctx.fillRect(0, seamTop, W, seamBottom - seamTop);
}

function drawWaypointStructures(
	ctx: CanvasRenderingContext2D,
	W: number,
	camAlong: number,
	horizonY: number,
	groundH: number,
	vanishX: number,
	time: number
): void {
	const structures = [
		{ along: 0.12, offset: -0.26, size: 1.0, color: '#58C0B4', kind: 'arch' },
		{ along: 0.22, offset: 0.22, size: 0.9, color: '#E4B840', kind: 'spire' },
		{ along: 0.36, offset: -0.30, size: 0.85, color: '#3D94C4', kind: 'block' },
		{ along: 0.52, offset: 0.30, size: 0.8, color: '#80E0D4', kind: 'arch' },
		{ along: 0.66, offset: -0.20, size: 0.78, color: '#E4D080', kind: 'spire' }
	] as const;

	for (let i = 0; i < structures.length; i++) {
		const s = structures[i];
		const rd = relDepth(s.along, camAlong);
		if (rd < -0.04 || rd > 1.0) continue;

		const ps = perspScale(Math.max(0, rd));
		const worldX = pathX(s.along, W) + s.offset * W;
		const x = screenXPersp(worldX, ps, W, vanishX);
		const y = screenY(rd, horizonY, groundH);
		const flicker = Math.sin(time * 0.6 + i * 1.4) * 0.12 + 0.88;
		const h = (34 + i * 10) * ps * s.size;
		const w = (18 + i * 8) * ps * s.size;
		const alpha = clamp(0.05 + ps * 0.22, 0.05, 0.26) * flicker;

		ctx.fillStyle = hr(s.color, alpha);
		if (s.kind === 'arch') {
			ctx.fillRect(x - w * 0.5, y - h, w * 0.3, h);
			ctx.fillRect(x + w * 0.2, y - h, w * 0.3, h);
			ctx.fillRect(x - w * 0.5, y - h, w, h * 0.18);
		} else if (s.kind === 'block') {
			const tier = h * 0.28;
			ctx.fillRect(x - w * 0.6, y - tier, w * 1.2, tier);
			ctx.fillRect(x - w * 0.45, y - tier * 2.1, w * 0.9, tier * 1.1);
			ctx.fillRect(x - w * 0.28, y - h, w * 0.56, h * 0.45);
		} else {
			ctx.beginPath();
			ctx.moveTo(x - w * 0.55, y);
			ctx.lineTo(x - w * 0.34, y - h * 0.35);
			ctx.lineTo(x - w * 0.12, y - h * 0.72);
			ctx.lineTo(x, y - h);
			ctx.lineTo(x + w * 0.14, y - h * 0.68);
			ctx.lineTo(x + w * 0.3, y - h * 0.34);
			ctx.lineTo(x + w * 0.56, y);
			ctx.closePath();
			ctx.fill();
		}
	}
}

function drawGroundShards(
	ctx: CanvasRenderingContext2D,
	shards: GroundShard[],
	W: number,
	camAlong: number,
	horizonY: number,
	groundH: number,
	vanishX: number,
	time: number
): void {
	const driftX = vanishX - W * 0.5;

	for (const s of shards) {
		const rd = relDepth(s.worldAlong, camAlong);
		if (rd < -0.15 || rd > 1.15) continue;

		const ps = perspScale(clamp(rd, 0, 1));
		if (ps < 0.03) continue;
		const depthDensity = 0.35 + ps * 0.95;
		const depthSizeScale = 0.20 + ps * 0.92;

		// Opacity with distance fade
		const glistenPhase = Math.sin(time * 2 + s.seed * 0.4);
		const glistenBoost = s.glisten * clamp(glistenPhase, 0, 1);
		const pathShimmer = s.isOnPath
			? Math.sin(time * 3 + s.seed * 0.2) * 0.04
			: Math.sin(time * 1.4 + s.seed * 0.12) * 0.015;
		const opacityScale = (0.30 + 0.78 * ps) * depthDensity;
		const opacity = clamp((s.baseOpacity + glistenBoost + pathShimmer) * opacityScale, 0.02, 0.82);

		ctx.fillStyle = hr(s.color, opacity);

		// Per-vertex projection
		ctx.beginPath();
		for (let v = 0; v < s.verts.length; v++) {
			const scaledAlong = s.worldAlong + (s.verts[v].along - s.worldAlong) * depthSizeScale;
			const scaledX = s.worldX + (s.verts[v].x - s.worldX) * depthSizeScale;
			const vrd = relDepth(scaledAlong, camAlong);
			const vps = perspScale(clamp(vrd, 0, 1));
			const x = screenXGround(scaledX, vps, W, driftX);
			const y = screenY(vrd, horizonY, groundH);
			if (v === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.closePath();
		ctx.fill();
	}
}

function drawPathGlow(
	ctx: CanvasRenderingContext2D,
	W: number,
	camAlong: number,
	horizonY: number,
	groundH: number,
	vanishX: number,
	time: number
): void {
	const pathPulse = Math.sin(time * 0.8) * 0.15 + 0.85;
	const steps = 42;

	// Scattered path accent (no hard center line)
	ctx.save();
	ctx.filter = 'blur(10px)';

	for (let i = 0; i < steps; i++) {
		const a = i / steps;
		const rd = relDepth(a, camAlong);
		if (rd < -0.05 || rd > 1.02) continue;

		const ps = perspScale(Math.max(0, rd));
		const y = screenY(rd, horizonY, groundH);
		const centerX = screenXPersp(pathX(a, W), ps, W, vanishX);
		const spread = (W * 0.05 + (1 - ps) * W * 0.16) * ps;

		for (let j = 0; j < 3; j++) {
			const jitter = (hash(i, 500 + j) - 0.5) * spread * 2;
			const x = centerX + jitter;
			const radius = (7 + hash(i, 540 + j) * 16) * ps;
			const alpha = 0.012 * pathPulse * ps * (0.6 + hash(i, 580 + j) * 0.4);
			const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
			glow.addColorStop(0, hr('#E4B840', alpha));
			glow.addColorStop(0.45, hr('#E4B840', alpha * 0.45));
			glow.addColorStop(1, 'transparent');
			ctx.fillStyle = glow;
			ctx.fillRect(x - radius - 1, y - radius - 1, radius * 2 + 2, radius * 2 + 2);
		}
	}

	ctx.restore();
}

function drawStopMarkers(
	ctx: CanvasRenderingContext2D,
	W: number,
	camAlong: number,
	horizonY: number,
	groundH: number,
	vanishX: number,
	time: number
): void {
	for (const stop of STOPS) {
		const rd = relDepth(stop.along, camAlong);
		if (rd < -0.05 || rd > 1.02) continue;

		const ps = perspScale(Math.max(0, rd));
		const sy = screenY(rd, horizonY, groundH);
		const sx = screenXPersp(pathX(stop.along, W), ps, W, vanishX);

		const dist = Math.abs(camAlong - stop.along);
		const isActive = dist < 0.1;
		const pulse = Math.sin(time * 1.5 + stop.along * 10) * 0.15 + 0.85;
		const baseAlpha = isActive ? 0.25 : 0.08;
		const radius = (isActive ? 40 : 25) * ps;

		if (radius < 2) continue;

		const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
		glow.addColorStop(0, hr(stop.color, baseAlpha * pulse * ps));
		glow.addColorStop(0.5, hr(stop.color, baseAlpha * 0.4 * pulse * ps));
		glow.addColorStop(1, 'transparent');
		ctx.fillStyle = glow;
		ctx.fillRect(sx - radius - 5, sy - radius - 5, radius * 2 + 10, radius * 2 + 10);

		if (ps > 0.2 && isActive) {
			ctx.font = `${Math.round(9 * ps)}px 'Space Mono', monospace`;
			ctx.fillStyle = hr(stop.color, 0.5 * ps);
			ctx.textAlign = 'center';
			ctx.fillText(stop.label.toUpperCase(), sx, sy - radius - 6 * ps);
		}
	}
}

function drawAmbientParticles(
	ctx: CanvasRenderingContext2D,
	W: number,
	camAlong: number,
	horizonY: number,
	groundH: number,
	vanishX: number,
	time: number
): void {
	const camScreenX = screenXPersp(pathX(camAlong, W), 0.92, W, vanishX);
	const camScreenY = horizonY + groundH;
	const count = 30;

	for (let i = 0; i < count; i++) {
		const seed = i + 9000;
		const phase = (time * 0.2 + hash(seed, 0) * 100) % 1;
		const alive = Math.sin(phase * Math.PI);

		const dx = (hash(seed, 1) - 0.5) * 120;
		const dy = (hash(seed, 2) - 0.5) * 80;
		const px = camScreenX + dx + Math.sin(time * 0.5 + seed * 1.3) * 4;
		const py = camScreenY + dy + Math.cos(time * 0.4 + seed * 0.8) * 3;

		const sz = (0.5 + hash(seed, 3) * 2) * alive;
		if (sz < 0.3) continue;

		const colors = ['#E4B840', '#F0B84C', '#58C0B4', '#D4CDB8'];
		const color = colors[Math.floor(hash(seed, 4) * colors.length)];
		const flicker = Math.sin(time * 4 + seed * 3.1) * 0.4 + 0.6;
		const opacity = alive * (0.03 + hash(seed, 5) * 0.06) * flicker;

		ctx.fillStyle = hr(color, opacity);
		ctx.save();
		ctx.translate(px, py);
		ctx.rotate(time + seed);
		ctx.beginPath();
		const nv = 3 + Math.floor(hash(seed, 6) * 2);
		for (let v = 0; v < nv; v++) {
			const a = (v / nv) * Math.PI * 2;
			const r = sz * (0.5 + hash(seed * 5 + v, 7) * 0.5);
			if (v === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
			else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
}

function drawWalkerMarker(
	ctx: CanvasRenderingContext2D,
	W: number,
	camAlong: number,
	horizonY: number,
	groundH: number,
	vanishX: number,
	time: number
): void {
	const sx = screenXPersp(pathX(camAlong, W), 0.96, W, vanishX);
	const sy = horizonY + groundH - 4;
	const pulse = Math.sin(time * 2) * 0.15 + 0.85;
	const radius = 18;

	const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius);
	glow.addColorStop(0, hr('#E4B840', 0.12 * pulse));
	glow.addColorStop(0.4, hr('#E4B840', 0.06 * pulse));
	glow.addColorStop(1, 'transparent');
	ctx.fillStyle = glow;
	ctx.fillRect(sx - radius - 2, sy - radius - 2, radius * 2 + 4, radius * 2 + 4);
}

/** Main per-frame render function */
export function renderFrame(
	ctx: CanvasRenderingContext2D,
	shards: GroundShard[],
	camera: Camera,
	time: number
): void {
	const W = camera.vpW;
	const H = camera.vpH;
	const camProgress = camera.smoothProgress;
	const visualProgress = camera.scrollProgress;

	const camAlong = getCamAlong(camProgress);
	const horizonY = H * horizonRatioForProgress(visualProgress);
	const groundH = H - horizonY;
	const vanishX = cameraVanishX(camProgress, W);

	// Clear
	ctx.fillStyle = '#0E0C0A';
	ctx.fillRect(0, 0, W, H);

	// Layer 1: Sky
	drawSky(ctx, W, horizonY, time);

	// Layer 1.5: Ground fill
	drawGround(ctx, W, horizonY, groundH);

	// Layer 2: City Gates at horizon (scales with progress)
	drawCityGates(ctx, W, H, horizonY, visualProgress, time);

	// Layer 3: Ground shards
	drawGroundShards(ctx, shards, W, camAlong, horizonY, groundH, vanishX, time);

	// Layer 3.5: Map waypoints along the route
	drawWaypointStructures(ctx, W, camAlong, horizonY, groundH, vanishX, time);

	// Layer 3.7: City/ground seam blend
	drawHorizonSeamBlend(ctx, W, horizonY, groundH, visualProgress);

	// Layer 4: Path glow
	drawPathGlow(ctx, W, camAlong, horizonY, groundH, vanishX, time);

	// Layer 5: Stop markers
	drawStopMarkers(ctx, W, camAlong, horizonY, groundH, vanishX, time);

	// Layer 6: Walker marker
	drawWalkerMarker(ctx, W, camAlong, horizonY, groundH, vanishX, time);

	// Layer 7: Ambient particles
	drawAmbientParticles(ctx, W, camAlong, horizonY, groundH, vanishX, time);
}

/** Compute screen positions for stop cards (excluding philosophy/hero) */
export function getStopScreenPositions(camera: Camera): StopScreenPosition[] {
	const W = camera.vpW;
	const H = camera.vpH;
	const camAlong = getCamAlong(camera.smoothProgress);
	const horizonY = H * horizonRatioForProgress(camera.scrollProgress);
	const groundH = H - horizonY;
	const vanishX = cameraVanishX(camera.smoothProgress, W);

	const results: StopScreenPosition[] = [];

	// Suppress stop cards while hero is visible
	const heroFade = camera.scrollProgress < 0.12 ? 0 :
		camera.scrollProgress < 0.18 ? (camera.scrollProgress - 0.12) / 0.06 : 1;

	for (let i = 0; i < STOPS.length; i++) {
		const stop = STOPS[i];

		if (stop.id === 'philosophy') continue;

		const rd = relDepth(stop.along, camAlong);

		// Opacity based on relative depth
		let opacity = 0;
		if (rd >= -0.05 && rd <= 0.8) {
			if (rd < 0.05) opacity = (rd + 0.05) / 0.1;
			else if (rd < 0.55) opacity = 1;
			else if (rd < 0.8) opacity = (0.8 - rd) / 0.25;
		}

		opacity *= heroFade;

		if (opacity < 0.01) continue;

		const ps = perspScale(Math.max(0, rd));
		const rawX = pathX(stop.along, W);
		const sx = screenXPersp(rawX, ps, W, vanishX);
		const sy = screenY(rd, horizonY, groundH);

		const side: 'left' | 'right' = i % 2 === 0 ? 'right' : 'left';

		results.push({
			id: stop.id,
			screenX: sx,
			screenY: sy,
			opacity,
			side
		});
	}

	return results;
}
