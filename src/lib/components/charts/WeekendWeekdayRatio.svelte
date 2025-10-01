<script lang="ts">
	import { Plot, RuleY, RuleX, Text, Rect, HTMLTooltip } from 'svelteplot';
	import variationData from '$lib/data/charts/09-station-variation-analysis.json';
	import { format } from 'd3';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const formatter = format(',');
	interface StationData {
		Station: string;
		Line: string;
		Weekday: number;
		Weekend: number;
	}

	type StationPoint = StationData & {
		ratio: number; // weekend / weekday
		total: number; // weekday + weekend
		ratioGroup: number; // binned ratio for stacking
		[key: string]: any; // Index signature for compatibility
	};

	// Calculate points (this is fast and fine)
	const points: StationPoint[] = (variationData.stations as StationData[])
		.map((station: StationData) => {
			const ratio = station.Weekday > 0 ? station.Weekend / station.Weekday : 0;
			const total = station.Weekday + station.Weekend;
			const ratioGroup = Math.round(ratio * 10) / 10;

			return { ...station, ratio, total, ratioGroup };
		})
		.sort((a, b) => a.Line.localeCompare(b.Line));

	// --- MODIFICATION START ---
	// Perform the expensive calculation once, outside of any reactive context.

	const calculateStackedRects = () => {
		const groupedByRatio = new Map<number, StationPoint[]>();

		// Group stations by ratio
		points.forEach((point) => {
			if (!groupedByRatio.has(point.ratioGroup)) {
				groupedByRatio.set(point.ratioGroup, []);
			}
			groupedByRatio.get(point.ratioGroup)!.push(point);
		});

		const rects: (StationPoint & { y1: number; y2: number })[] = [];

		// Calculate stacked positions for each group
		groupedByRatio.forEach((stations) => {
			let currentY = 0;
			stations.forEach((station) => {
				rects.push({
					...station,
					y1: currentY,
					y2: currentY + 1
				});
				currentY += 1;
			});
		});

		return rects;
	};

	// Call the function immediately to get the final, static array.
	const stackedRects = calculateStackedRects();
	// --- MODIFICATION END ---

	// Colors by line
	const lineColors: Record<string, string> = {
		Green: 'var(--color-brand-green)',
		Purple: 'var(--color-brand-purple)',
		Yellow: 'var(--color-brand-yellow)',
		Black: 'black'
	};

	let chartContainer: HTMLElement;
	const isMobile = new IsMobile();
</script>

<div class="breakout-sm space-y-16">
	<div bind:this={chartContainer} class="chart-container" style="touch-action: pan-y;">
		<Plot height={300} x={{ axis: false }} y={{ axis: false }} padding={0.1}>
			<Rect
				data={stackedRects}
				x1={(d) => d.ratioGroup - 0.05}
				x2={(d) => d.ratioGroup + 0.05}
				y1="y1"
				y2="y2"
				fill={(d) => lineColors[d.Line]}
				stroke="var(--color-background)"
				strokeWidth={2}
			/>
			<RuleY data={[0]} stroke="black" />
			<RuleX data={[1.0]} stroke="var(--color-neutral-500)" strokeDasharray="3 3" />
			<Text
				x={1.0}
				y={17.5}
				text="Similar
				ridership"
				fontSize={14}
				fontWeight="600"
				fill="rgba(0,0,0,0.9)"
				textAnchor="middle"
				stroke="white"
				strokeWidth={2}
				dy={isMobile.current ? -5 : 50}
			/>
			<Text
				frameAnchor="top-left"
				text="More
										← 	weekday
											ridership"
				fontSize={14}
				fontWeight="600"
				fill="rgba(0,0,0,0.9)"
				dx={110}
				textAnchor="end"
				dy={50}
			/>

			<Text
				frameAnchor="top-right"
				text="More
weekend →
ridership"
				textAnchor="start"
				fontSize={14}
				fontWeight="600"
				fill="rgba(0,0,0,0.9)"
				dx={-100}
				dy={50}
			/>
			{#snippet overlay()}
				<HTMLTooltip data={stackedRects} x="ratioGroup" y={(d: any) => (d.y1 + d.y2) / 2}>
					{#snippet children({ datum }: { datum: any })}
						<div class="tooltip-card">
							<div style="color: {lineColors[datum.Line]}" class="tooltip-station">
								{datum.Station}
							</div>

							<div class="tooltip-title">
								<span class="title-label">Daily ridership on</span>
							</div>

							<div class="tooltip-metrics">
								<div class="metric-weekday">
									<span class="metric-label">Weekday</span>
									<span class="metric-value weekday-value"
										>{formatter(datum.Weekday?.toFixed(0) || '0')}</span
									>
								</div>
								<div class="metric-weekend">
									<span class="metric-label">Weekend</span>
									<span class="metric-value weekend-value"
										>{formatter(datum.Weekend?.toFixed(0) || '0')}</span
									>
								</div>
							</div>
						</div>
					{/snippet}
				</HTMLTooltip>
			{/snippet}
		</Plot>
	</div>
</div>

<style>
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
		font-weight: 900;
		color: var(--foreground);
		font-size: 1rem;
		padding: 0.75rem 0.75rem 0.25rem;
		line-height: 1.2;
	}

	.tooltip-title {
		display: flex;
		padding: 0.75rem 0.75rem 0.25rem;
		line-height: 1.2;
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

	.title-label {
		display: block;
		font-size: 0.6875rem;
		font-weight: 600;
		margin-bottom: 0.125rem;
		text-transform: uppercase;
		letter-spacing: 0.025em;
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
