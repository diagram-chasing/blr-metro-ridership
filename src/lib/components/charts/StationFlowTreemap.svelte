<script lang="ts">
	import { onMount } from 'svelte';
	import { hierarchy, treemap } from 'd3-hierarchy';
	import { format } from 'd3';
	import { Plot, Rect, Text } from 'svelteplot';
	import stationCodes from '$lib/data/charts/station-codes.json';
	import routeData from '$lib/data/charts/04-commute-flow.json';

	// UI Components
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	// Number formatter
	const formatNumber = format(',');

	// State
	let selectedStation = $state('Cubbon Park');
	let containerEl: HTMLElement | null = $state(null);
	let containerWidth = $state(800);
	let activeNode: any | null = $state(null);
	let isPinned = $state(false);
	let popoverOpen = $state(false);

	// Station data processing
	const stationData = {
		codeToInfo: new Map(stationCodes.map((s) => [s.code, { name: s.Station, line: s.line }])),
		nameToCode: new Map(stationCodes.map((s) => [s.Station, s.code])),
		options: stationCodes
			.map((s) => ({ value: s.Station, label: s.Station }))
			.sort((a, b) => a.label.localeCompare(b.label))
	};

	const lineColors = {
		purple: 'var(--color-brand-purple)',
		green: 'var(--color-brand-green)',
		yellow: 'var(--color-brand-yellow)',
		black: '#000000',
		unknown: '#666666'
	};

	function getStationColor(line: string, stationName?: string) {
		if (stationName === 'RV Road' || stationName === 'Majestic') return lineColors.black;
		const key = line?.toLowerCase() as keyof typeof lineColors;
		return lineColors[key] || lineColors.unknown;
	}

	function pickTextColor(bgHex: string) {
		try {
			const [r, g, b] = (bgHex.match(/\w\w/g) || []).map((hex) => parseInt(hex, 16));
			const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
			return luma > 140 ? '#000000' : '#ffffff';
		} catch {
			return '#ffffff';
		}
	}

	// Update container width on resize
	onMount(() => {
		if (!containerEl) return;
		const observer = new ResizeObserver(([entry]) => {
			containerWidth = entry.contentRect.width;
		});
		observer.observe(containerEl);
		return () => observer.disconnect();
	});

	const data = $derived(() => {
		if (!selectedStation) return [];

		const selectedCode = stationData.nameToCode.get(selectedStation);
		if (!selectedCode) return [];

		// Aggregate flow data
		const flows = (routeData as any[]).filter((r) => r.f === selectedCode || r.t === selectedCode);
		const combinedFlows = new Map<string, number>();

		for (const flow of flows) {
			const otherCode = flow.f === selectedCode ? flow.t : flow.f;
			combinedFlows.set(otherCode, (combinedFlows.get(otherCode) || 0) + (flow.r || 0));
		}

		if (combinedFlows.size === 0) {
			return [
				{
					name: 'No Data',
					value: 1,
					code: 'NO_DATA',
					line: 'unknown'
				}
			];
		}

		return Array.from(combinedFlows.entries()).map(([code, ridership]) => {
			const info = stationData.codeToInfo.get(code) || { name: 'Unknown', line: 'unknown' };
			return {
				name: info.name,
				value: Math.round(ridership),
				code,
				line: info.line
			};
		});
	});

	const treemapLayout = $derived(() => {
		const currentData = data();
		if (!currentData || !Array.isArray(currentData) || currentData.length === 0) {
			return { data: [], x1: 'x1', y1: 'y1', x2: 'x2', y2: 'y2' };
		}

		const root = hierarchy({ children: currentData }).sum((d: any) => d.value || 0);
		const totalValue = root.value || 1;

		const layout = treemap().size([containerWidth, 376]).padding(2);
		layout(root);

		const layoutData = root.leaves().map((d: any) => {
			const fillColor = getStationColor(d.data.line, d.data.name);
			const textColor = pickTextColor(fillColor);
			const percentage = (d.data.value / totalValue) * 100;

			return {
				x1: d.x0,
				y1: d.y0,
				x2: d.x1,
				y2: d.y1,
				name: d.data.name,
				code: d.data.code,
				value: d.data.value,
				percentage,
				line: d.data.line,
				fillColor,
				textColor
			};
		});

		return {
			data: layoutData,
			x1: 'x1',
			y1: 'y1',
			x2: 'x2',
			y2: 'y2'
		};
	});

	// Interaction handlers
	function hitTest(x: number, y: number) {
		const layoutData = treemapLayout().data;
		if (layoutData.length === 0) return null;

		// The plot's Y-axis is inverted relative to the browser's clientY
		const plotY = 376 - y;
		return layoutData.find((n) => x >= n.x1 && x <= n.x2 && plotY >= n.y1 && plotY <= n.y2) || null;
	}

	function handlePointerMove(event: PointerEvent) {
		if (isPinned || !containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		activeNode = hitTest(event.clientX - rect.left, event.clientY - rect.top);
	}

	function handleClick(event: MouseEvent) {
		if (!containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const hit = hitTest(event.clientX - rect.left, event.clientY - rect.top);

		if (isPinned && activeNode && hit && activeNode.name === hit.name) {
			isPinned = false;
			activeNode = hit;
		} else if (hit) {
			isPinned = true;
			activeNode = hit;
		} else {
			isPinned = false;
			activeNode = null;
		}
	}

	function handleStationSelect(station: string) {
		selectedStation = station;
		popoverOpen = false;
	}
</script>

<div class="mb-6 space-y-6">
	<div class="flex flex-wrap items-center justify-center border-y py-2 text-muted-foreground">
		<span class="text-center !text-xl !font-bold text-balance text-black md:text-left"
			>How are trips involving </span
		>
		<Popover.Root bind:open={popoverOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						class="h-auto text-xl font-medium text-foreground underline decoration-dotted underline-offset-4 hover:bg-transparent hover:decoration-solid"
						role="combobox"
					>
						<span class="max-w-48 truncate">
							{selectedStation || '_________'}
						</span>
						<ChevronsUpDownIcon class="ml-1 h-3 w-3 opacity-50" />
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-64 p-0">
				<Command.Root>
					<Command.Input placeholder="Search station..." />
					<Command.List>
						<Command.Empty>No station found.</Command.Empty>
						<Command.Group>
							{#each stationData.options as station (station.value)}
								<Command.Item
									value={station.value}
									onSelect={() => handleStationSelect(station.value)}
								>
									<CheckIcon class={selectedStation !== station.value ? 'text-transparent' : ''} />
									{station.label}
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Root>
			</Popover.Content>
		</Popover.Root>
		<span class="text-center !text-xl !font-bold text-balance text-black md:text-left"
		> distrbuted each day </span
		>
	</div>

	<div class="relative min-w-0" bind:this={containerEl}>
		<Plot
			height={376}
			x={{ domain: [0, containerWidth] }}
			y={{ domain: [0, 376] }}
			marginLeft={0}
			marginRight={0}
			marginBottom={0}
			marginTop={0}
		>
			<Rect
				data={treemapLayout().data}
				x1={treemapLayout().x1}
				y1={treemapLayout().y1}
				x2={treemapLayout().x2}
				y2={treemapLayout().y2}
				fill={(d: any) => d.fillColor}
				stroke="#ffffff"
				strokeWidth={0.5}
			/>

			<Text
				data={treemapLayout().data}
				x={(d: any) => (d.x1 + d.x2) / 2}
				y={(d: any) => (d.y1 + d.y2) / 2}
				text={(d: any) => {
					const width = d.x2 - d.x1;
					const height = d.y2 - d.y1;
					const name = d.name;
					const value = d.value;

					// Don't show anything if box is too small for both name and number
					if (width < 80 || height < 40) {
						return '';
					}

					if (width < 120 && name.length > 8) {
						const words = name.split(' ');
						if (words.length > 1) {
							return `${words.join('\n')}\n${formatNumber(value)}`;
						}
					}

					return `${name}\n${formatNumber(value)}`;
				}}
				fontSize={10}
				strokeWidth={2}
				strokeLinejoin="round"
				stroke={(d: any) => (d.textColor === 'white' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.8)')}
				fill={(d: any) => d.textColor}
				filter={(d: any) => {
					const width = d.x2 - d.x1;
					const height = d.y2 - d.y1;
					const area = width * height;
					return area > 400 && width >= 30 && height >= 20;
				}}
			/>
		</Plot>

		{#if activeNode}
			<div
				class="pointer-events-none absolute z-10 rounded-xs bg-black px-2 py-1 text-sm text-white shadow-xs"
				style="left: {(activeNode.x1 + activeNode.x2) / 2}px; top: {376 -
					(activeNode.y1 + activeNode.y2) / 2}px; transform: translate(-50%, -100%);"
			>
				<div class="font-medium">{activeNode.name}</div>
				<div class="text-xs opacity-80">
					{new Intl.NumberFormat().format(activeNode.value)} trips ({activeNode.percentage.toFixed(1)}%)
				</div>
			</div>
		{/if}

		<!-- Invisible overlay for interactions -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="absolute inset-0 touch-manipulation"
			onpointermove={handlePointerMove}
			onpointerleave={() => !isPinned && (activeNode = null)}
			onclick={handleClick}
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					isPinned = false;
					activeNode = null;
				}
			}}
			role="figure"
			tabindex="0"
		></div>
	</div>
</div>
