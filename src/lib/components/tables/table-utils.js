// @ts-check
export const TABLE_CONSTANTS = {
	ITEMS_PER_PAGE: 25,
	SORT_DIRECTIONS: {
		NONE: 'none',
		ASC: 'asc',
		DESC: 'desc'
	}
};

/**
 * Sort data utility - extracted from Table.svelte
 * @param {any[]} data
 * @param {string} sortColumn
 * @param {string} sortDirection
 * @param {any[]} columns
 */
export function sortTableData(data, sortColumn, sortDirection, columns) {
	if (sortDirection === TABLE_CONSTANTS.SORT_DIRECTIONS.NONE || !sortColumn) {
		return data;
	}

	const column = columns.find((col) => col.key === sortColumn);
	if (!column) return data;

	const sorted = [...data].sort((a, b) => {
		let aVal = a[sortColumn];
		let bVal = b[sortColumn];

		// Handle different column types
		if (column.type === 'number' || column.type === 'percentage') {
			// Convert to numbers for numeric comparison
			aVal = typeof aVal === 'string' ? parseFloat(aVal.replace(/[^0-9.-]/g, '')) : Number(aVal);
			bVal = typeof bVal === 'string' ? parseFloat(bVal.replace(/[^0-9.-]/g, '')) : Number(bVal);

			if (isNaN(aVal)) aVal = -Infinity;
			if (isNaN(bVal)) bVal = -Infinity;

			return aVal - bVal;
		} else {
			// String comparison for text
			aVal = String(aVal || '').toLowerCase();
			bVal = String(bVal || '').toLowerCase();
			return aVal.localeCompare(bVal);
		}
	});

	return sortDirection === TABLE_CONSTANTS.SORT_DIRECTIONS.DESC ? sorted.reverse() : sorted;
}

/**
 * Filter data utility - extracted from Table.svelte
 * @param {any[]} data
 * @param {string} searchQuery
 * @param {string[]} searchFields
 */
export function filterTableData(data, searchQuery, searchFields) {
	if (!searchQuery.trim() || !searchFields?.length) {
		return data;
	}

	const query = searchQuery.toLowerCase().trim();
	return data.filter((row) => {
		return searchFields.some((field) => {
			const value = String(row[field] || '').toLowerCase();
			return value.includes(query);
		});
	});
}

/**
 * Paginate data utility - extracted from Table.svelte
 * @param {any[]} data
 * @param {number} currentPage
 * @param {number} itemsPerPage
 */
export function paginateTableData(data, currentPage, itemsPerPage) {
	const startIndex = (currentPage - 1) * itemsPerPage;
	const endIndex = startIndex + itemsPerPage;
	return data.slice(startIndex, endIndex);
}

/**
 * Calculate total pages utility
 * @param {number} dataLength
 * @param {number} itemsPerPage
 */
export function calculateTotalPages(dataLength, itemsPerPage) {
	return Math.ceil(dataLength / itemsPerPage);
}

/**
 * Sort handling utility
 * @param {string|null} currentSortColumn
 * @param {string} currentSortDirection
 * @param {string} newColumn
 */
export function handleSortChange(currentSortColumn, currentSortDirection, newColumn) {
	if (currentSortColumn === newColumn) {
		// Cycle through: asc -> desc -> none
		if (currentSortDirection === TABLE_CONSTANTS.SORT_DIRECTIONS.ASC) {
			return {
				sortColumn: newColumn,
				sortDirection: TABLE_CONSTANTS.SORT_DIRECTIONS.DESC
			};
		} else if (currentSortDirection === TABLE_CONSTANTS.SORT_DIRECTIONS.DESC) {
			return {
				sortColumn: null,
				sortDirection: TABLE_CONSTANTS.SORT_DIRECTIONS.NONE
			};
		} else {
			return {
				sortColumn: newColumn,
				sortDirection: TABLE_CONSTANTS.SORT_DIRECTIONS.ASC
			};
		}
	} else {
		// New column - start with ascending
		return {
			sortColumn: newColumn,
			sortDirection: TABLE_CONSTANTS.SORT_DIRECTIONS.ASC
		};
	}
}

/**
 * Format cell value utility - extracted from TableCell.svelte
 * @param {any} value
 * @param {any} column
 */
export function formatCellValue(value, column) {
	if (value === null || value === undefined) return '';

	switch (column.type) {
		case 'percentage':
			return column.showPercentSign === false ? value : `${value}%`;
		case 'number':
			if (column.precision !== undefined) {
				return Number(value).toFixed(column.precision);
			}
			return value;
		default:
			return value;
	}
}
