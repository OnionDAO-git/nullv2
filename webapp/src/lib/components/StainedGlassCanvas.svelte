<script lang="ts">
	import { buildGlass, perturbPoly, shrinkPoly, VOID, CHALK, type GlassCell } from '$lib/stained-glass';

	let {
		width,
		height,
		photoZone,
		variant = 'dark',
		monogram = '?',
		avatarUrl = ''
	}: {
		width: number;
		height: number;
		photoZone: { x: number; y: number; w: number; h: number };
		variant?: 'dark' | 'light';
		monogram?: string;
		avatarUrl?: string;
	} = $props();

	let avatarImg: HTMLImageElement | null = $state(null);

	$effect(() => {
		if (!avatarUrl) {
			avatarImg = null;
			return;
		}
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => { avatarImg = img; };
		img.src = avatarUrl;
	});

	let canvas: HTMLCanvasElement;

	const glass = $derived(buildGlass(photoZone.w, photoZone.h, 62, 34, 17));

	$effect(() => {
		if (!canvas) return;
		const ctx = canvas.getContext('2d')!;
		let t = 0;
		let animFrame: number;

		const currentGlass = glass;
		const pz = photoZone;
		const w = width;
		const h = height;
		const isDark = variant === 'dark';
		const mono = monogram;
		const cachedAvatarImg = avatarImg;

		function draw() {
			t += 0.0105;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}

			if (isDark) {
				ctx.fillStyle = VOID;
			} else {
				ctx.fillStyle = '#E4DED4';
			}
			ctx.fillRect(0, 0, w, h);

			if (!isDark) {
				ctx.fillStyle = '#D8D0C4';
				ctx.globalAlpha = 0.22;
				if (h > w) {
					ctx.fillRect(0, pz.h, w, h - pz.h);
				} else {
					ctx.fillRect(pz.w, 0, w - pz.w, h);
				}
				ctx.globalAlpha = 1;
			}

			if (isDark) {
				ctx.fillStyle = '#1c1814';
			} else {
				ctx.fillStyle = '#E4DED4';
			}
			ctx.fillRect(pz.x, pz.y, pz.w, pz.h);

			if (cachedAvatarImg) {
				const centerX = pz.x + pz.w / 2;
				const centerY = pz.y + pz.h / 2;
				const radius = Math.min(pz.w, pz.h) * 0.44;
				ctx.save();
				ctx.beginPath();
				ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
				ctx.clip();
				ctx.globalAlpha = 0.85;
				const avatarSize = radius * 2;
				ctx.drawImage(cachedAvatarImg, centerX - radius, centerY - radius, avatarSize, avatarSize);
				ctx.restore();
				ctx.globalAlpha = 1;
			} else {
				ctx.globalAlpha = isDark ? 0.1 : 0.08;
				ctx.fillStyle = isDark ? CHALK : '#1A1714';
				const fontSize = h > w ? 130 : 88;
				ctx.font = `900 ${fontSize}px Outfit`;
				ctx.textAlign = 'center';
				ctx.textBaseline = 'middle';
				ctx.fillText(mono, pz.x + pz.w / 2, pz.y + pz.h / 2);
				ctx.globalAlpha = 1;
			}

			const lx1 = pz.x + pz.w * 0.5 + Math.sin(t * 0.675) * pz.w * 0.48;
			const ly1 = pz.y + pz.h * 0.45 + Math.sin(t * 0.45) * pz.h * 0.38;
			const lx2 = pz.x + pz.w * 0.5 + Math.sin(t * 0.525 + 2.1) * pz.w * 0.42;
			const ly2 = pz.y + pz.h * 0.5 + Math.sin(t * 0.825 + 1.3) * pz.h * 0.36;
			const maxR = Math.max(pz.w, pz.h) * 0.65;

			for (const g of currentGlass) {
				const d1 = Math.hypot(g.cx + pz.x - lx1, g.cy + pz.y - ly1);
				const d2 = Math.hypot(g.cx + pz.x - lx2, g.cy + pz.y - ly2);
				const lit = Math.max(0, 1 - Math.min(d1, d2) / maxR);
				const litQ = lit * lit;
				const [r, gb, b] = g.color;

				let brightness: number, alpha: number;
				if (isDark) {
					brightness = 0.45 + litQ * 0.65;
					alpha = 0.42 - litQ * 0.2;
				} else {
					brightness = 0.75 + litQ * 0.3;
					alpha = 0.4 - litQ * 0.22;
				}

				const fr = Math.min(255, r * brightness) | 0;
				const fg = Math.min(255, gb * brightness) | 0;
				const fb = Math.min(255, b * brightness) | 0;

				const cellSize = Math.sqrt(
					g.poly.reduce((a, p, i, arr) => {
						const n = arr[(i + 1) % arr.length];
						return (
							a +
							Math.abs(
								(p[0] - g.cx) * (n[1] - g.cy) - (n[0] - g.cx) * (p[1] - g.cy)
							)
						);
					}, 0) / 2
				);
				const grout = isDark
					? Math.min(1.6, cellSize * 0.055)
					: Math.min(1.8, cellSize * 0.06);
				const perturbed = perturbPoly(g.poly, 2.0);
				const shrunken = shrinkPoly(perturbed, grout);
				if (!shrunken || shrunken.length < 3) continue;

				const verts = shrunken.map(([x, y]) => [x + pz.x, y + pz.y]);
				ctx.beginPath();
				ctx.moveTo(verts[0][0], verts[0][1]);
				for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i][0], verts[i][1]);
				ctx.closePath();
				ctx.fillStyle = `rgba(${fr},${fg},${fb},${alpha.toFixed(2)})`;
				ctx.fill();
			}

			let grd: CanvasGradient;
			if (isDark) {
				if (h > w) {
					grd = ctx.createLinearGradient(0, pz.h * 0.68, 0, h);
					grd.addColorStop(0, 'rgba(14,12,10,0)');
					grd.addColorStop(0.2, 'rgba(14,12,10,0.75)');
					grd.addColorStop(0.42, 'rgba(14,12,10,0.96)');
					grd.addColorStop(1, 'rgba(14,12,10,0.99)');
					ctx.fillStyle = grd;
					ctx.fillRect(0, pz.h * 0.68, w, h - pz.h * 0.68);
				} else {
					grd = ctx.createLinearGradient(pz.w * 0.68, 0, w, 0);
					grd.addColorStop(0, 'rgba(14,12,10,0)');
					grd.addColorStop(0.2, 'rgba(14,12,10,0.75)');
					grd.addColorStop(0.42, 'rgba(14,12,10,0.96)');
					grd.addColorStop(1, 'rgba(14,12,10,0.99)');
					ctx.fillStyle = grd;
					ctx.fillRect(pz.w * 0.68, 0, w - pz.w * 0.68, h);
				}
			} else {
				const PARCH = '228,222,212';
				if (h > w) {
					grd = ctx.createLinearGradient(0, pz.h * 0.68, 0, h);
					grd.addColorStop(0, `rgba(${PARCH},0)`);
					grd.addColorStop(0.22, `rgba(${PARCH},0.82)`);
					grd.addColorStop(0.44, `rgba(${PARCH},0.98)`);
					grd.addColorStop(1, `rgba(${PARCH},1)`);
					ctx.fillStyle = grd;
					ctx.fillRect(0, pz.h * 0.68, w, h - pz.h * 0.68);
				} else {
					grd = ctx.createLinearGradient(pz.w * 0.68, 0, w, 0);
					grd.addColorStop(0, `rgba(${PARCH},0)`);
					grd.addColorStop(0.22, `rgba(${PARCH},0.82)`);
					grd.addColorStop(0.44, `rgba(${PARCH},0.98)`);
					grd.addColorStop(1, `rgba(${PARCH},1)`);
					ctx.fillStyle = grd;
					ctx.fillRect(pz.w * 0.68, 0, w - pz.w * 0.68, h);
				}
			}

			animFrame = requestAnimationFrame(draw);
		}

		draw();

		return () => cancelAnimationFrame(animFrame);
	});
</script>

<canvas bind:this={canvas} width={width} height={height} class="stained-glass"></canvas>

<style>
	.stained-glass {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
</style>
