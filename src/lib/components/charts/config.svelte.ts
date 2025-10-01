import { IsMobile } from '../../hooks/is-mobile.svelte';

const isMobile = new IsMobile();

/**
 * Responsive chart configuration that adapts to mobile/desktop
 * Uses the IsMobile hook to determine appropriate sizes
 */
export const chartConfig = {
	get responsive() {
		return {
			// Text sizes
			text: {
				title: isMobile.current ? 16 : 20,
				subtitle: isMobile.current ? 12 : 14,
				annotation: isMobile.current ? 11 : 14,
				annotationSmall: isMobile.current ? 9 : 10,
				axisLabel: isMobile.current ? 11 : 13,
				tickLabel: isMobile.current ? 10 : 12
			},

			// Chart dimensions
			chart: {
				height: isMobile.current ? 450 : 400,
				marginTop: isMobile.current ? 20 : 30,
				marginBottom: isMobile.current ? 50 : 70,
				marginLeft: isMobile.current ? 60 : 90,
				marginRight: isMobile.current ? 20 : 30,
				inset: isMobile.current ? 2 : 4
			},

			// Line and stroke widths
			stroke: {
				line: isMobile.current ? 1.5 : 2,
				annotation: isMobile.current ? 2 : 3,
				grid: isMobile.current ? 0.5 : 1,
				frame: isMobile.current ? 1 : 1.5
			},

			// Spacing and positioning
			spacing: {
				annotationPadding: isMobile.current ? 4 : 6,
				tickSize: isMobile.current ? 4 : 6,
				tickPadding: isMobile.current ? 6 : 8,
				lineHeight: 1.2
			},

			// Opacity values
			opacity: {
				difference: isMobile.current ? 0.3 : 0.5,
				grid: isMobile.current ? 0.3 : 0.3,
				gridStroke: isMobile.current ? 0.2 : 0.3
			},

			// Tick configuration
			ticks: {
				// Mobile gets fewer ticks to avoid crowding
				hourlyTicks: isMobile.current ? [0, 6, 12, 18] : [0, 3, 6, 9, 12, 15, 18, 21],
				maxTicks: isMobile.current ? 6 : 8
			}
		};
	},

	// Static configuration that doesn't change
	static: {
		// Grid patterns
		grid: {
			dashArray: "3,3"
		},

		// Font weights
		fontWeight: {
			normal: 400,
			medium: 500,
			semibold: 600,
			bold: 700
		},

		// Anchor positions
		anchor: {
			start: "start",
			middle: "middle",
			end: "end"
		},

		// Line anchor positions
		lineAnchor: {
			top: "top",
			middle: "middle",
			bottom: "bottom"
		},

		// Curve types
		curve: {
			stepAfter: "step-after",
			basis: "basis",
			linear: "linear"
		}
	},

	// Helper functions
	helpers: {
		// Get responsive annotation position
		getAnnotationPosition(baseX: number, baseY: number) {
			return {
				x: baseX,
				y: isMobile.current ? baseY * 0.85 : baseY // Slightly lower on mobile
			};
		},

		// Get responsive font size
		getFontSize(base: number) {
			return isMobile.current ? Math.max(base - 2, 9) : base;
		},

		// Get responsive margins
		getMargins(top: number, right: number, bottom: number, left: number) {
			const scale = isMobile.current ? 0.7 : 1;
			return {
				marginTop: Math.round(top * scale),
				marginRight: Math.round(right * scale),
				marginBottom: Math.round(bottom * scale),
				marginLeft: Math.round(left * scale)
			};
		},

		// Check if mobile
		get isMobile() {
			return isMobile.current;
		}
	}
};

// Export individual config sections for convenience
export const { responsive, static: staticConfig, helpers } = chartConfig;

// Type definitions for TypeScript support
export type ChartConfig = typeof chartConfig;
export type ResponsiveConfig = typeof chartConfig.responsive;
export type StaticConfig = typeof chartConfig.static;
export type ChartHelpers = typeof chartConfig.helpers;