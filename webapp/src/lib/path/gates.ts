import { hash } from './ground';

function clamp(v: number, lo: number, hi: number): number {
	return Math.max(lo, Math.min(hi, v));
}

function hr(hex: string, a: number): string {
	return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
}

/** Draw the city gates visual at the horizon — scales up as progress increases */
export function drawCityGates(
	ctx: CanvasRenderingContext2D,
	W: number, H: number,
	horizonY: number,
	progress: number,
	time: number
): void {
	const centerX = W * 0.5;

	// === ZOOM EFFECT ===
	// As progress increases, the gates get larger and descend from the horizon
	// Scale: 1.0 at start → 3.5 at full progress (gates visually approach)
	const zoom = 1.0 + progress * 2.5;
	// Gates descend: at progress=0 they sit at horizon, at progress=1 they extend well below
	const descentY = progress * H * 0.25;

	const baseRidgeH = H * 0.18;
	const ridgeH = baseRidgeH * zoom;

	// Intensity scales from 0.3 base to 1.0 at full progress
	const intensity = 0.3 + progress * 0.7;

	// Time pulses
	const breath1 = Math.sin(time * 0.4) * 0.15 + 0.85;
	const breath2 = Math.sin(time * 0.73 + 1.2) * 0.12 + 0.88;
	const breath3 = Math.sin(time * 0.17) * 0.08 + 0.92;

	// Gate origin: horizon + descent
	const gateOriginY = horizonY + descentY;

	// Deep atmospheric halo — scales with zoom
	const haloRadius = W * 0.42 * zoom;
	const h1 = ctx.createRadialGradient(
		centerX, gateOriginY - ridgeH * 0.4, 0,
		centerX, gateOriginY - ridgeH * 0.4, haloRadius
	);
	h1.addColorStop(0, hr('#58C0B4', 0.07 * breath1 * breath3 * intensity));
	h1.addColorStop(0.15, hr('#58C0B4', 0.04 * breath1 * intensity));
	h1.addColorStop(0.35, hr('#3D94C4', 0.018 * breath1 * intensity));
	h1.addColorStop(0.6, hr('#3D94C4', 0.006 * intensity));
	h1.addColorStop(1, 'transparent');
	ctx.fillStyle = h1;
	ctx.fillRect(0, 0, W, gateOriginY + 30);

	// Inner core — white-hot convergence
	const coreRadius = 80 * zoom;
	const h2 = ctx.createRadialGradient(
		centerX, gateOriginY - ridgeH * 0.38, 0,
		centerX, gateOriginY - ridgeH * 0.38, coreRadius
	);
	h2.addColorStop(0, hr('#FFFFFF', 0.09 * breath2 * intensity));
	h2.addColorStop(0.12, hr('#D0F8F0', 0.07 * breath2 * intensity));
	h2.addColorStop(0.3, hr('#A0E8E0', 0.04 * breath2 * intensity));
	h2.addColorStop(0.6, hr('#58C0B4', 0.02 * breath1 * intensity));
	h2.addColorStop(1, 'transparent');
	ctx.fillStyle = h2;
	ctx.fillRect(
		centerX - coreRadius - 20, gateOriginY - ridgeH - 30,
		coreRadius * 2 + 40, ridgeH + 60
	);

	// Skyline back-glow / haze curtain to prevent seeing through to a hard horizon line
	const curtainRadiusX = W * (0.34 + progress * 0.42);
	const curtain = ctx.createRadialGradient(
		centerX, gateOriginY - ridgeH * 0.26, 0,
		centerX, gateOriginY - ridgeH * 0.26, curtainRadiusX
	);
	curtain.addColorStop(0, hr('#58C0B4', 0.09 * breath1 * intensity));
	curtain.addColorStop(0.25, hr('#3D94C4', 0.05 * breath2 * intensity));
	curtain.addColorStop(0.55, hr('#3D94C4', 0.02 * intensity));
	curtain.addColorStop(1, 'transparent');
	ctx.fillStyle = curtain;
	ctx.fillRect(
		centerX - curtainRadiusX - 30,
		gateOriginY - ridgeH - H * 0.14,
		curtainRadiusX * 2 + 60,
		ridgeH + H * 0.30
	);

	const skylineWashTop = gateOriginY - ridgeH * 0.38;
	const skylineWashBottom = gateOriginY + ridgeH * (0.24 + progress * 0.2);
	const skylineWash = ctx.createLinearGradient(0, skylineWashTop, 0, skylineWashBottom);
	skylineWash.addColorStop(0, hr('#3D94C4', 0));
	skylineWash.addColorStop(0.46, hr('#58C0B4', 0.05 * breath1 * intensity));
	skylineWash.addColorStop(0.74, hr('#10201D', 0.22 * intensity));
	skylineWash.addColorStop(1, hr('#0E0C0A', 0.42 * intensity));
	ctx.fillStyle = skylineWash;
	ctx.fillRect(0, skylineWashTop, W, skylineWashBottom - skylineWashTop);

	// Diverse skyline masses: fewer lines, wider buildings as camera approaches.
	const skylineProgress = clamp((progress - 0.08) / 0.92, 0, 1);
	const towerCount = Math.round(56 + skylineProgress * 68);
	const spreadW = 0.66 + skylineProgress * 0.34;
	const towerMass = 0.60 + skylineProgress * 2.60;
	const minTopRatio = 0.28 + skylineProgress * 0.22;

	for (let i = 0; i < towerCount; i++) {
		const seed = i + 5000;
		const baseNx = (i + 0.5) / towerCount;
		const nx = clamp(baseNx + (hash(seed, 55) - 0.5) * 0.016, 0.02, 0.98);
		const x = centerX + (nx - 0.5) * W * spreadW;

		const distFromCenter = Math.abs(nx - 0.5);
		const centralness = 1 - clamp(distFromCenter * 2.0, 0, 1);
		if (centralness < 0.01) continue;
		if (x < -80 || x > W + 80) continue;

		const swayAmp = (0.35 + hash(seed, 30) * 1.6) * (1 - skylineProgress * 0.75);
		const sway = Math.sin(time * 0.55 + seed * 0.41) * swayAmp * (1 - centralness * 0.25);

		const heightVar = hash(seed, 31);
		const h = ridgeH * (0.20 + centralness * 1.02) * (0.52 + heightVar * 0.95) * (0.90 + skylineProgress * 0.60);

		const baseW = (2.8 + hash(seed, 32) * 8.8) * (0.65 + centralness * 1.25) * towerMass;
		const topW = baseW * (minTopRatio + hash(seed, 43) * 0.22);
		const baseY = gateOriginY + hash(seed, 33) * 3;

		const cr = hash(seed, 34);
		let color: string;
		let opacity: number;
		const pulseLocal = Math.sin(time * 0.8 + seed * 0.31) * 0.15 + 0.85;

		if (centralness > 0.65) {
			const colors = ['#FFFFFF', '#D0F8F0', '#A0F0E8', '#80E0D4', '#58C0B4', '#3D94C4'];
			const idx = Math.floor(cr * colors.length);
			color = colors[Math.min(idx, colors.length - 1)];
			opacity = (0.08 + centralness * 0.20) * pulseLocal * breath1 * intensity;
		} else if (centralness > 0.30) {
			const colors = ['#80E0D4', '#58C0B4', '#3D94C4', '#3A8A7A'];
			const idx = Math.floor(cr * colors.length);
			color = colors[Math.min(idx, colors.length - 1)];
			opacity = (0.05 + centralness * 0.12) * pulseLocal * intensity;
		} else {
			const colors = ['#58C0B4', '#3D94C4', '#28231E'];
			const idx = Math.floor(cr * colors.length);
			color = colors[Math.min(idx, colors.length - 1)];
			opacity = (0.02 + hash(seed, 35) * 0.06) * pulseLocal * intensity;
		}

		const bx = x + sway;
		const topX = bx + (hash(seed, 38) - 0.5) * baseW * 0.16;
		const topY = baseY - h;
		const shoulderY = baseY - h * (0.22 + hash(seed, 50) * 0.18);
		const neckY = baseY - h * (0.58 + hash(seed, 51) * 0.17);
		const shapeType = hash(seed, 57);

		ctx.fillStyle = hr(color, opacity);
		ctx.beginPath();

		if (shapeType < 0.34) {
			// Monolith
			ctx.moveTo(bx - baseW * 0.55, baseY);
			ctx.lineTo(bx - baseW * 0.49, shoulderY);
			ctx.lineTo(topX - topW * 0.48, topY + h * 0.04);
			ctx.lineTo(topX + topW * 0.48, topY + h * 0.04);
			ctx.lineTo(bx + baseW * 0.49, shoulderY);
			ctx.lineTo(bx + baseW * 0.55, baseY);
		} else if (shapeType < 0.68) {
			// Stepped tower
			const tier1Y = baseY - h * (0.18 + hash(seed, 61) * 0.08);
			const tier2Y = baseY - h * (0.42 + hash(seed, 62) * 0.10);
			const tier3Y = baseY - h * (0.68 + hash(seed, 63) * 0.08);
			ctx.moveTo(bx - baseW * 0.62, baseY);
			ctx.lineTo(bx - baseW * 0.56, tier1Y);
			ctx.lineTo(bx - baseW * 0.40, tier1Y);
			ctx.lineTo(bx - baseW * 0.34, tier2Y);
			ctx.lineTo(bx - baseW * 0.20, tier2Y);
			ctx.lineTo(topX - topW * 0.5, tier3Y);
			ctx.lineTo(topX - topW * 0.45, topY + h * 0.04);
			ctx.lineTo(topX + topW * 0.45, topY + h * 0.04);
			ctx.lineTo(topX + topW * 0.5, tier3Y);
			ctx.lineTo(bx + baseW * 0.20, tier2Y);
			ctx.lineTo(bx + baseW * 0.34, tier2Y);
			ctx.lineTo(bx + baseW * 0.40, tier1Y);
			ctx.lineTo(bx + baseW * 0.56, tier1Y);
			ctx.lineTo(bx + baseW * 0.62, baseY);
		} else {
			// Split crown / twin peak
			const notchDepth = h * (0.08 + hash(seed, 64) * 0.10);
			const crownSpread = topW * (0.40 + hash(seed, 65) * 0.35);
			ctx.moveTo(bx - baseW * 0.60, baseY);
			ctx.lineTo(bx - baseW * 0.50, shoulderY);
			ctx.lineTo(bx - baseW * 0.30, neckY);
			ctx.lineTo(topX - crownSpread, topY + h * 0.08);
			ctx.lineTo(topX - topW * 0.18, topY);
			ctx.lineTo(topX, topY + notchDepth);
			ctx.lineTo(topX + topW * 0.18, topY);
			ctx.lineTo(topX + crownSpread, topY + h * 0.08);
			ctx.lineTo(bx + baseW * 0.30, neckY);
			ctx.lineTo(bx + baseW * 0.50, shoulderY);
			ctx.lineTo(bx + baseW * 0.60, baseY);
		}

		ctx.closePath();
		ctx.fill();

		// Subtle facets/windows for volume and diversity
		if (skylineProgress > 0.18 && baseW > 8 && hash(seed, 58) > 0.22) {
			const bandCount = 1 + Math.floor(hash(seed, 59) * 3);
			ctx.fillStyle = hr('#D0F8F0', opacity * (0.09 + skylineProgress * 0.10));
			for (let b = 0; b < bandCount; b++) {
				const y = baseY - h * (0.20 + 0.58 * ((b + 1) / (bandCount + 1)));
				const bw = baseW * (0.28 + hash(seed, 60 + b) * 0.30);
				const bh = 1 + skylineProgress * 2.0;
				ctx.fillRect(bx - bw * 0.5, y - bh * 0.5, bw, bh);
			}
		}

		// Edge glint
		if (h > ridgeH * 0.24 && hash(seed, 41) > 0.30) {
			ctx.strokeStyle = hr(color, opacity * 0.6);
			ctx.lineWidth = (0.5 + hash(seed, 42) * 0.9) * (0.9 + skylineProgress * 1.1);
			ctx.beginPath();
			ctx.moveTo(bx - baseW * 0.18, baseY - h * 0.10);
			ctx.lineTo(topX - topW * 0.06, topY + 2);
			ctx.stroke();
		}
	}

	// Ascending shard particles — scale with zoom
	const ascendCount = 45;
	for (let i = 0; i < ascendCount; i++) {
		const seed = i + 6000;
		const cycle = (time * 0.3 + hash(seed, 0) * 40) % 1;
		const life = cycle;

		const spreadBase = (hash(seed, 1) - 0.5) * 2;
		const distFromCenter = Math.abs(spreadBase);
		const centralWeight = 1 - distFromCenter * 0.7;
		if (centralWeight < 0.15) continue;

		const sx = centerX + spreadBase * W * (0.06 + life * 0.12) * zoom;
		const sy = gateOriginY - life * ridgeH * (1.2 + hash(seed, 2) * 0.8) - hash(seed, 3) * 10;

		// Skip off-screen particles
		if (sy < -50 || sy > H + 50) continue;

		const lifeCurve = Math.sin(life * Math.PI);
		const sz = (2 + hash(seed, 4) * 6) * lifeCurve * centralWeight * Math.min(zoom, 2.5);
		if (sz < 0.5) continue;

		const angle = hash(seed, 5) * Math.PI * 2 + time * 0.6 * (hash(seed, 6) - 0.5);

		const fadeIn = clamp(life * 5, 0, 1);
		const fadeOut = clamp((1 - life) * 3, 0, 1);
		const baseOpacity = fadeIn * fadeOut * centralWeight;

		const cr = hash(seed, 7);
		let color: string;
		if (centralWeight > 0.7) {
			const colors = ['#FFFFFF', '#D0F8F0', '#A0F0E8', '#80E0D4', '#58C0B4'];
			const idx = Math.floor(cr * colors.length);
			color = colors[Math.min(idx, colors.length - 1)];
		} else {
			const colors = ['#80E0D4', '#58C0B4', '#3D94C4', '#3A8A7A'];
			const idx = Math.floor(cr * colors.length);
			color = colors[Math.min(idx, colors.length - 1)];
		}

		const shimmer = Math.sin(time * 3 + seed * 1.7) * 0.3 + 0.7;
		const opacity = baseOpacity * (0.06 + hash(seed, 8) * 0.14) * shimmer * breath1 * intensity;

		ctx.save();
		ctx.translate(sx, sy);
		ctx.rotate(angle);
		ctx.fillStyle = hr(color, opacity);
		ctx.beginPath();
		const nv = 3 + Math.floor(hash(seed, 9) * 3);
		for (let v = 0; v < nv; v++) {
			const a = (v / nv) * Math.PI * 2;
			const rx = sz * (0.6 + hash(seed, 11) * 0.5) * (0.4 + hash(seed * 7 + v, 10) * 0.7);
			const ry = sz * (1 + hash(seed, 12) * 0.8) * (0.4 + hash(seed * 7 + v, 10) * 0.7);
			if (v === 0) ctx.moveTo(Math.cos(a) * rx, Math.sin(a) * ry);
			else ctx.lineTo(Math.cos(a) * rx, Math.sin(a) * ry);
		}
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}

	// Light spill onto ground — scales with zoom
	const spillHeight = H * 0.18 * zoom;
	const spill = ctx.createLinearGradient(0, gateOriginY, 0, gateOriginY + spillHeight);
	spill.addColorStop(0, hr('#58C0B4', 0.02 * breath1 * intensity));
	spill.addColorStop(0.3, hr('#58C0B4', 0.008 * breath1 * intensity));
	spill.addColorStop(1, 'transparent');
	ctx.fillStyle = spill;
	const spillW = W * 0.6 * zoom;
	ctx.fillRect(centerX - spillW / 2, gateOriginY, spillW, spillHeight);
}
