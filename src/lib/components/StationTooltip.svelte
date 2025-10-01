<script>
	import * as Tooltip from '$lib/components/ui/tooltip/index.ts';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import MetroMap from '$charts/InteractiveMetroMap.svelte';
	import stationCodes from '$lib/data/charts/station-codes.json';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';

	let { children, station } = $props();

	// Find the station code and line from the station name
	const stationData = stationCodes.find((s) => s.Station === station);
	const stationCode = stationData?.code || '';
	const lineClass = stationData?.line || '';

	const isMobile = new IsMobile();
</script>

{#if isMobile.current}
	<!-- Mobile: Use Popover -->
	<Popover.Root>
		<Popover.Trigger class="line {lineClass}">
			{@render children()}
		</Popover.Trigger>
		<Popover.Content class="w-auto border-none p-0 shadow-2xs">
			<div class="h-[200px] w-[200px] overflow-hidden rounded-lg border bg-background">
				<MetroMap
					height={200}
					widthProp={200}
					mode="highlight"
					showLanduse={false}
					zoom={51}
					highlightStation={stationCode}
					stationRadius={1.5}
					stationStrokeWidth={0.1}
				/>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else}
	<!-- Desktop: Use Tooltip -->
	<Tooltip.Provider>
		<Tooltip.Root delayDuration={50}>
			<Tooltip.Trigger class="line {lineClass}">
				{@render children()}
			</Tooltip.Trigger>
			<Tooltip.Content class="border-none p-0">
				<Tooltip.Arrow class="fill-white" />
				<div class="h-[250px] w-[250px] overflow-hidden rounded-lg border bg-background">
					<MetroMap
						height={250}
						widthProp={250}
						mode="highlight"
						showLanduse={false}
						zoom={51}
						highlightStation={stationCode}
						stationRadius={1.5}
						stationStrokeWidth={0.1}
					/>
				</div>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
