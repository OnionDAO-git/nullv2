<script lang="ts">
	let {
		variant = 'dark',
		orientation = 'portrait'
	}: {
		variant?: 'dark' | 'light';
		orientation?: 'portrait' | 'landscape';
	} = $props();

	const fill = $derived(variant === 'dark' ? '#EDE8E0' : '#1A1714');
	const opacity = $derived(variant === 'dark' ? '0.28' : '0.17');
	const strokeColor = $derived(
		variant === 'dark' ? 'rgba(237,232,224,0.44)' : 'rgba(26,23,20,0.32)'
	);
</script>

<div class="skyline-wrap">
	{#if orientation === 'portrait'}
		<svg
			class="skyline-svg"
			viewBox="0 0 380 96"
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMax meet"
		>
			<path
				{fill}
				{opacity}
				d="M0,96 V78 H12 V72 H26 V64 H36 V60 H42 V56 H44 V60 H52 V58 H58 V52 H62 V50 H65 V44 H68 V50 H72 V30 H86 V26 H82 V22 H86 V30 H92 V54 H110 V46 H122 V50 H132 V62 H136 V48 H140 V34 H141 V18 H144 V4 H145 V0 H146.5 V4 H149 V18 H151 V18 H154 V6 H155.5 V2 H157 V6 H157 V18 H159 V34 H160 V48 H164 V62 H168 V40 H170 V30 H172 V22 H174 V16 H176 V10 H178 V16 H180 V22 H182 V30 H184 V40 H186 V50 H202 V56 H212 V48 H228 V78 H230 L237,22 H253 L258,78 H262 V32 H264 V38 H276 V54 H294 V60 H308 V56 H326 V64 H334 V58 H340 V64 H348 V68 H356 V72 H362 V76 H380 V96 Z"
			/>
			<rect x="143.5" y="0" width="1.5" height="4" {fill} {opacity} />
			<rect x="155" y="2" width="1.5" height="4" {fill} {opacity} />
			<line x1="237" y1="22" x2="258" y2="78" stroke={strokeColor} stroke-width="1.1" />
			<line x1="253" y1="22" x2="230" y2="78" stroke={strokeColor} stroke-width="1.1" />
		</svg>
	{:else}
		<svg
			class="skyline-svg"
			viewBox="0 0 370 80"
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMax meet"
		>
			<path
				{fill}
				{opacity}
				d="M0,80 V64 H10 V58 H24 V52 H34 V54 H40 V46 H54 V26 H58 V22 H60 V26 H66 V40 H78 V44 H90 V52 H92 V40 H96 V28 H97 V14 H100 V4 H101 V1 H102.5 V4 H104 V14 H106 V14 H109 V6 H110 V3 H111.5 V6 H113 V14 H115 V28 H116 V40 H118 V52 H120 V36 H122 V28 H124 V20 H126 V14 H128 V20 H130 V28 H132 V36 H134 V44 H148 V50 H160 V68 L168,14 H184 L190,68 H192 V32 H194 V26 H208 V44 H222 V50 H236 V56 H252 V60 H258 V64 H270 V60 H276 V68 H286 V64 H292 V68 H300 V72 H310 V68 H318 V72 H370 V80 Z"
			/>
			<rect x="99.5" y="1" width="1.5" height="3" {fill} {opacity} />
			<rect x="110.5" y="3" width="1.5" height="3" {fill} {opacity} />
			<line x1="168" y1="14" x2="190" y2="68" stroke={strokeColor} stroke-width="1.0" />
			<line x1="184" y1="14" x2="160" y2="68" stroke={strokeColor} stroke-width="1.0" />
		</svg>
	{/if}
</div>

<style>
	.skyline-wrap {
		display: block;
		width: 100%;
		flex-shrink: 0;
	}

	.skyline-svg {
		display: block;
		width: 100%;
	}
</style>
