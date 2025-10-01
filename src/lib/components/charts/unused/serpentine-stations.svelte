<script>
	import CrowdSimulation from './station-sim.svelte';

	/**
	 * @prop {number} stationCount - The total number of stations to display.
	 */
	export let stationCount = 8;

	/**
	 * @prop {string} stationSvg - The SVG content for each station.
	 */
	export let stationSvg = '';

	/**
	 * @prop {number} containerHeight - The fixed height of the layout area in pixels.
	 */
	export let containerHeight = 600;

	/**
	 * @prop {number} stationWidth - The width of each station in pixels.
	 */
	export let stationWidth = 280;

	/**
	 * @prop {number} stationHeight - The height of each station in pixels.
	 */
	export let stationHeight = 320;

	/**
	 * @prop {number} gap - The space between each station in pixels.
	 */
	export let gap = 40;

	/**
	 * @prop {number} peopleCount - Number of people to simulate at each station.
	 */
	export let peopleCount = 30;

	/**
	 * @prop {boolean} showConnections - Whether to show connecting lines between stations.
	 */
	export let showConnections = true;

	// This will hold the measured width of the container div.
	let containerWidth = 0;

	// Reactive state for positions, lines, and grid info.
	let positions = [];
	let lines = [];
	let gridInfo = { cols: 0, rows: 0 };

	// This is the core layout logic from serpentine.svelte, adapted for stations.
	$: {
		if (containerWidth > 0) {
			const effectiveStationWidth = stationWidth + gap;
			const centerOffsetX = stationWidth / 2;
			const centerOffsetY = stationHeight / 2;

			// 1. Calculate grid dimensions
			const calculatedCols = Math.max(1, Math.floor(containerWidth / effectiveStationWidth));
			const calculatedRows = Math.ceil(stationCount / calculatedCols);
			gridInfo = { cols: calculatedCols, rows: calculatedRows };

			// 2. Calculate station positions based on the serpentine pattern
			const newPositions = [];
			for (let i = 0; i < stationCount; i++) {
				const row = Math.floor(i / gridInfo.cols);
				const colInRow = i % gridInfo.cols;

				const isEvenRow = row % 2 === 0;
				const col = isEvenRow ? colInRow : gridInfo.cols - 1 - colInRow;

				// For odd rows, we need to rotate the station 180 degrees for proper connection
				const rotation = isEvenRow ? 0 : 180;

				newPositions.push({
					x: col * effectiveStationWidth,
					y: row * (stationHeight + gap),
					rotation: rotation,
					id: i
				});
			}
			positions = newPositions;

			// 3. Calculate continuous metro line path inspired by tube-map logic
			const newLines = [];
			if (positions.length > 1 && showConnections) {
				// Build one continuous path for the entire serpentine line
				let path = '';

				for (let i = 0; i < positions.length; i++) {
					const pos = positions[i];
					const currentRow = Math.floor(i / gridInfo.cols);
					const colInRow = i % gridInfo.cols;

					// Calculate connection points based on station rotation and position in serpentine
					let connectionX, connectionY;

					if (i === 0) {
						// First station: start from right side (exit)
						connectionX = pos.x + stationWidth;
						connectionY = pos.y + centerOffsetY;
						path += `M${connectionX},${connectionY}`;
					} else {
						const prevPos = positions[i - 1];
						const prevRow = Math.floor((i - 1) / gridInfo.cols);
						const prevColInRow = (i - 1) % gridInfo.cols;

						if (currentRow === prevRow) {
							// Same row: straight horizontal connection
							if (pos.rotation === 0) {
								// Even row: connect to left side of current station
								connectionX = pos.x;
							} else {
								// Odd row: connect to right side of current station
								connectionX = pos.x + stationWidth;
							}
							connectionY = pos.y + centerOffsetY;
							path += `L${connectionX},${connectionY}`;
						} else {
							// Different row: this means we're at the start of a new row
							// The curve should come from the END of the previous row
							const prevConnectionX = prevPos.rotation === 0 ? prevPos.x + stationWidth : prevPos.x;
							const prevConnectionY = prevPos.y + centerOffsetY;

							// Determine entry point for current station
							if (pos.rotation === 0) {
								connectionX = pos.x; // Even row: enter from left
							} else {
								connectionX = pos.x + stationWidth; // Odd row: enter from right
							}
							connectionY = pos.y + centerOffsetY;

							// Create smooth serpentine curve with intermediate point
							const deltaX = connectionX - prevConnectionX;
							const deltaY = connectionY - prevConnectionY;

							// Add horizontal extension after last station for smoother curve
							const extensionLength = Math.min(80, Math.abs(deltaX) * 0.8);
							const intermediateX =
								prevConnectionX + (deltaX > 0 ? extensionLength : -extensionLength);
							const intermediateY = prevConnectionY;

							// Go horizontally from last station to intermediate point
							path += `L${intermediateX},${intermediateY}`;

							// Create smooth curve from intermediate point to approach point of next station
							const approachX =
								connectionX + (deltaX > 0 ? -extensionLength * 0.9 : extensionLength * 0.9);
							const approachY = connectionY;

							// Use quadratic curve for the vertical transition
							const controlX = intermediateX;
							const controlY = intermediateY + deltaY * 0.7;

							path += `Q${controlX},${controlY},${approachX},${approachY}`;

							// Finally connect horizontally to the station
							path += `L${connectionX},${connectionY}`;
						}
					}
				}

				if (path) {
					newLines.push(path);
				}
			}
			lines = newLines;
		}
	}
</script>

<div class="breakout-lg">
	<h3 class="mb-4 text-xl font-semibold">Metro Line with Live Station Crowds</h3>

	<div class="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div>
			<label for="stationCount" class="block text-sm font-medium text-gray-600">
				Stations ({stationCount})
			</label>
			<input
				type="range"
				id="stationCount"
				bind:value={stationCount}
				min="2"
				max="20"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
			/>
		</div>
		<div>
			<label for="peopleCount" class="block text-sm font-medium text-gray-600">
				Crowd Size ({peopleCount})
			</label>
			<input
				type="range"
				id="peopleCount"
				bind:value={peopleCount}
				min="10"
				max="150"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
			/>
		</div>
		<div>
			<label for="gap" class="block text-sm font-medium text-gray-600">
				Spacing ({gap}px)
			</label>
			<input
				type="range"
				id="gap"
				bind:value={gap}
				min="20"
				max="100"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
			/>
		</div>
		<div>
			<label for="height" class="block text-sm font-medium text-gray-600">
				Height ({containerHeight}px)
			</label>
			<input
				type="range"
				id="height"
				bind:value={containerHeight}
				min="300"
				max="800"
				step="50"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300"
			/>
		</div>
	</div>

	<div class="mb-4">
		<label class="flex items-center gap-2">
			<input type="checkbox" bind:checked={showConnections} />
			<span class="text-sm font-medium text-gray-600">Show metro line connections</span>
		</label>
	</div>

	<div
		class="relative w-full overflow-auto rounded-lg bg-gray-100 p-4"
		style="height: {containerHeight}px;"
		bind:clientWidth={containerWidth}
	>
		<!-- SVG layer for drawing the metro line connections -->
		{#if showConnections}
			<svg
				class="pointer-events-none absolute top-4 left-4"
				style="width: {Math.max(gridInfo.cols * (stationWidth + gap), containerWidth)}px;
				       height: {Math.max(gridInfo.rows * (stationHeight + gap), containerHeight)}px;"
			>
				<g>
					<!-- Shadow/outer casing for depth -->
					{#each lines as d, i (i)}
						<path
							{d}
							class="stroke-gray-400"
							stroke-width="12"
							stroke-linecap="round"
							fill="none"
							opacity="0.3"
						/>
					{/each}
					<!-- White casing for the metro line -->
					{#each lines as d, i (i)}
						<path {d} class="stroke-white" stroke-width="10" stroke-linecap="round" fill="none" />
					{/each}
					<!-- Main colored metro line -->
					{#each lines as d, i (i)}
						<path {d} class="stroke-blue-600" stroke-width="6" stroke-linecap="round" fill="none" />
					{/each}
					<!-- Inner highlight line for depth -->
					{#each lines as d, i (i)}
						<path
							{d}
							class="stroke-blue-300"
							stroke-width="2"
							stroke-linecap="round"
							fill="none"
							opacity="0.6"
						/>
					{/each}
				</g>
			</svg>
		{/if}

		<!-- Station layer with crowd simulations -->
		{#each positions as pos, i (pos.id)}
			<div
				class="absolute"
				style="
					width: {stationWidth}px;
					height: {stationHeight}px;
					transform: translate3d({pos.x}px, {pos.y}px, 0) rotate({pos.rotation}deg);
				"
			>
				<!-- Station with crowd simulation -->
				{#if stationSvg}
					{#key `${pos.id}-${pos.rotation}`}
						<CrowdSimulation
							{stationSvg}
							{peopleCount}
							particleSize={2}
							densityColor="70, 130, 220"
							particleColor="255, 100, 100"
							clusterRadius={15}
							densityBandwidth={6}
						/>
					{/key}
				{:else}
					<!-- Fallback station representation -->
					<div
						class="flex h-full w-full items-center justify-center rounded border-2 border-gray-400 bg-gray-300"
					>
						<span class="text-xs font-semibold text-gray-600">Station {i + 1}</span>
					</div>
				{/if}

				<!-- Station label -->
				<div
					class="absolute -top-6 left-1/2 z-10 -translate-x-1/2 rounded bg-gray-800 px-2 py-1 text-xs whitespace-nowrap text-white"
					style="transform: translateX(-50%) rotate(-{pos.rotation}deg);"
				>
					Station {i + 1}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Custom range slider styling */
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
	}

	input[type='range']::-webkit-slider-track {
		background: #e5e7eb;
		height: 8px;
		border-radius: 4px;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		background: #3b82f6;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		cursor: pointer;
		margin-top: -6px;
	}

	input[type='range']::-moz-range-track {
		background: #e5e7eb;
		height: 8px;
		border-radius: 4px;
		border: none;
	}

	input[type='range']::-moz-range-thumb {
		background: #3b82f6;
		height: 20px;
		width: 20px;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}
</style>
