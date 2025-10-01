<script lang="ts">
	import { Plot, Cell } from 'svelteplot';
	import interchangeData from '$lib/data/charts/13-interchange-station-footfall.json';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	const isMobile = new IsMobile();

	// Process the data to create visualization-friendly format
	const processedData = interchangeData.interchange_footfall.map((item) => ({
		station: item.Station,
		period: item.Before !== undefined ? 'Before' : 'After',
		footfall: item.Before !== undefined ? item.Before : item.After,
		row: Math.ceil((item.Before !== undefined ? item.Before : item.After) / 1000) // Each row represents 1000 people
	}));

	// Filter for RV Road station specifically
	const rvRoadData = processedData.filter((item) => item.station === 'Rashtreeya Vidyalaya Road');

	// Create data for row visualization
	interface RowDataItem {
		period: string;
		row: number;
		station: string;
	}

	const rowData: RowDataItem[] = [];
	rvRoadData.forEach((item) => {
		for (let i = 0; i < item.row; i++) {
			rowData.push({
				period: item.period,
				row: i + 1,
				station: item.station
			});
		}
	});
</script>

<!-- Screen reader accessible data summary -->
<div class="sr-only">
	<p>
		This visualization shows the footfall at Rashtreeya Vidyalaya Road station before and after the
		Yellow Line opening. Each row represents 1,000 people. Before: {rvRoadData.find(
			(d) => d.period === 'Before'
		)?.footfall || 0} people, After: {rvRoadData.find((d) => d.period === 'After')?.footfall || 0} people.
	</p>
</div>
<div class="flex flex-wrap items-center justify-center border-y py-2 text-muted-foreground">
	<span class="text-center !text-xl !font-bold text-balance text-black md:text-left">
		Daily footfall at RV Road before Yellow Line and after Yellow Line
	</span>
	<span class="mt-2 text-center text-sm !font-bold text-balance text-black md:text-left">
		Each row represents 1,000 people
	</span>
</div>
<div class="interchange-footfall my-4">
	<Plot
		height={300}
		width={isMobile.current ? 250 : 400}
		x={{
			type: 'band',
			label: '',
			padding: 0.1,
			domain: ['Before', 'After'],
			labelAnchor: 'left',
			axis: 'top'
		}}
		y={{
			type: 'band',
			label: '',
			padding: 0.05,
			ticks: [0]
		}}
	>
		<Cell
			data={rowData}
			x="period"
			y="row"
			fill={'var(--color-brand-green)'}
			stroke="#fff"
			strokeWidth={0.5}
			inset={0.1}
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

	.interchange-footfall {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}
</style>
