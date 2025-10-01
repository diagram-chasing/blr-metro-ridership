<script>
	import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-svelte';

	let { columns, columnGroups, sortColumn, sortDirection, onSort, sortEnabled = false } = $props();

	// Get sort icon for a column
	function getSortIcon(columnKey) {
		if (sortColumn !== columnKey) return ArrowUpDown;
		if (sortDirection === 'asc') return ArrowUp;
		if (sortDirection === 'desc') return ArrowDown;
		return ArrowUpDown;
	}

	// Get sort icon opacity
	function getSortOpacity(columnKey) {
		return sortColumn === columnKey && sortDirection !== 'none' ? 1 : 0.4;
	}

	// Calculate group spans and positions
	let groupInfo = $derived.by(() => {
		if (!columnGroups) return null;

		const groups = [];

		// Add empty cell for first column if it's not grouped
		const firstColumn = columns[0];
		if (firstColumn.group === undefined) {
			groups.push({ type: 'empty' });
		}

		columnGroups.forEach((group) => {
			groups.push({
				type: 'group',
				label: group.label,
				span: group.span
			});
		});

		return groups;
	});
</script>

<thead class="table-head">
	{#if columnGroups && columnGroups.length > 0}
		<!-- Column Groups Row -->
		<tr class="group-header-row">
			{#if groupInfo}
				{#each groupInfo as group}
					{#if group.type === 'empty'}
						<th class="group-header-empty"></th>
					{:else}
						<th class="group-header-cell" colspan={group.span}>
							{group.label}
						</th>
					{/if}
				{/each}
			{/if}
		</tr>
	{/if}

	<!-- Individual Column Headers -->
	<tr class="column-header-row">
		{#each columns as column}
			<th
				class="table-header-cell"
				class:sortable={sortEnabled}
				class:numeric={column.type === 'number' || column.type === 'percentage'}
				class:grouped={column.group !== undefined}
				class:first-in-group={column.group !== undefined &&
					columns.findIndex((/** @type {any} */ c) => c.group === column.group) ===
						columns.indexOf(column)}
				class:active={sortEnabled && sortColumn === column.key}
				role={sortEnabled ? 'button' : null}
				tabindex={sortEnabled ? '0' : null}
				onclick={sortEnabled ? () => onSort(column.key) : null}
				onkeydown={sortEnabled ? (e) => e.key === 'Enter' && onSort(column.key) : null}
			>
				<div class="header-content">
					<span class="header-label">{column.label}</span>
					{#if sortEnabled}
						{@const Icon = getSortIcon(column.key)}
						<Icon size={10} class="sort-icon" style="opacity: {getSortOpacity(column.key)}" />
					{/if}
				</div>
			</th>
		{/each}
	</tr>
</thead>

<style>
	@import './table-styles.css';

	.group-header-cell:not(:last-child) {
		margin-right: clamp(0.1875rem, 0.6cqw, 0.25rem);
		border-right: clamp(0.375rem, 1.3cqw, 0.55rem) solid var(--color-sepia-light);
	}

	.group-header-cell:last-child::after {
		right: 0;
	}

	.table-header-cell:nth-child(1) {
		width: clamp(80px, 25%, 140px);
		min-width: 80px;
	}

	.table-header-cell:nth-child(2) {
		width: auto;
		min-width: clamp(120px, 35%, 200px);
	}

	.table-header-cell:nth-child(3) {
		width: clamp(60px, 15%, 100px);
		min-width: 60px;
	}

	.table-header-cell:nth-child(4) {
		width: clamp(80px, 20%, 120px);
		min-width: 80px;
	}

	@container table (max-width: 280px) {
		.group-header-cell:not(:last-child) {
			margin-right: clamp(0.125rem, 0.4cqw, 0.1875rem);
			border-right: clamp(0.25rem, 1cqw, 0.375rem) solid var(--color-sepia-light);
		}
	}
</style>
