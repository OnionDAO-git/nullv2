<script lang="ts">
	let {
		cardElement = null,
		orientation = 'portrait',
		variant = 'dark'
	}: {
		cardElement?: HTMLElement | null;
		orientation?: 'portrait' | 'landscape';
		variant?: 'dark' | 'light';
	} = $props();

	let toastMessage = $state('');
	let toastVisible = $state(false);

	function showToast(msg: string) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 2800);
	}

	async function captureCard(): Promise<HTMLCanvasElement | null> {
		if (!cardElement) return null;

		try {
			const { default: html2canvas } = await import('html2canvas');
			const isLandscape = orientation === 'landscape';
			return await html2canvas(cardElement, {
				scale: 2,
				useCORS: true,
				allowTaint: true,
				backgroundColor: null,
				width: isLandscape ? 675 : 380,
				height: isLandscape ? 380 : 675,
				logging: false
			});
		} catch {
			showToast('Capture failed — try again');
			return null;
		}
	}

	function flashCard() {
		if (!cardElement) return;
		const flash = document.createElement('div');
		flash.style.cssText =
			'position:absolute;inset:0;background:rgba(237,232,224,0.18);opacity:0;pointer-events:none;z-index:100;transition:opacity 0.12s;';
		cardElement.appendChild(flash);
		requestAnimationFrame(() => {
			flash.style.opacity = '1';
			setTimeout(() => {
				flash.style.opacity = '0';
			}, 120);
			setTimeout(() => cardElement?.removeChild(flash), 300);
		});
	}

	async function share(platform: string) {
		const canvas = await captureCard();
		if (!canvas) return;
		flashCard();

		const filename = `oniondao-acceptance.png`;
		const shareText = `I'm in. @oniondao June 2026 — Chicago. oniondao.dev`;
		const shareUrl = 'https://oniondao.dev';

		if (platform === 'download') {
			const a = document.createElement('a');
			a.href = canvas.toDataURL('image/png');
			a.download = filename;
			a.click();
			showToast('Saved');
			return;
		}

		if (platform === 'copy') {
			try {
				canvas.toBlob(async (blob) => {
					if (!blob) return;
					await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
					showToast('Image copied to clipboard');
				}, 'image/png');
			} catch {
				const a = document.createElement('a');
				a.href = canvas.toDataURL('image/png');
				a.download = filename;
				a.click();
				showToast('Clipboard unavailable — saved instead');
			}
			return;
		}

		if (platform === 'x') {
			const a = document.createElement('a');
			a.href = canvas.toDataURL('image/png');
			a.download = filename;
			a.click();
			setTimeout(() => {
				const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
				window.open(tweetUrl, '_blank', 'width=600,height=400');
			}, 400);
			showToast('Image saved — attach it to your post');
			return;
		}

		if (platform === 'instagram') {
			const a = document.createElement('a');
			a.href = canvas.toDataURL('image/png');
			a.download = filename;
			a.click();
			setTimeout(() => {
				const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
				window.open(
					isMobile ? 'instagram://story-camera' : 'https://www.instagram.com',
					'_blank'
				);
			}, 500);
			showToast('Image saved — upload it to Instagram');
			return;
		}

		if (platform === 'facebook') {
			const a = document.createElement('a');
			a.href = canvas.toDataURL('image/png');
			a.download = filename;
			a.click();
			setTimeout(() => {
				window.open(
					`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
					'_blank',
					'width=600,height=500'
				);
			}, 400);
			showToast('Image saved — attach it to your Facebook post');
			return;
		}

		if (platform === 'native') {
			canvas.toBlob(async (blob) => {
				if (!blob) return;
				const file = new File([blob], filename, { type: 'image/png' });
				try {
					if (navigator.canShare && navigator.canShare({ files: [file] })) {
						await navigator.share({
							files: [file],
							title: 'OnionDAO June 2026',
							text: shareText
						});
					} else {
						await navigator.share({
							title: 'OnionDAO June 2026',
							text: shareText,
							url: shareUrl
						});
					}
				} catch (e) {
					if (e instanceof Error && e.name !== 'AbortError') showToast('Share failed');
				}
			}, 'image/png');
		}
	}

	const hasNativeShare = $derived(typeof navigator !== 'undefined' && 'share' in navigator);
</script>

<div class="share-bar" class:light={variant === 'light'}>
	<button class="share-btn primary" onclick={() => share('download')} title="Save as image">
		<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 16 16"><path d="M8 2v9M4 8l4 4 4-4M2 13h12" /></svg>
	</button>
	<button class="share-btn" onclick={() => share('copy')} title="Copy to clipboard">
		<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 16 16"><rect x="5" y="5" width="9" height="9" rx="1" /><path d="M11 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v7a1 1 0 001 1h2" /></svg>
	</button>
	<button class="share-btn" onclick={() => share('x')} title="Post to X">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
	</button>
	<button class="share-btn" onclick={() => share('instagram')} title="Share on Instagram">
		<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4.5" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
	</button>
	<button class="share-btn" onclick={() => share('facebook')} title="Share on Facebook">
		<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
	</button>
	{#if hasNativeShare}
		<button class="share-btn" onclick={() => share('native')} title="Share">
			<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="M8 13.5l8 4M16 6.5l-8 4" /></svg>
		</button>
	{/if}
</div>

<!-- Toast -->
<div class="share-toast" class:show={toastVisible}>{toastMessage}</div>

<style>
	.share-bar {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 14px 0 4px;
	}

	.share-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		padding: 0;
		border: 1px solid rgba(237, 232, 224, 0.14);
		border-radius: 6px;
		background: transparent;
		color: rgba(237, 232, 224, 0.42);
		cursor: pointer;
		transition: all 0.18s;
	}

	.share-btn:hover {
		color: rgba(237, 232, 224, 0.85);
		border-color: rgba(237, 232, 224, 0.28);
		background: rgba(237, 232, 224, 0.04);
	}

	.share-btn :global(svg) {
		flex-shrink: 0;
		opacity: 0.7;
	}

	.share-btn:hover :global(svg) {
		opacity: 1;
	}

	.share-btn.primary {
		border-color: rgba(237, 232, 224, 0.28);
		color: rgba(237, 232, 224, 0.72);
	}

	.share-btn.primary:hover {
		background: rgba(237, 232, 224, 0.08);
		color: rgba(237, 232, 224, 1);
	}

	.share-toast {
		position: fixed;
		bottom: 28px;
		left: 50%;
		transform: translateX(-50%) translateY(20px);
		background: rgba(26, 23, 20, 0.96);
		border: 1px solid rgba(237, 232, 224, 0.14);
		color: rgba(237, 232, 224, 0.85);
		font-family: var(--mono, 'Space Mono', monospace);
		font-size: 8px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		padding: 10px 20px;
		opacity: 0;
		transition: all 0.22s;
		pointer-events: none;
		z-index: 9999;
	}

	.share-toast.show {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}

	/* ── Light variant ── */
	.share-bar.light .share-btn {
		border-color: var(--od-plaster, #D8D0C4);
		color: var(--od-slate, #8A7E6A);
	}

	.share-bar.light .share-btn:hover {
		color: var(--od-ink, #1A1714);
		border-color: var(--od-slate, #8A7E6A);
		background: rgba(26, 23, 20, 0.04);
	}

	.share-bar.light .share-btn.primary {
		border-color: var(--od-slate, #8A7E6A);
		color: var(--od-ink-3, #4A4438);
	}

	.share-bar.light .share-btn.primary:hover {
		color: var(--od-ink, #1A1714);
		background: rgba(26, 23, 20, 0.08);
	}
</style>
