<script>
	import TableCell from './TableCell.svelte';

	let { row, columns, colorScales, rowIndex } = $props();
</script>

<tr class="table-row" class:even={rowIndex % 2 === 0}>
	{#each columns as column}
		<TableCell value={row[column.key]} {column} colorScale={colorScales[column.key]} {row} />
	{/each}
</tr>

<style>
	@import './table-styles.css';
</style>
