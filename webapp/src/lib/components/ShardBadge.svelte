<script lang="ts">
	let {
		color,
		size = 'default'
	}: {
		color: string | null;
		size?: 'small' | 'default';
	} = $props();

	const colorVar = $derived(color ? `var(--s-${color.replace('shard-', '')})` : 'var(--ground-4)');
	const label = $derived(color ?? 'unassigned');
</script>

<span
	class="shard-badge"
	class:shard-badge--small={size === 'small'}
	style:--badge-color={colorVar}
>
	{label}
</span>

<style>
	.shard-badge {
		display: inline-flex;
		align-items: center;
		height: 22px;
		padding: 0 10px;
		border-radius: 2px 6px 2px 6px;
		font-family: var(--mono);
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--badge-color);
		border: 1px solid var(--badge-color);
		background: transparent;
		flex-shrink: 0;
	}

	.shard-badge--small {
		height: 18px;
		padding: 0 6px;
		font-size: 8px;
	}
</style>
