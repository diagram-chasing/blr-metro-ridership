<script lang="ts">
	import { Plot, Line, DifferenceY, Frame, GridX, GridY, Text, AxisY, RuleX } from 'svelteplot';
	import weekdayWeekendData from '$lib/data/charts/06-weekday-weekend-patterns.json';
	import { chartConfig } from './config.svelte';

	interface ChartDataPoint extends Record<string | symbol, any> {
		Hour: number;
		Weekday: number;
		Weekend: number;
	}

	const chartData: ChartDataPoint[] = [];
	const weekdayData = weekdayWeekendData.hourly_averages.filter((d) => d.day_type === 'Weekday');
	const weekendData = weekdayWeekendData.hourly_averages.filter((d) => d.day_type === 'Weekend');

	for (let hour = 0; hour < 24; hour++) {
		const weekdayEntry = weekdayData.find((d) => d.Hour === hour);
		const weekendEntry = weekendData.find((d) => d.Hour === hour);

		chartData.push({
			Hour: hour,
			Weekday: weekdayEntry ? weekdayEntry.Average_Ridership : 0,
			Weekend: weekendEntry ? weekendEntry.Average_Ridership : 0
		});
	}

	const formatHour = (hour: number): string => {
		if (hour === 0) return '12AM';
		if (hour < 12) return `${hour}AM`;
		if (hour === 12) return '12PM';
		return `${hour - 12}PM`;
	};

	// Get responsive configuration for chart-specific settings
	let config = $derived(chartConfig.responsive);
	let helpers = $derived(chartConfig.helpers);
</script>

<p class="max-w-xl text-sm !leading-8 font-bold text-pretty md:text-lg" id="chart-title">
	Average ridership flow every hour, throughout the day on <span class="highlight brown"
		>weekdays</span
	>
	vs the
	<span class="highlight orange">weekend</span>
</p>

<!-- Screen reader accessible data summary -->
<div class="sr-only">
	<p>
		This chart compares metro ridership patterns between weekdays and weekends across 24 hours. Key
		findings:
	</p>
	<ul>
		<li>Weekday peak at 9 AM with 950+ riders (morning commute)</li>
		<li>Evening weekday peak at 6 PM with 950+ riders (evening commute)</li>
		<li>Weekend ridership peaks between 1-4 PM, exceeding weekday levels</li>
		<li>Lowest ridership occurs overnight on both weekdays and weekends</li>
	</ul>
</div>

<div class="breakout-sm my-12">
	<Plot
		role="img"
		aria-labelledby="chart-title"
		aria-describedby="chart-description"
		height={config.chart.height}
		x={{
			domain: [0, 23],
			ticks: config.ticks.hourlyTicks,
			tickFormat: (d) => formatHour(Number(d)),
			label: '',
			nice: true,
			axis: 'both',
			insetLeft: 0
		}}
		y={{
			label: '',
			nice: true,
			insetTop: 20,
			insetBottom: 20,
			tickSpacing: 50,
			domain: [0, 1100],
			axis: 'left'
		}}
		axes={true}
	>
		<GridX strokeDasharray="3,3" opacity={0.5} />
		<GridY strokeDasharray="3,3" opacity={0.9} />

		<!-- Difference area showing when weekday > weekend -->
		<DifferenceY
			data={chartData}
			x="Hour"
			y1="Weekend"
			y2="Weekday"
			positiveFill="var(--color-brown-300)"
			negativeFill="var(--color-brand-orange)"
			opacity={config.opacity.difference}
			curve="step-after"
		/>

		<!-- Weekday line - Brown for weekday commute -->
		<Line
			data={chartData}
			x="Hour"
			strokeWidth={config.stroke.line}
			y="Weekday"
			stroke="var(--color-brown-600)"
			curve="step-after"
			strokeDasharray="none"
		/>

		<!-- Weekend line - Brand orange for leisure travel -->
		<Line
			data={chartData}
			x="Hour"
			strokeWidth={config.stroke.line}
			y="Weekend"
			stroke="var(--color-brand-orange)"
			curve="step-after"
		/>
		<RuleX x={0} stroke="var(--color-foreground)" strokeWidth={1} />

		{#if !helpers.isMobile}
			<Text
				x={9.5}
				y={1070}
				fontSize={config.text.annotation}
				text="
Weekday commuters
heading to work"
				fill="var(--color-brown-700)"
				stroke="var(--color-background)"
				strokeWidth={3}
			/>
		{/if}

		<!-- Brown area explanation -->
		<Text
			x={helpers.isMobile ? 12 : 7.6}
			y={helpers.isMobile ? 1050 : 570}
			fontSize={config.text.annotation}
			text="Brown areas show when
weekdays have higher
ridership than weekends"
			fill="var(--color-brown-700)"
			stroke="var(--color-background)"
			strokeWidth={3}
			textAnchor="end"
		/>

		<!-- Evening peak annotation -->
		{#if !helpers.isMobile}
			<Text
				x={18.5}
				y={1050}
				fontSize={config.text.annotation}
				text="Weekday commuters
heading back home"
				fill="var(--color-brown-700)"
				stroke="var(--color-background)"
				strokeWidth={3}
			/>
		{/if}

		<Text
			x={14}
			y={360}
			fontSize={config.text.annotation}
			text="Weekend usage peaks above
weekdays from noon through evening"
			fill="var(--color-brand-orange)"
			stroke="var(--color-background)"
			strokeWidth={3}
		/>
	</Plot>

	<!-- Hidden description for screen readers -->
	<div id="chart-description" class="sr-only">
		Area chart showing metro ridership by hour. Grey areas indicate where weekday ridership exceeds
		weekend ridership. Red areas show where weekend ridership is higher. The chart reveals typical
		commuter patterns with morning and evening weekday peaks, and steady weekend afternoon activity.
	</div>
</div>

<style>
	.highlight {
		padding: 1px 8px;
		font-weight: bold;
		border-radius: 4px;
		border: solid 2px;
		margin: 0;
	}

	.highlight.orange {
		background-color: var(--color-brand-orange);
		border-color: color-mix(in srgb, var(--color-brand-orange) 50%, var(--color-brown-900));
		color: var(--color-background);
	}

	.highlight.brown {
		background-color: var(--color-brown-300);
		border-color: color-mix(in srgb, var(--color-brown-300) 50%, var(--color-brown-900));
		color: var(--color-brown-900);
	}

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
</style>
