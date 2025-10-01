<script lang="ts">
	import { Plot, Cell, HTMLTooltip, AxisY, Text } from 'svelteplot';
	import { scaleQuantile } from 'd3-scale';
	import heatmapData from '$lib/data/charts/07-station-heatmaps.json';

	interface Props {
		dayType: 'weekday' | 'weekend';
		visible?: boolean;
	}

	let { dayType, visible = true }: Props = $props();

	interface HeatmapData {
		Station: string;
		Hour: number;
		hourly_ratio: number;
		day_type: string;
		sortOrder?: number;
		compareValue?: number;
	}

	// Memoize expensive calculations to prevent re-computation on tab switches
	const processedData = (() => {
		const stationTotals = new Map<string, number>();
		heatmapData[0].forEach((d: HeatmapData) => {
			const current = stationTotals.get(d.Station) || 0;
			stationTotals.set(d.Station, current + d.hourly_ratio);
		});

		const sortedStations = Array.from(stationTotals.entries())
			.sort((a, b) => b[1] - a[1])
			.map((d) => d[0]);

		// Create lookup maps for cross-day comparison
		const weekdayLookup = new Map<string, number>();
		const weekendLookup = new Map<string, number>();

		heatmapData[0].forEach((d: HeatmapData) => {
			const key = `${d.Station}-${d.Hour}`;
			if (d.day_type === 'Weekday') {
				weekdayLookup.set(key, d.hourly_ratio);
			} else {
				weekendLookup.set(key, d.hourly_ratio);
			}
		});

		const weekdayData = heatmapData[0]
			.filter((d: HeatmapData) => d.day_type === 'Weekday')
			.map((d: HeatmapData) => ({
				...d,
				sortOrder: sortedStations.indexOf(d.Station),
				compareValue: weekendLookup.get(`${d.Station}-${d.Hour}`) || 0
			}))
			.sort((a, b) => a.sortOrder - b.sortOrder);

		const weekendData = heatmapData[0]
			.filter((d: HeatmapData) => d.day_type === 'Weekend')
			.map((d: HeatmapData) => ({
				...d,
				sortOrder: sortedStations.indexOf(d.Station),
				compareValue: weekdayLookup.get(`${d.Station}-${d.Hour}`) || 0
			}))
			.sort((a, b) => a.sortOrder - b.sortOrder);

		const allRatios = heatmapData[0].map((d: HeatmapData) => d.hourly_ratio);

		return { weekdayData, weekendData, allRatios };
	})();

	const heatmapColors = [
		'#f7ebe9',
		'#f9d0c4',
		'#f6b29e',
		'#f49578',
		'#f27f5b',
		'#f26b42',
		'#e7653e',
		'#cc4c02',
		'#993404'
	];

	const colorScale = scaleQuantile().domain(processedData.allRatios).range(heatmapColors);

	// Get the appropriate data based on dayType prop
	const currentData = $derived(
		dayType === 'weekday' ? processedData.weekdayData : processedData.weekendData
	);
</script>

<!-- Screen reader accessible data summary -->
<div class="sr-only">
	<p>
		This chart shows a heatmap of ridership over time for each station for {dayType}s.
	</p>
</div>

<div style="display: {visible ? 'block' : 'none'}; touch-action: pan-y;">
	<Plot
		inset={0.05}
		height={1.6 * 868}
		x={{
			axis: 'both',
			ticks: [5, 9, 13, 17],
			label: '',
			padding: 0.01,
			tickSize: 0,
			labelAnchor: 'center',
			tickFormat: (d: any) => {
				const hour = Number(d);
				if (hour === 0) return '12AM';
				if (hour < 12) return `${hour}AM`;
				if (hour === 12) return '12PM';
				return `${hour - 12}PM`;
			}
		}}
		y={{
			type: 'band',
			padding: 0.01,
			sort: 'stationTotals',
			label: '',
			labelAnchor: 'middle',
			tickSize: 0
		}}
		color={{ type: 'quantile' }}
	>
		<AxisY tickSize={0} />

		<Text
			frameAnchor="top-left"
			text={dayType === 'weekday' ? 'Weekday Peak Hours' : 'Weekday Activity'}
			fontSize={14}
			fontWeight="600"
			fill="rgba(0,0,0,0.4)"
			dx={10}
			dy={25}
		/>

		<Text
			frameAnchor="top-right"
			text={dayType === 'weekday' ? 'Weekend Activity' : 'Weekend Peak Hours'}
			fontSize={14}
			fontWeight="600"
			fill="rgba(0,0,0,0.4)"
			dx={-10}
			dy={25}
		/>

		<Cell
			data={currentData}
			x="Hour"
			y="Station"
			strokeWidth={0}
			fill={(d: any) => colorScale(d.hourly_ratio)}
		/>
		{#snippet overlay()}
			<HTMLTooltip data={currentData} x="Hour" y="Station">
				{#snippet children({ datum }: { datum: any })}
					{@const isCurrentWeekday = datum.day_type === 'Weekday'}
					{@const weekdayPct = isCurrentWeekday
						? (datum.hourly_ratio * 100).toFixed(1)
						: ((datum.compareValue || 0) * 100).toFixed(1)}
					{@const weekendPct = isCurrentWeekday
						? ((datum.compareValue || 0) * 100).toFixed(1)
						: (datum.hourly_ratio * 100).toFixed(1)}

					<div class="tooltip-card">
						<div class="tooltip-station">{datum.Station}</div>
						<div class="tooltip-time-row">
							<span class="tooltip-context">Ridership share at</span>
						</div>
						<div class="tooltip-time-row">
							<span class="tooltip-time">{datum.Hour}:00</span>
						</div>

						<div class="tooltip-metrics">
							<div class="metric-weekday">
								<span class="metric-label">Weekdays</span>
								<span
									class="metric-value weekday-value"
									style="opacity: {dayType === 'weekday' ? 1 : 0.4}">{weekdayPct}%</span
								>
							</div>
							<div class="metric-weekend">
								<span class="metric-label">Weekends</span>
								<span
									class="metric-value weekend-value"
									style="opacity: {dayType === 'weekend' ? 1 : 0.4}">{weekendPct}%</span
								>
							</div>
						</div>
					</div>
				{/snippet}
			</HTMLTooltip>
		{/snippet}
	</Plot>
</div>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Override HTMLTooltip default styles */
	:global(.tooltip) {
		--svelteplot-tooltip-bg: transparent !important;
		--svelteplot-tooltip-border: transparent !important;
		background: transparent !important;
		border: none !important;
		padding: 0 !important;
		box-shadow: none !important;
		font-size: inherit !important;
		line-height: inherit !important;
		border-radius: 0 !important;
	}

	.tooltip-card {
		background: var(--background);
		border: 1px solid rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		font-family: var(--font-sans);
		min-width: 180px;
		overflow: hidden;
	}

	.tooltip-station {
		font-weight: 700;
		color: var(--foreground);
		font-size: 0.875rem;
		padding: 0.75rem 0.75rem 0.25rem;
		line-height: 1.2;
	}

	.tooltip-time-row {
		display: flex;
		align-items: baseline;
		gap: 0.25rem;
		padding: 0 0.75rem 0.625rem;
	}

	.tooltip-time {
		font-family: var(--font-mono);
		font-size: 1.25rem;
		font-weight: 800;
		color: var(--foreground);
		letter-spacing: 0.05em;
		background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.tooltip-context {
		font-size: 0.75rem;
		color: var(--muted-foreground);
		font-weight: 500;
	}

	.tooltip-metrics {
		display: flex;
		gap: 0.75rem;
		padding: 0 0.75rem 0.5rem;
	}

	.metric-weekday,
	.metric-weekend {
		flex: 1;
	}

	.metric-label {
		display: block;
		font-size: 0.6875rem;

		font-weight: 500;
		margin-bottom: 0.125rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.metric-value {
		display: block;
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 1rem;
		line-height: 1;
	}
</style>
