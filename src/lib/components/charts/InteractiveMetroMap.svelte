<script>
	import { Plot, Line, Dot, Text, CustomMark, Pointer, Arrow } from 'svelteplot';
	import LanduseCanvas from './LandUseHexagonOverlay.svelte';
	import metroData from '$lib/data/metro.json';
	import stationOrder from '$lib/data/station-order.json';
	import landuseData from '$lib/data/charts/12-built_up_volume_hex.json';
	import roadsData from '$lib/data/roads.json';
	import areasData from '$lib/data/areas.json';
	import { initializeMetroData, getDisplayData } from '$lib/utils/metro-utils.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	let {
		widthProp = null,
		height = 500,
		mode = 'default',
		highlightStation = '',
		fromStation = '',
		toStation = '',
		scale = 1,
		stationRadius = 2.5,
		stationStrokeWidth = 0.5,
		zoom = 1,
		showLanduse = true,
		showBasemap = true
	} = $props();

	const isMobile = new IsMobile();
	let containerWidth = $state(0);
	const plotWidth = $derived(widthProp ?? containerWidth);
	const appState = $derived({ mode, highlightStation, fromStation, toStation, scale, zoom });

	const lineColors = {
		purple: 'var(--color-brand-purple)',
		green: 'var(--color-brand-green)',
		yellow: 'var(--color-brand-yellow)',
		black: 'var(--color-brown-800)'
	};

	const landuseHexColors = ['#f2e8cf', '#e8d5b7', '#ddbf8c', '#d4a574', '#c8956d', '#b07d62'];

	const baseContext = $derived(
		initializeMetroData(
			metroData,
			stationOrder,
			plotWidth,
			height,
			lineColors,
			showBasemap ? roadsData : null,
			showBasemap ? areasData : null,
			showLanduse ? { data: landuseData, colors: landuseHexColors } : null
		)
	);

	const display = $derived(getDisplayData(baseContext, appState));
	const baseLines = $derived(Array.from(baseContext?.lines.values() ?? []));
</script>

{#if showLanduse}
	<p class="mb-4 max-w-xl !leading-8 text-pretty">
		<span class="highlight landuse">Shaded areas</span> show commercial or industrial areas. Darker shades
		indicate higher density.
	</p>
{/if}
<div bind:clientWidth={containerWidth} style="touch-action: pan-y; position: relative;">
	{#if baseContext}
		{#if showLanduse && baseContext.landuse}
			<div style="position: absolute; top: 0; left: 0; z-index: 0;">
				<LanduseCanvas data={baseContext.landuse} width={plotWidth} {height} />
			</div>
		{/if}

		<Plot {height} width={plotWidth} inset={20} axes={false} class="bg-transparent">
			{#if showBasemap}
				{#each baseContext.lakes as lake}
					<CustomMark data={lake.points} x="x" y="y">
						{#snippet marks({ records })}
							<polygon
								points={records.map((r) => `${r.x},${r.y}`).join(' ')}
								fill="hsl(200 80% 80% / 0.7)"
							/>
						{/snippet}
					</CustomMark>
				{/each}

				{#each baseContext.parks as park}
					<CustomMark data={park.points} x="x" y="y">
						{#snippet marks({ records })}
							<polygon
								points={records.map((r) => `${r.x},${r.y}`).join(' ')}
								fill="hsl(120 60% 80% / 0.6)"
							/>
						{/snippet}
					</CustomMark>
				{/each}

				{#each baseContext.roads as roadPoints}
					<Line data={roadPoints} x="x" y="y" stroke="var(--color-neutral-300)" strokeWidth={0.5} />
				{/each}
			{/if}

			{#each baseLines as line}
				<Line
					data={line.points}
					x="x"
					y="y"
					stroke={lineColors[line.color] ?? 'var(--color-gray-500)'}
					strokeWidth={4}
					strokeLinecap="round"
					strokeLinejoin="round"
					opacity={mode === 'route' && fromStation ? 0.2 : 1}
				/>
			{/each}

			{#if mode === 'route' && display.routeSegments.length > 0}
				{#each display.routeSegments as segment}
					<Line
						data={segment.points}
						x="x"
						y="y"
						stroke={lineColors[segment.color] ?? 'var(--color-gray-500)'}
						strokeWidth={6}
						strokeLinecap="round"
						strokeLinejoin="round"
						opacity={1}
					/>
				{/each}
			{/if}

			<Dot
				data={display.stations}
				x="x"
				y="y"
				fill={(d) => d.fill}
				stroke={(d) => d.stroke}
				r={stationRadius}
				strokeWidth={stationStrokeWidth}
				title={(d) => d.name}
			/>

			<Text
				data={display.labels}
				x="x"
				y="y"
				text={(d) => d.name}
				fontSize={(d) =>
					mode === 'route' && (d.code === fromStation || d.code === toStation) ? 12 : 13}
				fill={(d) =>
					mode === 'route' && (d.code === fromStation || d.code === toStation)
						? 'var(--color-foreground)'
						: 'var(--color-black)'}
				stroke="var(--color-background)"
				strokeWidth={(d) =>
					mode === 'route' && (d.code === fromStation || d.code === toStation) ? 3 : 2.5}
				paintOrder="stroke"
				dy={(d) =>
					mode === 'route' && (d.code === fromStation || d.code === toStation) ? -12 : -10}
				textAnchor="middle"
				fontWeight={(d) =>
					mode === 'route' && (d.code === fromStation || d.code === toStation) ? 600 : 400}
			/>

			<Pointer data={display.stations} x="x" y="y" maxDistance={20}>
				{#snippet children({ data: pointedStations })}
					{#if pointedStations.length > 0}
						<Dot
							data={pointedStations}
							x="x"
							y="y"
							r={6}
							strokeWidth={2}
							stroke="var(--color-neutral-900)"
							fill="var(--color-neutral-600)"
						/>
						<Text
							data={pointedStations}
							x="x"
							y="y"
							text={(d) => d.name}
							fontSize={14}
							fill="var(--color-foreground)"
							stroke="var(--color-background)"
							strokeWidth={4}
							paintOrder="stroke"
							dy={(d) => (d.isInterchange ? -15 : -12)}
							textAnchor="middle"
							fontFamily="var(--font-sans)"
							fontWeight={600}
						/>
					{/if}
				{/snippet}
			</Pointer>
		</Plot>
	{/if}
</div>

<style>
	.highlight {
		padding: 1px 8px;
		font-weight: bold;
		border-radius: 4px;
		border: solid 2px;
		margin: 0;
	}

	.highlight.landuse {
		background-color: var(--color-brown-100);
		border-color: color-mix(in srgb, var(--color-brown-300) 50%, var(--color-brown-900));
		color: var(--color-brown-800);
	}
</style>
