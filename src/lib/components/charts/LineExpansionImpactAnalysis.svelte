<script lang="ts">
	import { Plot, BarX, RuleX, Text, GridX } from 'svelteplot';
	import impactData from '$lib/data/charts/10-yellow-line-impact.json';
	import { chartConfig } from './config.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const stationImpacts = impactData.station_impacts
		.sort((a, b) => b.percent_change - a.percent_change)
		.map((station, index) => ({
			...station,
			rank: index + 1
		}));

	const isMobile = new IsMobile();
	const topImpactStation = stationImpacts[0];

	const barHeight = chartConfig.helpers.isMobile ? 16 : 18;
	const chartHeight = stationImpacts.length * barHeight;

	// Responsive text positioning inside bars
	const textPositionMultiplier = isMobile.current ? 5 : 2;

	const formatPercent = (value: number) => {
		return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
	};

	const getBarColor = (d: any) => {
		if (d.Line === 'Green') return 'var(--color-brand-green)';
		if (d.Line === 'Purple') return 'var(--color-brand-purple)';
		if (d.Line === 'Black') return 'var(--color-brand-black)';
		return 'var(--color-muted)';
	};
</script>

<!-- Screen reader accessible data summary -->
<div class="sr-only">
	<p>
		This chart shows the percentage change in ridership for metro stations after the Yellow Line
		opened. Most stations saw increases, with the largest increase being {formatPercent(
			topImpactStation.percent_change
		)} at {topImpactStation.Station}.
	</p>
</div>

<div class="breakout-sm">
	<Plot
		padding={0.1}
		aria-labelledby="chart-title"
		height={300}
		marginRight={isMobile.current ? 20 : 50}
		marginLeft={chartConfig.helpers.isMobile ? 110 : 140}
		inset={chartConfig.responsive.chart.inset}
		x={{
			domain: [-15, 35],
			label: 'Change in Ridership (%)',
			padding: 100
		}}
		y={{
			domain: stationImpacts.map((d) => d.Station),
			axis: 'left',
			label: ''
		}}
	>
		<!-- Dashed grid lines -->
		<GridX
			strokeDasharray={chartConfig.static.grid.dashArray}
			opacity={chartConfig.responsive.opacity.grid}
		/>

		<!-- Zero reference line -->
		<RuleX
			data={[0]}
			stroke="var(--color-foreground)"
			strokeWidth={chartConfig.responsive.stroke.frame}
		/>

		<!-- Horizontal bars -->
		<BarX
			data={stationImpacts}
			x="percent_change"
			y="Station"
			stroke="transparent"
			fill={getBarColor}
		/>

		<Text
			data={stationImpacts}
			x={isMobile.current ? 0 : 12}
			y="Chickpete"
			dy={10}
			text={'Chickpete and Banashankari\nconnect to buses for areas\nnow served by Yellow Line'}
			dx={chartConfig.responsive.spacing.annotationPadding}
			textAnchor="start"
			stroke="white"
			fill="var(--color-brand-black)"
			fontWeight={chartConfig.static.fontWeight.semibold}
			fontSize={chartConfig.responsive.text.annotation}
		/>

		<!-- Compact percentage labels inside bars -->
		<Text
			data={stationImpacts}
			x={(d) =>
				d.percent_change > 0
					? d.percent_change - textPositionMultiplier
					: d.percent_change + textPositionMultiplier}
			y="Station"
			text={(d) => formatPercent(d.percent_change)}
			fill="white"
			stroke="rgba(0,0,0,0.8)"
			strokeWidth={1}
			paintOrder="stroke"
			fontWeight={chartConfig.static.fontWeight.bold}
			fontSize={chartConfig.responsive.text.tickLabel}
		/>
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
</style>
