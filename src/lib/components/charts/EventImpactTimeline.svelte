<script lang="ts">
	import { Plot, Line, RuleX, Text, GridY, Rect, RuleY } from 'svelteplot';
	import spikeStationsDaily from '$lib/data/charts/09-station-spike-daily.json';
	import { chartConfig } from './config.svelte';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	type DailyRow = {
		Station: string;
		Line: 'Green' | 'Purple' | string;
		Date: string; // YYYY-MM-DD
		Total: number;
	};

	const data: DailyRow[] = (spikeStationsDaily as any).data;
	const stations: string[] = ((spikeStationsDaily as any).stations as (string | null)[]).filter(
		(s): s is string => s !== null
	);
	const window = (spikeStationsDaily as any).window as { start: string; end: string };

	// Line colors consistent with site theme
	const stationColor: Record<string, string> = {
		Mahalakshmi: 'var(--color-brand-orange)',
		Lalbagh: 'var(--color-brand-green)',
		'Vidhana Soudha': 'var(--color-brand-purple)'
	};

	// Convert to JS Date for x domain and spike window
	const parseDate = (s: string) => new Date(s);
	const xMin = parseDate('2025-08-01T00:00:00Z');
	const xMax = parseDate('2025-08-19T00:00:00Z');
	const spikeStart = parseDate(`${window.start}T00:00:00Z`);
	const spikeEnd = parseDate(`${window.end}T00:00:00Z`);
	const yellowOpening = parseDate('2025-08-11T00:00:00Z');

	// Group data by station (already daily)
	type SeriesRow = { date: string; total: number };
	const dailyByStation: Record<string, SeriesRow[]> = Object.fromEntries(
		stations.map((s) => [
			s,
			data
				.filter((d) => d.Station === s)
				.map((d) => ({ date: d.Date, total: d.Total }))
				.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
		])
	);

	// Y domain from daily totals
	const yMax =
		Math.max(
			...Object.values(dailyByStation)
				.flat()
				.map((d) => d.total)
		) * 1.1;

	// Responsive config
	let config = $derived(chartConfig.responsive);

	type WeekendInterval = { start: Date; end: Date; label: string };
	function enumerateWeekends(
		min: Date,
		max: Date,
		specialStart: Date,
		specialEnd: Date
	): WeekendInterval[] {
		const weekends: WeekendInterval[] = [];
		const cur = new Date(min.getTime());
		cur.setUTCHours(0, 0, 0, 0);
		while (cur <= max) {
			if (cur.getUTCDay() === 6) {
				const start = new Date(cur.getTime()); // Saturday 00:00
				const end = new Date(start.getTime());
				end.setUTCDate(end.getUTCDate() + 2); // Standard weekend end boundary
				const overlapsSpecial = !(end < specialStart || start > specialEnd);
				if (overlapsSpecial) {
					weekends.push({
						start: specialStart,
						end: specialEnd,
						label: 'Independence Day weekend'
					});
				} else {
					weekends.push({ start, end, label: 'Weekend' });
				}
			}
			cur.setUTCDate(cur.getUTCDate() + 1);
		}
		const seen = new Set<string>();
		return weekends.filter((w) => {
			const key = `${w.start.toISOString()}-${w.end.toISOString()}-${w.label}`;
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	}
	const weekendIntervals = enumerateWeekends(xMin, xMax, spikeStart, spikeEnd);

	// Create rect data for weekend highlighting
	const weekendRects = weekendIntervals.map((w) => ({
		x1: w.start,
		x2: w.end,
		y1: 0,
		y2: yMax,
		label: w.label
	}));

	// Helper function to break long station names into multiline text
	function getMultilineStationName(station: string, maxLength = 15): string {
		// If station name is short enough, return as is
		if (station.length <= maxLength) {
			return station;
		}

		const words = station.split(/[\s,-]+/);
		if (words.length === 1) {
			// Single long word, break at maxLength
			return station.slice(0, maxLength) + '\n' + station.slice(maxLength);
		}

		let line1 = '';
		let line2 = '';
		let currentLength = 0;

		for (const word of words) {
			if (currentLength + word.length + 1 <= maxLength) {
				line1 += (line1 ? ' ' : '') + word;
				currentLength += word.length + (line1 === word ? 0 : 1);
			} else {
				line2 += (line2 ? ' ' : '') + word;
			}
		}

		// If line2 is still too long, truncate it
		if (line2.length > maxLength) {
			line2 = line2.slice(0, maxLength - 1) + '…';
		}

		return line1 + (line2 ? '\n' + line2 : '');
	}

	const isMobile = new IsMobile();
</script>

<!-- Screen reader accessible data summary -->
<div class="sr-only">
	<p>
		This chart shows daily ridership patterns for three major metro stations during a significant
		period in August 2025. Key findings:
	</p>
	<ul>
		<li>Mahalakshmi station (Orange line) shows consistent high ridership</li>
		<li>Lalbagh station (Green line) demonstrates steady usage patterns</li>
		<li>Dr. B. R. Ambedkar Station shows significant variations during special events</li>
		<li>Yellow Line opening on August 11th created notable ridership changes</li>
		<li>Independence Day weekend (Aug 15-17) shows distinct usage patterns</li>
	</ul>
</div>

<div class="breakout-sm my-6">
	<Plot
		aria-labelledby="spike-title"
		aria-describedby="spike-description"
		height={350}
		marginRight={isMobile.current ? 90 : 100}
		x={{
			type: 'time',
			domain: [xMin, xMax],
			label: 'Date',
			grid: false,
			tickFormat: (d) => new Date(d).getUTCDate().toString()
		}}
		y={{
			domain: [0, yMax],
			label: 'Daily Ridership',
			interval: 5000,
			axis: 'left',

			tickFormat: (d) => `${Math.round(d / 1000)}K`
		}}
		axes={true}
	>
		<GridY strokeDasharray="2,4" opacity={0.9} />
		<RuleY data={[0]} stroke="black" strokeWidth={1} />

		<!-- Weekend rect highlighting -->
		<Rect
			data={weekendRects}
			x1="x1"
			x2="x2"
			y1="y1"
			y2="y2"
			fill={(d) =>
				d.label.includes('Independence') ? 'var(--color-brand-orange)' : 'var(--color-gray-500)'}
			fillOpacity={0.09}
			stroke="transparent"
		/>

		<!-- Yellow Line opening marker -->
		<RuleX x={yellowOpening} stroke="#FFB000" strokeWidth={3} />

		{#each stations as s}
			<Line
				data={dailyByStation[s]}
				x={(d) => new Date(`${d.date}T12:00:00Z`)}
				y="total"
				stroke={stationColor[s] ?? 'var(--color-muted)'}
				strokeWidth={config.stroke.line}
				curve="step-before"
				opacity={0.95}
			/>
		{/each}

		<!-- Direct station labels on lines -->
		{#each Object.entries(stationColor) as [station, color]}
			{@const stationData = dailyByStation[station]}
			{@const lastPoint =
				stationData && stationData.length > 0 ? stationData[stationData.length - 1] : null}
			{@const multilineLabel = getMultilineStationName(station)}
			{#if lastPoint}
				<Text
					x={new Date(`${lastPoint.date}T18:00:00Z`)}
					y={lastPoint.total}
					text={multilineLabel}
					fontSize={config.text.annotation * 0.95}
					fill={color}
					stroke="var(--color-background)"
					strokeWidth={2}
					fontWeight="600"
					textAnchor="start"
					dx={8}
				/>
			{/if}
		{/each}

		{#each weekendIntervals as w}
			<Text
				x={new Date(w.start.getTime() + (w.end.getTime() - w.start.getTime()) / 2)}
				y={yMax * (w.label.includes('Independence') ? 0.15 : 0.05)}
				text={w.label}
				fontSize={config.text.annotation * 0.9}
				fill={w.label.includes('Independence')
					? 'var(--color-brand-orange)'
					: 'var(--color-foreground)'}
				stroke="var(--color-background)"
				strokeWidth={1}
				fontWeight="500"
			/>
		{/each}

		<Text
			x={new Date('2025-08-16T12:00:00Z')}
			y={yMax * 0.95}
			text="25K commuters"
			fontSize={config.text.annotation * 0.9}
			fill="var(--color-brand-orange)"
			stroke="var(--color-background)"
			strokeWidth={2}
			fontWeight="bold"
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
