<script>
	import Table from '../tables/Table.svelte';
	import ridershipSample from '$lib/data/charts/ridership-sample.json';

	const sampleData = ridershipSample.sample_data;

	const tableData = {
		data: sampleData,
		columns: [
			{
				key: 'From_Station',
				label: 'Origin',
				type: 'text'
			},
			{
				key: 'To_Station',
				label: 'Destination',
				type: 'text'
			},
			{
				key: 'Ridership',
				label: 'Commuters',
				type: 'number'
			},
			{
				key: 'Hour',
				label: 'Hour',
				type: 'number'
			},
			{
				key: 'wday',
				label: 'Day',
				type: 'text'
			},
			{
				key: 'Date',
				label: 'Date',
				type: 'text'
			}
		],
		sort: {
			enabled: true,
			defaultColumn: 'Ridership',
			defaultDirection: 'desc'
		},
		search: {
			enabled: false,
			placeholder: 'Search stations...',
			fields: ['From_Station', 'To_Station']
		},
		pagination: {
			enabled: true,
			itemsPerPage: 15
		}
	};
</script>

<div class="sample-table-wrapper breakout-sm mb-10">
	<Table data={tableData} />
</div>

<style>
	@media (max-width: 768px) {
		.sample-table-wrapper {
			margin: 1rem 0;
		}
	}
</style>
