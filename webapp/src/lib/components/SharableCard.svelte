<script lang="ts">
	import StainedGlassCanvas from './StainedGlassCanvas.svelte';
	import ShardLine from './ShardLine.svelte';
	import SkylineSvg from './SkylineSvg.svelte';

	let {
		name = 'Your Name',
		handle = '@handle',
		avatarUrl = ''
	}: {
		name?: string;
		handle?: string;
		avatarUrl?: string;
	} = $props();

	let cardEl: HTMLElement;
	let containerEl: HTMLElement;
	let cardWidth = $state(380);

	const width = $derived(cardWidth);
	const height = $derived(Math.round(cardWidth * (675 / 380)));
	const photoZone = $derived({ x: 0, y: 0, w: width, h: Math.round(height * 0.58) });

	$effect(() => {
		if (!containerEl) return;
		const ro = new ResizeObserver((entries) => {
			const w = entries[0].contentRect.width;
			cardWidth = Math.min(380, Math.max(280, w));
		});
		ro.observe(containerEl);
		return () => ro.disconnect();
	});

	const monogram = $derived(
		name && name !== 'Your Name'
			? name
					.trim()
					.split(/\s+/)
					.map((w) => w[0])
					.slice(0, 2)
					.join('')
					.toUpperCase()
			: '?'
	);

	const displayHandle = $derived(
		handle ? (handle.startsWith('@') ? handle : `@${handle}`) : '@handle'
	);

	export function getCardElement(): HTMLElement {
		return cardEl;
	}
</script>

<div class="card-container" bind:this={containerEl}>
	<div
		class="card"
		bind:this={cardEl}
		style="width: {width}px; height: {height}px;"
	>
		<StainedGlassCanvas {width} {height} {photoZone} variant="dark" {monogram} {avatarUrl} />

		<div class="p-lay">
			<div class="p-photo-spacer"></div>
			<div class="p-text">
				<div class="p-accepted">Accepted &middot; June 2026</div>
				<div class="p-name-block">
					<div class="p-name">{name}</div>
					<div class="p-handle">{displayHandle}</div>
				</div>
				<div class="p-foot">
					<ShardLine />
					<div class="p-brand">
						<div class="p-brand-name">Onion DAO</div>
						<div class="p-brand-loc">
							Chicago, Illinois<br />oniondao.dev
						</div>
					</div>
					<SkylineSvg variant="dark" orientation="portrait" />
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.card-container {
		width: 100%;
		max-width: 380px;
		display: flex;
		justify-content: center;
	}

	.card {
		position: relative;
		overflow: hidden;
		flex-shrink: 0;
		box-shadow: 0 40px 100px rgba(0, 0, 0, 0.85);
	}

	.p-lay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		pointer-events: none;
		z-index: 10;
		transition: opacity 0.25s;
	}

	.p-photo-spacer {
		flex: 0 0 58%;
	}

	.p-text {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 18px 24px 0;
	}

	.p-accepted {
		font-family: 'Space Mono', monospace;
		font-size: 8px;
		letter-spacing: 0.42em;
		text-transform: uppercase;
		color: var(--s-teal);
		flex-shrink: 0;
	}

	.p-name-block {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 8px 0;
	}

	.p-name {
		font-family: 'Outfit', sans-serif;
		font-weight: 900;
		font-size: 42px;
		letter-spacing: -0.03em;
		line-height: 0.95;
		word-break: break-word;
		color: #ede8e0;
	}

	.p-handle {
		margin-top: 6px;
		font-family: 'Space Mono', monospace;
		font-size: 9px;
		letter-spacing: 0.14em;
		color: rgba(237, 232, 224, 0.42);
	}

	.p-foot {
		flex-shrink: 0;
	}

	.p-brand {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 0 7px;
	}

	.p-brand-name {
		font-family: 'Space Mono', monospace;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.36em;
		text-transform: uppercase;
		color: rgba(237, 232, 224, 0.58);
	}

	.p-brand-loc {
		font-family: 'Space Mono', monospace;
		font-size: 7px;
		letter-spacing: 0.18em;
		text-align: right;
		line-height: 1.65;
		color: rgba(237, 232, 224, 0.3);
	}
</style>
