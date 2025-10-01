<script>
	import TableHeader from './TableHeader.svelte';
	import TableRow from './TableRow.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Search } from 'lucide-svelte';
	import { createTableColorScales } from './colorScales';
	import * as Pagination from '$lib/components/ui/pagination';
	import {
		TABLE_CONSTANTS,
		sortTableData,
		filterTableData,
		paginateTableData,
		calculateTotalPages,
		handleSortChange
	} from './table-utils.js';

	let { data, className = '' } = $props();

	// Sorting state - initialize with config defaults
	let sortColumn = $state(data.sort?.defaultColumn || null);
	let sortDirection = $state(
		data.sort?.defaultColumn
			? data.sort?.defaultDirection || TABLE_CONSTANTS.SORT_DIRECTIONS.ASC
			: TABLE_CONSTANTS.SORT_DIRECTIONS.NONE
	);

	// Search state
	let searchQuery = $state('');

	// Pagination state
	let currentPage = $state(1);
	const itemsPerPage = data.pagination?.itemsPerPage || TABLE_CONSTANTS.ITEMS_PER_PAGE;

	const originalData = data.data;

	// Calculate D3 color scales for columns that need them based on original data
	let colorScales = $derived.by(() => {
		return createTableColorScales(originalData, data.columns);
	});

	// Filter data based on search query
	let filteredData = $derived.by(() => {
		if (!data.search?.enabled) return originalData;
		return filterTableData(originalData, searchQuery, data.search?.fields || []);
	});

	// Sort filtered data based on current sort state
	let sortedData = $derived.by(() => {
		return sortTableData(filteredData, sortColumn, sortDirection, data.columns);
	});

	// Paginated data - slice sorted data based on current page
	let paginatedData = $derived.by(() => {
		if (!data.pagination?.enabled) return sortedData;
		return paginateTableData(sortedData, currentPage, itemsPerPage);
	});

	// Calculate total pages
	let totalPages = $derived.by(() => {
		if (!data.pagination?.enabled) return 1;
		return calculateTotalPages(sortedData.length, itemsPerPage);
	});

	// Reset to first page when search or sort changes
	let previousSearchQuery = '';
	let previousSortColumn = '';
	let previousSortDirection = '';

	$effect(() => {
		if (
			searchQuery !== previousSearchQuery ||
			sortColumn !== previousSortColumn ||
			sortDirection !== previousSortDirection
		) {
			if (previousSearchQuery !== '' || previousSortColumn !== '' || previousSortDirection !== '') {
				currentPage = 1;
			}
			previousSearchQuery = searchQuery;
			previousSortColumn = sortColumn;
			previousSortDirection = sortDirection;
		}
	});

	/**
	 * Handle sort column click
	 * @param {string} columnKey
	 */
	function handleSort(columnKey) {
		if (!data.sort?.enabled) return;

		const result = handleSortChange(sortColumn, sortDirection, columnKey);
		sortColumn = result.sortColumn;
		sortDirection = result.sortDirection;
	}
</script>

<div class="table-container {className}">
	{#if data.title}
		<h2 class="font-atkinson xs:mb-2 text-base font-bold text-balance md:text-lg">
			{data.title}
		</h2>
	{/if}
	<div class="mb-2 flex flex-col items-start justify-between gap-2 md:flex-row">
		{#if data.subtitle}
			<p class="font-atkinson text-sepia-brown/80 text-sm leading-relaxed md:text-base">
				{data.subtitle}
			</p>
		{/if}
		{#if data.search?.enabled}
			<div class="search-container">
				<div class="search-input-wrapper">
					<Search size={12} class="search-icon" />
					<label for="table-search-input" class="sr-only">
						{data.search.placeholder || 'Search table data'}
					</label>
					<Input
						id="table-search-input"
						bind:value={searchQuery}
						placeholder={data.search.placeholder || 'Search...'}
						class="search-input"
						aria-label={data.search.placeholder || 'Search table data'}
					/>
					{#if searchQuery && filteredData.length !== originalData.length}
						<span class="search-results">
							{filteredData.length}/{originalData.length}
						</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<div class="table-wrapper">
		<table class="data-table">
			<TableHeader
				columns={data.columns}
				columnGroups={data.columnGroups}
				{sortColumn}
				{sortDirection}
				sortEnabled={data.sort?.enabled || false}
				onSort={handleSort}
			/>
			<tbody>
				{#each paginatedData as row, index}
					<TableRow
						{row}
						columns={data.columns}
						{colorScales}
						rowIndex={index + (currentPage - 1) * itemsPerPage}
					/>
				{/each}
			</tbody>
		</table>
	</div>

	{#if data.pagination?.enabled && totalPages > 1}
		<div class="pagination-container">
			<div class="pagination-info">
				<span class="pagination-text">
					Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(
						currentPage * itemsPerPage,
						sortedData.length
					)} of {sortedData.length} results
				</span>
			</div>
			<Pagination.Root
				bind:page={currentPage}
				count={sortedData.length}
				perPage={itemsPerPage}
				class="pagination-root"
			>
				{#snippet children({ pages })}
					<Pagination.Content class="pagination-content">
						<Pagination.PrevButton class="pagination-nav-button" />
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Ellipsis class="pagination-ellipsis" />
							{:else}
								<Pagination.Item class="pagination-item">
									<Pagination.Link
										{page}
										isActive={page.value === currentPage}
										class="pagination-link"
									/>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.NextButton class="pagination-nav-button" />
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</div>
	{/if}

	{#if data.source}
		<p class="table-source">SOURCE: {data.source}</p>
	{/if}
</div>

<style>
	@import './table-styles.css';

	.search-container {
		display: flex;
		align-items: center;
		justify-content: flex-end;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		max-width: clamp(150px, 25cqw, 200px);
		min-width: 120px;
	}

	:global(.search-icon) {
		position: absolute;
		left: 0.5rem;
		z-index: 1;
		color: var(--color-sepia-brown);
		opacity: 0.6;
		pointer-events: none;
	}

	:global(.search-input) {
		padding-left: clamp(1.25rem, 3cqw, 1.75rem) !important;
		padding-right: clamp(1.75rem, 4cqw, 2.5rem) !important;
		height: clamp(1.375rem, 3cqw, 1.625rem) !important;
		font-size: clamp(0.5625rem, 1.2cqw + 0.4rem, 0.6875rem) !important;
		border: 1px solid var(--color-sepia-dark) !important;
		background: var(--color-sepia-light) !important;
		color: var(--color-sepia-brown) !important;
		border-radius: 3px !important;
		font-family: var(--font-atkinson) !important;
		transition: all 0.15s ease !important;
		width: 100% !important;
	}

	:global(.search-input:focus) {
		border-color: var(--color-sepia-brown) !important;
		box-shadow: 0 0 0 1px rgba(60, 51, 50, 0.2) !important;
		outline: none !important;
	}

	:global(.search-input::placeholder) {
		color: var(--color-sepia-brown) !important;
		opacity: 0.5 !important;
	}

	.search-results {
		position: absolute;
		right: clamp(0.375rem, 1cqw, 0.5rem);
		top: 50%;
		transform: translateY(-50%);
		font-size: clamp(0.5rem, 0.8cqw + 0.35rem, 0.5625rem);
		color: var(--color-sepia-brown);
		opacity: 0.6;
		font-family: var(--font-atkinson);
		font-weight: 500;
		pointer-events: none;
	}

	.table-container.compact .search-container {
		padding-bottom: clamp(0.25rem, 1cqw, 0.375rem);
		margin-bottom: clamp(0.1875rem, 0.5cqw, 0.25rem);
	}

	.table-container.compact .search-input-wrapper {
		max-width: clamp(140px, 22cqw, 180px);
		min-width: 110px;
	}

	.table-container.compact :global(.search-input) {
		height: clamp(1.25rem, 2.5cqw, 1.5rem) !important;
		font-size: clamp(0.5rem, 1cqw + 0.375rem, 0.625rem) !important;
		padding-left: clamp(1.125rem, 2.5cqw, 1.625rem) !important;
		padding-right: clamp(1.625rem, 3.5cqw, 2.25rem) !important;
	}

	.table-container.compact .search-results {
		font-size: clamp(0.4375rem, 0.7cqw + 0.3rem, 0.5rem);
	}

	@container table (max-width: 400px) {
		.search-input-wrapper {
			max-width: clamp(120px, 30cqw, 160px);
			min-width: 100px;
		}
	}

	@container table (max-width: 280px) {
		.search-container {
			justify-content: center;
		}

		.search-input-wrapper {
			max-width: clamp(100px, 35cqw, 140px);
			min-width: 90px;
		}
	}

	.pagination-container {
		display: flex;
		flex-direction: column;
		gap: clamp(0.375rem, 1.5cqw, 0.75rem);
		align-items: center;
		justify-content: space-between;
		padding-top: clamp(0.5rem, 2cqw, 1rem);
		border-top: 1px solid var(--color-sepia-dark);
		margin-top: clamp(0.5rem, 2cqw, 1rem);
	}

	.pagination-info {
		display: flex;
		align-items: center;
	}

	.pagination-text {
		font-size: clamp(0.5625rem, 1.2cqw + 0.4rem, 0.6875rem);
		color: var(--color-gray-600);
		font-family: var(--font-atkinson);
		font-weight: 500;
	}

	.table-container :global(.pagination-root) {
		display: flex;
		justify-content: center;
	}

	.table-container :global(.pagination-content) {
		display: flex;
		align-items: center;
		gap: clamp(0.125rem, 0.5cqw, 0.25rem);
	}

	.table-container :global(.pagination-nav-button),
	.table-container :global(.pagination-link) {
		height: clamp(1.25rem, 3cqw, 1.5rem) !important;
		min-width: clamp(1.25rem, 3cqw, 1.5rem) !important;
		font-size: clamp(0.5625rem, 1.2cqw + 0.35rem, 0.625rem) !important;
		border: 1px solid var(--color-sepia-dark) !important;
		background: var(--color-sepia-light) !important;
		color: var(--color-sepia-brown) !important;
		border-radius: 3px !important;
		font-family: var(--font-atkinson) !important;
		font-weight: 500 !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		transition: all 0.15s ease !important;
		text-decoration: none !important;
		padding: 0 8px !important;
	}

	.table-container :global(.pagination-nav-button:hover),
	.table-container :global(.pagination-link:hover) {
		background: var(--color-sepia-brown) !important;
		color: var(--color-sepia-light) !important;
		border-color: var(--color-sepia-brown) !important;
	}

	.table-container :global(.pagination-link[data-selected='true']) {
		background: var(--color-sepia-brown) !important;
		color: var(--color-sepia-light) !important;
		border-color: var(--color-sepia-brown) !important;
	}

	.table-container :global(.pagination-nav-button:disabled) {
		opacity: 0.4 !important;
		cursor: not-allowed !important;
		background: var(--color-sepia-light) !important;
		color: var(--color-sepia-brown) !important;
	}

	.table-container :global(.pagination-nav-button:disabled:hover) {
		background: var(--color-sepia-light) !important;
		color: var(--color-sepia-brown) !important;
		border-color: var(--color-sepia-dark) !important;
	}

	.table-container :global(.pagination-ellipsis) {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		height: clamp(1.25rem, 3cqw, 1.5rem) !important;
		width: clamp(1.25rem, 3cqw, 1.5rem) !important;
		font-size: clamp(0.5625rem, 1.2cqw + 0.35rem, 0.625rem) !important;
		color: var(--color-sepia-brown) !important;
		font-family: var(--font-atkinson) !important;
		opacity: 0.6 !important;
	}

	/* Compact pagination */
	.table-container.compact .pagination-container {
		gap: clamp(0.25rem, 1cqw, 0.5rem);
		padding-top: clamp(0.375rem, 1.5cqw, 0.75rem);
		margin-top: clamp(0.375rem, 1.5cqw, 0.75rem);
	}

	.table-container.compact .pagination-text {
		font-size: clamp(0.5rem, 1cqw + 0.375rem, 0.625rem);
	}

	.table-container.compact :global(.pagination-nav-button),
	.table-container.compact :global(.pagination-link) {
		height: clamp(1.125rem, 2.5cqw, 1.375rem) !important;
		width: clamp(1.125rem, 2.5cqw, 1.375rem) !important;
		min-width: clamp(1.125rem, 2.5cqw, 1.375rem) !important;
		font-size: clamp(0.5rem, 1cqw + 0.3rem, 0.5625rem) !important;
	}

	.table-container.compact :global(.pagination-ellipsis) {
		height: clamp(1.125rem, 2.5cqw, 1.375rem) !important;
		width: clamp(1.125rem, 2.5cqw, 1.375rem) !important;
		font-size: clamp(0.5rem, 1cqw + 0.3rem, 0.5625rem) !important;
	}

	/* Container query adjustments for pagination */
	@container table (max-width: 400px) {
		.pagination-container {
			flex-direction: column;
			gap: clamp(0.25rem, 1cqw, 0.5rem);
		}

		.table-container :global(.pagination-content) {
			gap: clamp(0.0625rem, 0.3cqw, 0.125rem);
		}
	}

	@container table (max-width: 280px) {
		.pagination-text {
			font-size: clamp(0.5rem, 1cqw + 0.35rem, 0.575rem);
			text-align: center;
		}

		.table-container :global(.pagination-nav-button),
		.table-container :global(.pagination-link) {
			height: clamp(1rem, 2.5cqw, 1.25rem) !important;
			width: clamp(1rem, 2.5cqw, 1.25rem) !important;
			min-width: clamp(1rem, 2.5cqw, 1.25rem) !important;
			font-size: clamp(0.4375rem, 0.8cqw + 0.3rem, 0.5rem) !important;
		}

		.table-container :global(.pagination-ellipsis) {
			height: clamp(1rem, 2.5cqw, 1.25rem) !important;
			width: clamp(1rem, 2.5cqw, 1.25rem) !important;
			font-size: clamp(0.4375rem, 0.8cqw + 0.3rem, 0.5rem) !important;
		}
	}
</style>
