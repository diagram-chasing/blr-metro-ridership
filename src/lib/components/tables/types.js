// types.js - TypeScript type definitions
/**
 * @typedef {Object} Column
 * @property {string} key - The key to access data in each row
 * @property {string} label - The display label for the column header
 * @property {'text'|'number'|'percentage'} type - The data type
 * @property {number} [precision] - Number of decimal places for numbers
 * @property {string} [colorScale] - D3 color scale type (blues, greens, viridis, etc.)
 * @property {Object} [colorScaleOptions] - Options for the color scale
 * @property {Array} [colorScaleOptions.domain] - Custom domain for the scale
 * @property {Array} [colorScaleOptions.range] - Custom range for the scale
 * @property {boolean} [colorScaleOptions.reverse] - Reverse the color scale
 * @property {boolean} [colorScaleOptions.nice] - Use nice domain
 * @property {boolean} [colorScaleOptions.clamp] - Clamp values to domain
 * @property {boolean} [bold] - Whether to bold the text
 * @property {boolean} [showPercentSign] - Whether to show % sign (default: true)
 * @property {boolean} [showBar] - Whether to show percentage bar (default: true for percentage type)
 * @property {'orange'|'blue'|'green'} [barColor] - Color of percentage bars
 * @property {number} [group] - Group index for column grouping
 */

/**
 * @typedef {Object} ColumnGroup
 * @property {string} label - The display label for the column group header
 * @property {number} span - Number of columns this group spans
 */

/**
 * @typedef {Object} SearchConfig
 * @property {boolean} enabled - Whether search is enabled
 * @property {string} placeholder - Placeholder text for search input
 * @property {string[]} fields - Array of column keys to search in
 */

/**
 * @typedef {Object} SortConfig
 * @property {boolean} enabled - Whether sorting is enabled
 * @property {string} [defaultColumn] - Default column to sort by
 * @property {'asc'|'desc'} [defaultDirection] - Default sort direction
 */

/**
 * @typedef {Object} TableData
 * @property {string} [title] - Table title
 * @property {string} [subtitle] - Table subtitle
 * @property {string} [source] - Data source attribution
 * @property {Column[]} columns - Column definitions
 * @property {ColumnGroup[]} [columnGroups] - Column group definitions
 * @property {Object[]} data - Array of row data objects
 * @property {SearchConfig} [search] - Search configuration
 * @property {SortConfig} [sort] - Sort configuration
 */
