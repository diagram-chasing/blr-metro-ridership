<script>
	import { getContrastingTextColor } from './colorScales';
	import { formatCellValue } from './table-utils.js';

	let { value, column, colorScale, row } = $props();

	// Calculate color intensity for color-coded cells
	let colorIntensity = $derived.by(() => {
		if (!column.colorScale || !colorScale || value === null || value === undefined) return 0;
		return colorScale.getIntensity(value);
	});

	// Format value based on column type
	let formattedValue = $derived.by(() => {
		return formatCellValue(value, column);
	});

	// Get background color using D3 color scale
	let backgroundColor = $derived.by(() => {
		if (!column.colorScale || !colorScale) return null;
		return colorScale.getColor(value);
	});

	// Get text color for better contrast on colored backgrounds
	let textColor = $derived.by(() => {
		if (!backgroundColor) return null;
		return getContrastingTextColor(backgroundColor);
	});

	// Check if this cell should be a link
	let isLinkCell = $derived(column.isLink && row && column.linkField && row[column.linkField]);

	// Build link href if this is a link cell
	let linkHref = $derived.by(() => {
		if (!isLinkCell) return null;
		const linkValue = row[column.linkField];
		const prefix = column.linkPrefix || '';
		return `${prefix}${linkValue}`;
	});
</script>

<td
	class="table-cell"
	class:color-coded={column.colorScale}
	class:numeric={column.type === 'number' || column.type === 'percentage'}
	class:high-contrast={column.colorScale && colorIntensity > 0.6}
	class:grouped={column.group !== undefined}
	style={backgroundColor
		? `background-color: ${backgroundColor}; ${textColor ? `color: ${textColor}` : ''}`
		: ''}
>
	{#if column.type === 'percentage' && column.showBar !== false && !column.colorScale}
		<div class="percentage-cell">
			<span class="percentage-value">{formattedValue}</span>
			<div class="percentage-bar">
				<div
					class="percentage-fill"
					class:orange={column.barColor === 'orange'}
					class:blue={column.barColor === 'blue'}
					class:green={column.barColor === 'green'}
					style={`width: ${Math.min(Number(value) || 0, 100)}%`}
				></div>
			</div>
		</div>
	{:else if isLinkCell}
		<a href={linkHref} class="cell-link" class:bold={column.bold}>
			{formattedValue}
		</a>
	{:else}
		<span class="cell-content" class:bold={column.bold}>
			{formattedValue}
		</span>
	{/if}
</td>

<style>
	@import './table-styles.css';

	/* TableCell-specific styles */

	.percentage-cell {
		display: flex;
		align-items: center;
		gap: clamp(0.25rem, 1cqw, 0.375rem);
		flex-wrap: nowrap;
	}

	.percentage-value {
		font-weight: 600;
		min-width: clamp(2rem, 6cqw, 2.5rem);
		color: var(--color-sepia-brown);
		font-variant-numeric: tabular-nums;
		font-size: clamp(0.625rem, 1.2cqw + 0.4rem, 0.75rem);
	}

	.percentage-bar {
		flex: 1;
		background: var(--color-sepia-dark);
		border-radius: 1px;
		height: clamp(0.1875rem, 0.6cqw, 0.25rem);
		max-width: clamp(45px, 15cqw, 60px);
		min-width: 30px;
		overflow: hidden;
		box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.1);
	}

	.percentage-fill {
		height: 100%;
		background: var(--color-red);
		border-radius: 1px;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
	}

	.percentage-fill::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.2) 50%,
			transparent 100%
		);
		animation: shimmer 2s infinite;
	}

	.percentage-fill.orange {
		background: var(--color-yellow);
	}

	.percentage-fill.blue {
		background: var(--color-blue);
	}

	.percentage-fill.green {
		background: var(--color-green);
	}

	@keyframes shimmer {
		0% {
			transform: translateX(-100%);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translateX(100%);
			opacity: 0;
		}
	}

	/* Container query breakpoints */
	@container table (max-width: 400px) {
		.percentage-value {
			font-size: clamp(0.75rem, 1.3cqw + 0.4rem, 0.85rem);
			min-width: clamp(1.8rem, 6cqw, 2.2rem);
		}

		.percentage-bar {
			max-width: clamp(40px, 14cqw, 50px);
			min-width: 30px;
		}
	}

	@container table (max-width: 280px) {
		.percentage-cell {
			gap: clamp(0.25rem, 1cqw, 0.35rem);
		}

		.percentage-value {
			font-size: clamp(0.7rem, 1.1cqw + 0.35rem, 0.8rem);
			min-width: clamp(1.6rem, 5cqw, 1.8rem);
		}

		.percentage-bar {
			max-width: clamp(35px, 12cqw, 40px);
			min-width: 25px;
			height: clamp(0.15rem, 0.5cqw, 0.2rem);
		}
	}
</style>
