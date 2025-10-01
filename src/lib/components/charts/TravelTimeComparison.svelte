<script lang="ts">
	import { Plot, BarX, AxisX, AxisY, GridX, Text, RuleX } from 'svelteplot';
	import avgData from '$lib/data/charts/11-travel-time-selected.json';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const isMobile = new IsMobile();

	type StationAvg = {
		From_Station: string;
		Origin_Line: 'Green' | 'Purple' | 'Yellow' | 'Black' | string;
		total_ridership: number;
		total_station_distance: number;
		avg_stations_travelled: number;
	};

	const lineColors: Record<string, string> = {
		Green: 'var(--color-brand-green)',
		Purple: 'var(--color-brand-purple)',
		Yellow: 'var(--color-brand-yellow)',
		Black: 'var(--color-brand-black)'
	};

	const targetStations = new Set(['Madavara', 'Halasuru']);

	const filtered: StationAvg[] = (avgData.station_averages as StationAvg[])
		.filter((d) => targetStations.has(d.From_Station))
		.map((d) => ({
			...d,
			// Round to nearest whole station for label while preserving exact value for length
			avg_stations_travelled: d.avg_stations_travelled
		}))
		// Order longest first for nicer stacking
		.sort((a, b) => b.avg_stations_travelled - a.avg_stations_travelled);

	// Convert average stations travelled to approximate minutes (4 minutes per station)
	const withMinutes = filtered.map((d) => ({
		...d,
		time_minutes: d.avg_stations_travelled * 4
	}));

	const xMax = Math.max(...withMinutes.map((d) => d.time_minutes));
	const niceStep = xMax > 60 ? 10 : 5;
	const niceMax = Math.ceil(xMax / niceStep) * niceStep;
	const xDomain = [0, niceMax];
	const xTicks = Array.from({ length: Math.floor(niceMax / niceStep) + 1 }, (_, i) => i * niceStep);

	const getFill = (d: StationAvg) => lineColors[d.Origin_Line] ?? 'var(--color-muted)';

	const labelFor = (d: any) => {
		const rounded = Math.round(d.time_minutes);
		return `${rounded} mins`;
	};
</script>

<div class="my-2">
	<Plot
		padding={0.2}
		height={filtered.length * 64}
		inset={0}
		marginRight={isMobile.current ? 50 : 50}
		x={{
			domain: xDomain,
			ticks: xTicks,
			axis: 'bottom',
			grid: true,
			label: 'Avg. daily metro commute (min, approx)'
		}}
		y={{ domain: withMinutes.map((d) => d.From_Station), axis: 'left' }}
	>
		<GridX strokeDasharray="3,3" opacity={0.15} />
		<RuleX x={0} stroke="var(--color-foreground)" strokeWidth={1.5} />

		<!-- Subtle background bars to emphasize magnitude (like a track) -->
		<BarX
			data={withMinutes}
			x={() => xDomain[1]}
			y={(d) => d.From_Station}
			fill="var(--color-muted)"
			stroke="transparent"
			opacity={0.12}
		/>

		<!-- Foreground bars with arrow-like end markers -->
		<BarX
			data={withMinutes}
			x={(d) => d.time_minutes}
			y={(d) => d.From_Station}
			fill={getFill}
			stroke="transparent"
			opacity={0.9}
		/>

		{#each withMinutes as d}
			<!-- Value label -->
			<Text
				x={d.time_minutes}
				y={d.From_Station}
				dx={36}
				text={labelFor(d)}
				fontWeight={700}
				fontSize={14}
				fill="var(--color-foreground)"
				stroke="var(--color-background)"
				strokeWidth={4}
				paintOrder="stroke"
			/>
		{/each}
	</Plot>
</div>
