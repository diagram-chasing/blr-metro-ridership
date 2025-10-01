import * as d3 from 'd3';

/**
 * Available D3 color scale types
 */
export const COLOR_SCALE_TYPES = {
	// Sequential scales
	BLUES: 'blues',
	GREENS: 'greens',
	ORANGES: 'oranges',
	REDS: 'reds',
	PURPLES: 'purples',
	GREYS: 'greys',

	// Sequential multi-hue
	VIRIDIS: 'viridis',
	PLASMA: 'plasma',
	INFERNO: 'inferno',
	MAGMA: 'magma',
	CIVIDIS: 'cividis',
	TURBO: 'turbo',

	// Diverging scales
	RD_BU: 'rdbu',
	RD_YL_BU: 'rdylbu',
	RD_GY: 'rdgy',
	RD_YL_GN: 'rdylgn',
	SPECTRAL: 'spectral',
	BR_BG: 'brbg',
	PI_YG: 'piyg',
	PR_GN: 'prgn',
	PU_OR: 'puor',

	// Custom site-themed scales
	CBFC_BLUE: 'cbfc_blue',
	CBFC_GREEN: 'cbfc_green',
	CBFC_YELLOW: 'cbfc_yellow',
	CBFC_RED: 'cbfc_red',
	CBFC_SEPIA: 'cbfc_sepia',
	CBFC_SEPIA_WARM: 'cbfc_sepia_warm',
	CBFC_SEPIA_COOL: 'cbfc_sepia_cool',
	CBFC_NEUTRAL: 'cbfc_neutral',
	CBFC_DIVERGING_RED_BLUE: 'cbfc_red_blue',
	CBFC_DIVERGING_WARM_COOL: 'cbfc_warm_cool'
};

/**
 * Custom color interpolators based on CBFC Watch brand colors
 */
const customInterpolators = {
	// Single color scales - light to dark
	cbfc_blue: d3.interpolateRgb('#FEFBF7', '#5d98b6'),
	cbfc_green: d3.interpolateRgb('#FEFBF7', '#8c9c74'),
	cbfc_yellow: d3.interpolateRgb('#FEFBF7', '#edbb5f'),
	cbfc_red: d3.interpolateRgb('#FEFBF7', '#db5441'),

	// Sepia-based scales
	cbfc_sepia: d3.interpolateRgb('#FEFBF7', '#BFB2A2'),
	cbfc_sepia_warm: d3.interpolateRgb('#FEFBF7', '#3C3332'),
	cbfc_sepia_cool: d3.interpolateRgb('#F4E4C9', '#151e28'),
	cbfc_neutral: d3.interpolateRgb('#F0E9E0', '#BFB2A2'),

	// Diverging scales
	cbfc_red_blue: (t) => {
		if (t < 0.5) {
			return d3.interpolateRgb('#db5441', '#F0E9E0')(t * 2);
		} else {
			return d3.interpolateRgb('#F0E9E0', '#5d98b6')((t - 0.5) * 2);
		}
	},
	cbfc_warm_cool: (t) => {
		if (t < 0.5) {
			return d3.interpolateRgb('#edbb5f', '#F4E4C9')(t * 2);
		} else {
			return d3.interpolateRgb('#F4E4C9', '#151e28')((t - 0.5) * 2);
		}
	}
};

/**
 * Map scale types to D3 interpolators
 */
const scaleInterpolators = {
	// Sequential
	blues: d3.interpolateBlues,
	greens: d3.interpolateGreens,
	oranges: d3.interpolateOranges,
	reds: d3.interpolateReds,
	purples: d3.interpolatePurples,
	greys: d3.interpolateGreys,

	// Sequential multi-hue
	viridis: d3.interpolateViridis,
	plasma: d3.interpolatePlasma,
	inferno: d3.interpolateInferno,
	magma: d3.interpolateMagma,
	cividis: d3.interpolateCividis,
	turbo: d3.interpolateTurbo,

	// Diverging
	rdbu: d3.interpolateRdBu,
	rdylbu: d3.interpolateRdYlBu,
	rdgy: d3.interpolateRdGy,
	rdylgn: d3.interpolateRdYlGn,
	spectral: d3.interpolateSpectral,
	brbg: d3.interpolateBrBG,
	piyg: d3.interpolatePiYG,
	prgn: d3.interpolatePRGn,
	puor: d3.interpolatePuOr,

	// Custom
	...customInterpolators
};

/**
 * Create a D3 color scale for table cells
 * @param {Array} values - Array of numeric values
 * @param {string} scaleType - Type of color scale to use
 * @param {Object} options - Scale options
 * @returns {Object} Scale object with domain, range, and color function
 */
export function createColorScale(values, scaleType = COLOR_SCALE_TYPES.BLUES, options = {}) {
	const { domain = null, range = [0, 1], clamp = true, reverse = false, nice = true } = options;

	// Filter and clean values
	const numericValues = values
		.map((v) => {
			if (typeof v === 'string') {
				const cleaned = v.replace(/[^0-9.-]/g, '');
				return parseFloat(cleaned);
			}
			return Number(v);
		})
		.filter((v) => !isNaN(v) && isFinite(v));

	if (numericValues.length === 0) {
		return {
			domain: [0, 1],
			getColor: () => '#f5f5f5',
			getIntensity: () => 0
		};
	}

	// Create domain
	const extent = domain || d3.extent(numericValues);
	const scaleDomain = nice ? d3.scaleLinear().domain(extent).nice().domain() : extent;

	// Get interpolator
	const interpolator = scaleInterpolators[scaleType] || scaleInterpolators.blues;

	// Create the scale
	const scale = d3
		.scaleSequential(interpolator)
		.domain(reverse ? [scaleDomain[1], scaleDomain[0]] : scaleDomain);

	if (clamp) {
		scale.clamp(true);
	}

	return {
		domain: scaleDomain,
		getColor: (value) => {
			const numValue =
				typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);

			if (isNaN(numValue) || !isFinite(numValue)) return '#f5f5f5';

			return scale(numValue);
		},
		getIntensity: (value) => {
			const numValue =
				typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : Number(value);

			if (isNaN(numValue) || !isFinite(numValue)) return 0;

			// Normalize to 0-1 based on domain
			return Math.max(
				0,
				Math.min(1, (numValue - scaleDomain[0]) / (scaleDomain[1] - scaleDomain[0]))
			);
		}
	};
}

/**
 * Create multiple color scales for table columns
 * @param {Array} data - Table data array
 * @param {Array} columns - Column definitions
 * @returns {Object} Map of column keys to color scales
 */
export function createTableColorScales(data, columns) {
	const scales = {};

	columns.forEach((column) => {
		if (column.colorScale) {
			const values = data.map((row) => row[column.key]);
			scales[column.key] = createColorScale(values, column.colorScale, column.colorScaleOptions);
		}
	});

	return scales;
}

/**
 * Get contrasting text color for a background color
 * @param {string} backgroundColor - Hex color string
 * @returns {string} Either 'white' or 'black'
 */
export function getContrastingTextColor(backgroundColor) {
	// Convert hex to RGB
	const rgb = d3.rgb(backgroundColor);

	// Calculate luminance
	const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

	return luminance > 0.5 ? 'black' : 'white';
}

/**
 * Get CBFC brand colors for treemap visualization
 * @param {number} primaryCount - Number of items to color with brand colors
 * @returns {Object} Object with brand colors and gray shades
 */
export function getTreemapColors(primaryCount = 1) {
	const brandColors = [
		'var(--color-sepia-dark)', // #3C3332
		'var(--color-blue)', // #5d98b6
		'var(--color-green)', // #8c9c74
		'var(--color-yellow)', // #edbb5f
		'var(--color-red)' // #db5441
	];

	const grayShades = [
		'var(--color-gray-400)',
		'var(--color-gray-300)',
		'var(--color-gray-200)',
		'var(--color-gray-100)'
	];

	return {
		brandColors: brandColors.slice(0, primaryCount),
		grayShades
	};
}

/**
 * Get all available color scale options for UI
 * @returns {Array} Array of scale options with labels and values
 */
export function getColorScaleOptions() {
	return [
		// Sequential
		{ label: 'Blues', value: COLOR_SCALE_TYPES.BLUES, category: 'Sequential' },
		{ label: 'Greens', value: COLOR_SCALE_TYPES.GREENS, category: 'Sequential' },
		{ label: 'Oranges', value: COLOR_SCALE_TYPES.ORANGES, category: 'Sequential' },
		{ label: 'Reds', value: COLOR_SCALE_TYPES.REDS, category: 'Sequential' },
		{ label: 'Purples', value: COLOR_SCALE_TYPES.PURPLES, category: 'Sequential' },
		{ label: 'Greys', value: COLOR_SCALE_TYPES.GREYS, category: 'Sequential' },

		// Multi-hue
		{ label: 'Viridis', value: COLOR_SCALE_TYPES.VIRIDIS, category: 'Multi-hue' },
		{ label: 'Plasma', value: COLOR_SCALE_TYPES.PLASMA, category: 'Multi-hue' },
		{ label: 'Inferno', value: COLOR_SCALE_TYPES.INFERNO, category: 'Multi-hue' },
		{ label: 'Magma', value: COLOR_SCALE_TYPES.MAGMA, category: 'Multi-hue' },
		{ label: 'Cividis', value: COLOR_SCALE_TYPES.CIVIDIS, category: 'Multi-hue' },
		{ label: 'Turbo', value: COLOR_SCALE_TYPES.TURBO, category: 'Multi-hue' },

		// Diverging
		{ label: 'Red-Blue', value: COLOR_SCALE_TYPES.RD_BU, category: 'Diverging' },
		{ label: 'Red-Yellow-Blue', value: COLOR_SCALE_TYPES.RD_YL_BU, category: 'Diverging' },
		{ label: 'Spectral', value: COLOR_SCALE_TYPES.SPECTRAL, category: 'Diverging' },

		// CBFC Custom Scales
		{ label: 'CBFC Blue', value: COLOR_SCALE_TYPES.CBFC_BLUE, category: 'CBFC Theme' },
		{ label: 'CBFC Green', value: COLOR_SCALE_TYPES.CBFC_GREEN, category: 'CBFC Theme' },
		{ label: 'CBFC Yellow', value: COLOR_SCALE_TYPES.CBFC_YELLOW, category: 'CBFC Theme' },
		{ label: 'CBFC Red', value: COLOR_SCALE_TYPES.CBFC_RED, category: 'CBFC Theme' },
		{ label: 'CBFC Sepia', value: COLOR_SCALE_TYPES.CBFC_SEPIA, category: 'CBFC Theme' },
		{ label: 'CBFC Sepia Warm', value: COLOR_SCALE_TYPES.CBFC_SEPIA_WARM, category: 'CBFC Theme' },
		{ label: 'CBFC Sepia Cool', value: COLOR_SCALE_TYPES.CBFC_SEPIA_COOL, category: 'CBFC Theme' },
		{ label: 'CBFC Neutral', value: COLOR_SCALE_TYPES.CBFC_NEUTRAL, category: 'CBFC Theme' },
		{
			label: 'CBFC Red-Blue',
			value: COLOR_SCALE_TYPES.CBFC_DIVERGING_RED_BLUE,
			category: 'CBFC Diverging'
		},
		{
			label: 'CBFC Warm-Cool',
			value: COLOR_SCALE_TYPES.CBFC_DIVERGING_WARM_COOL,
			category: 'CBFC Diverging'
		}
	];
}
