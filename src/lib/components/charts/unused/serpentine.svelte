<script>
	// SerpentineLayout.svelte

	/**
	 * @prop {number} itemCount - The total number of stations to display.
	 */
	export let itemCount = 25;

	/**
	 * @prop {number} containerHeight - The fixed height of the layout area in pixels.
	 */
	export let containerHeight = 400;

	/**
	 * @prop {number} boxSize - The diameter of each station circle in pixels.
	 */
	export let boxSize = 24;

	/**
	 * @prop {number} gap - The space between each station in pixels.
	 */
	export let gap = 80;

	// This will hold the measured width of the container div.
	let containerWidth = 0;

	// Reactive state for positions, lines, grid info, and new arrows.
	let positions = [];
	let lines = [];
	let arrows = [];
	let gridInfo = { cols: 0, rows: 0 };

	// This is the core logic, wrapped in a Svelte reactive block ($:).
	// It runs automatically whenever its dependencies change.
	$: {
		if (containerWidth > 0) {
			const effectiveBoxSize = boxSize + gap;
			const centerOffset = boxSize / 2;

			// 1. Calculate grid dimensions
			const calculatedCols = Math.max(1, Math.floor(containerWidth / effectiveBoxSize));
			const calculatedRows = Math.ceil(itemCount / calculatedCols);
			gridInfo = { cols: calculatedCols, rows: calculatedRows };

			// 2. Calculate station positions based on the serpentine pattern
			const newPositions = [];
			for (let i = 0; i < itemCount; i++) {
				const row = Math.floor(i / gridInfo.cols);
				const colInRow = i % gridInfo.cols;

				const isEvenRow = row % 2 === 0;
				const col = isEvenRow ? colInRow : gridInfo.cols - 1 - colInRow;

				newPositions.push({
					x: col * effectiveBoxSize,
					y: row * effectiveBoxSize
				});
			}
			positions = newPositions;

			// 3. Calculate SVG paths for the connecting subway line
			const newLines = [];
			if (positions.length > 1) {
				for (let i = 0; i < positions.length - 1; i++) {
					const startPos = positions[i];
					const endPos = positions[i + 1];
					const path = `M ${startPos.x + centerOffset},${startPos.y + centerOffset} L ${endPos.x + centerOffset},${endPos.y + centerOffset}`;
					newLines.push(path);
				}
			}
			lines = newLines;

			// 4. Calculate positions and rotations for directional arrows
			const newArrows = [];
			if (positions.length > 1) {
				for (let i = 0; i < positions.length - 1; i++) {
					const startPos = positions[i];
					const endPos = positions[i + 1];

					// Midpoint of the line segment for the arrow
					const midX = (startPos.x + endPos.x) / 2 + centerOffset;
					const midY = (startPos.y + endPos.y) / 2 + centerOffset;

					// Angle to rotate the arrow
					const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * (180 / Math.PI);

					newArrows.push({ x: midX, y: midY, rotation: angle });
				}
			}
			arrows = newArrows;
		}
	}
</script>

<div class="breakout-lg">
	<h3 class="mb-2 text-lg font-semibold text-gray-300">Subway Line Configuration</h3>
	<div class="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
		<div>
			<label for="itemCount" class="block text-sm font-medium text-gray-400"
				>Stations ({itemCount})</label
			>
			<input
				type="range"
				id="itemCount"
				bind:value={itemCount}
				min="1"
				max="100"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-600"
			/>
		</div>
		<div>
			<label for="boxSize" class="block text-sm font-medium text-gray-400"
				>Stop Size ({boxSize}px)</label
			>
			<input
				type="range"
				id="boxSize"
				bind:value={boxSize}
				min="10"
				max="50"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-600"
			/>
		</div>
		<div>
			<label for="gap" class="block text-sm font-medium text-gray-400">Spacing ({gap}px)</label>
			<input
				type="range"
				id="gap"
				bind:value={gap}
				min="20"
				max="150"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-600"
			/>
		</div>
		<div>
			<label for="height" class="block text-sm font-medium text-gray-400"
				>Height ({containerHeight}px)</label
			>
			<input
				type="range"
				id="height"
				bind:value={containerHeight}
				min="100"
				max="800"
				step="10"
				class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-600"
			/>
		</div>
	</div>

	<div
		class="mx relative w-full overflow-auto text-white"
		style="height: {containerHeight}px;"
		bind:clientWidth={containerWidth}
	>
		<!-- SVG layer for drawing the subway line and arrows -->
		<svg
			class="absolute top-0 left-0"
			style="width: {gridInfo.cols * (boxSize + gap)}px; height: {gridInfo.rows *
				(boxSize + gap)}px;"
		>
			<g>
				<!-- White "casing" for the line to make it pop -->
				{#each lines as d, i (i)}
					<path {d} class="stroke-black" stroke-width="10" stroke-linecap="round" fill="none" />
				{/each}
				<!-- The main colored subway line -->
				{#each lines as d, i (i)}
					<path {d} class="stroke-blue-500" stroke-width="6" stroke-linecap="round" fill="none" />
				{/each}
				<!-- Directional arrows -->
				{#each arrows as arrow, i (i)}
					{#if i % 2}
						<path
							d="M -12 -8 L 6 0 L -12 8 z"
							class="fill-white stroke-black"
							transform="translate({arrow.x}, {arrow.y}) rotate({arrow.rotation})"
						/>
					{/if}
				{/each}
			</g>
		</svg>

		<!-- HTML layer for the stations and labels -->
		{#each positions as pos, i (i)}
			<div
				class="absolute"
				style="
          width: {boxSize}px;
          height: {boxSize}px;
          transform: translate3d({pos.x}px, {pos.y}px, 0);
        "
			>
				<!-- Station Stop Circle -->
				<div class="h-full w-full rounded-full border-4 border-blue-500 bg-white"></div>

				<!-- Station Label -->
				<div
					class="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-0.5 text-sm whitespace-nowrap"
				>
					Station {i + 1}
				</div>
			</div>
		{/each}
	</div>
</div>
