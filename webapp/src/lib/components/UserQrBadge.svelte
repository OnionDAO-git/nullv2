<script lang="ts">
	import QRCode from 'qrcode';

	let { userId, size = 180 }: { userId: string; size?: number } = $props();

	let canvasEl: HTMLCanvasElement | undefined = $state();

	$effect(() => {
		if (!canvasEl) return;
		QRCode.toCanvas(canvasEl, userId, {
			width: size,
			margin: 1,
			color: { dark: '#1A1714', light: '#EDE8E0' }
		}).catch((err) => {
			console.error('[qr] render failed:', err);
		});
	});
</script>

<div class="qr">
	<canvas bind:this={canvasEl} class="qr__canvas" aria-label="Your check-in QR code"></canvas>
	<p class="qr__hint">Show this to an admin to check in at events.</p>
</div>

<style>
	.qr {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 14px;
		background: var(--od-chalk, #ede8e0);
		border: 1px solid var(--od-plaster, #d8d0c4);
		border-radius: 3px 10px 3px 10px;
	}
	.qr__canvas {
		display: block;
		max-width: 100%;
		height: auto;
	}
	.qr__hint {
		font-family: var(--mono, 'Space Mono', monospace);
		font-size: 9px;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--od-slate, #8a7e6a);
		text-align: center;
		margin: 0;
		line-height: 1.5;
	}
</style>
