<script>
	import CrowdSimulation from './station-sim.svelte';
	import SerpentineStations from './serpentine-stations.svelte';
	import agppSvg from '$lib/assets/stations/agppPlatformIn.svg?raw';
	import bgucSvg from '$lib/assets/stations/bgucPlatformIn.svg?raw';
	import bietSvg from '$lib/assets/stations/bietPlatformIn.svg?raw';

	let selectedStation = 'agpp';
	let peopleCount = 50;
	let particleSize = 2;
	let viewMode = 'single'; // 'single' or 'network'
	let stationCount = 6;

	const stations = {
		agpp: {
			name: 'Agara - Kamal Bagh (AGPP)',
			svg: agppSvg
		},
		bguc: {
			name: 'Bannerghatta Union College (BGUC)',
			svg: bgucSvg
		},
		biet: {
			name: 'Bangalore Institute of Engineering and Technology (BIET)',
			svg: bietSvg
		}
	};

	$: currentStation = stations[selectedStation];
</script>

<div class="demo-container">
	<div class="view-selector">
		<h3 class="mb-3 text-lg font-semibold">Station Crowd Simulation</h3>
		<div class="tabs">
			<button
				class="tab"
				class:active={viewMode === 'single'}
				on:click={() => (viewMode = 'single')}
			>
				Single Station
			</button>
			<button
				class="tab"
				class:active={viewMode === 'network'}
				on:click={() => (viewMode = 'network')}
			>
				Metro Network
			</button>
		</div>
	</div>

	{#if viewMode === 'single'}
		<div class="controls">
			<div class="control-group">
				<label for="station-select">Station:</label>
				<select id="station-select" bind:value={selectedStation}>
					{#each Object.entries(stations) as [key, station]}
						<option value={key}>{station.name}</option>
					{/each}
				</select>
			</div>

			<div class="control-group">
				<label for="people-count">People Count: {peopleCount}</label>
				<input id="people-count" type="range" min="10" max="500" bind:value={peopleCount} />
			</div>
		</div>

		<div class="simulation-wrapper">
			{#key selectedStation}
				<CrowdSimulation stationSvg={currentStation.svg} {peopleCount} {particleSize} />
			{/key}
		</div>
	{:else}
		<SerpentineStations
			{stationCount}
			stationSvg={currentStation.svg}
			{peopleCount}
			containerHeight={900}
			stationWidth={280}
			stationHeight={200}
			gap={10}
		/>
	{/if}
</div>

<style>
	.demo-container {
		max-width: 100%;
		margin: 0 auto;
	}

	.view-selector {
		margin-bottom: 2rem;
	}

	.tabs {
		display: flex;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		background: #f3f4f6;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.tab:hover {
		background: #e5e7eb;
	}

	.tab.active {
		background: #3b82f6;
		color: white;
	}

	.controls {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 1.5rem;
		background: #f8f9fa;
		border-radius: 8px;
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
		color: #555;
	}

	select,
	input[type='range'] {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	select {
		background: white;
	}

	input[type='range'] {
		cursor: pointer;
	}

	.simulation-wrapper {
		display: flex;
		justify-content: center;
		margin: 2rem 0;
		padding: 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
</style>
