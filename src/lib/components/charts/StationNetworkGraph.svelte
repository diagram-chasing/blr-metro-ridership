<script>
	import { onMount, tick, untrack, onDestroy } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import NetworkWorker from '$lib/workers/network.worker.js?worker';
	import {
		getSimConfig,
		lineColors,
		processStationData,
		setupRetinaCanvas,
		findConnected,
		findNodeAtPosition,
		getNodeStyle
	} from '$lib/utils/network-utils.js';
	import networkData from '$lib/data/charts/metro-network-final.json';
	import stationCodesData from '$lib/data/charts/station-codes.json';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.ts';

	let { height: baseHeight = 400 } = $props();
	const isMobile = new IsMobile();
	let containerWidth = $state(600);
	let canvasEl = $state(null);
	let context = $state(null);
	let isLoading = $state(true);
	let nodes = $state([]);
	let links = $state([]);
	let labelsToShow = $state([]);
	let selectedStationCode = $state('TTY');
	let selectedNode = $derived(
		nodes.find((n) => stationCodeMap.get(n.id) === selectedStationCode)?.index ?? null
	);
	let connectedNodes = $derived(
		selectedNode !== null ? findConnected(selectedNode, links).nodes : new Set()
	);
	let connectedLinks = $derived(
		selectedNode !== null ? findConnected(selectedNode, links).links : new Set()
	);
	let popoverOpen = $state(false);
	let triggerRef = $state(null);
	let worker = null;
	let resolvedColors = {};
	let resizeObserver = null;
	let height = $derived(isMobile.current ? 550 : baseHeight);
	let width = $derived(isMobile.current ? Math.min(containerWidth, 580) : containerWidth);
	const { stationCodeMap, reverseStationMap, stationOptions } = processStationData(
		networkData.nodes,
		stationCodesData
	);
	const interchanges = new Set(['Majestic', 'RV Road']);
	const importantStations = new Set(['Whitefield (Kadugodi)', 'Silk Institute', 'KR Puram']);
	const selectedStationName = $derived(reverseStationMap.get(selectedStationCode) || '');

	onMount(() => {
		if (!canvasEl) return;
		context = canvasEl.getContext('2d');
		const computedStyles = getComputedStyle(canvasEl);
		for (const [key, value] of Object.entries(lineColors)) {
			resolvedColors[key] = computedStyles.getPropertyValue(value).trim();
		}
		worker = new NetworkWorker();
		worker.onmessage = handleWorkerMessage;
		resizeObserver = new ResizeObserver((entries) => {
			if (entries[0]) containerWidth = entries[0].contentRect.width;
		});
		const container = canvasEl.parentElement;
		if (container) {
			containerWidth = container.getBoundingClientRect().width;
			resizeObserver.observe(container);
		}
		return () => {
			worker?.terminate();
			resizeObserver?.disconnect();
		};
	});

	function handleWorkerMessage(e) {
		const { type, payload } = e.data;
		switch (type) {
			case 'INIT_DONE':
				nodes = payload.nodes;
				links = payload.links;
				isLoading = false;
				addInteractivity();
				break;
			case 'TICK':
				nodes = payload.nodes;
				break;
			case 'SIMULATION_END':
				// Set initial selection after simulation completes and labels are shown
				setTimeout(() => {
					if (!selectedStationCode) {
						selectedStationCode = 'TTY';
					}
				}, 1000);
				break;
			case 'LABELS_UPDATED':
				labelsToShow = payload.labels;
				break;
		}
	}

	function draw() {
		if (!context) return;
		context.clearRect(0, 0, width, height);
		const isNodeSelected = selectedNode !== null;
		links.forEach((link) => {
			const sourceNode = nodes[link.source];
			const targetNode = nodes[link.target];
			if (!sourceNode || !targetNode) return;
			const isConnected = connectedLinks.has(link);
			context.lineCap = 'round';
			context.beginPath();
			if (isNodeSelected) {
				context.globalAlpha = isConnected ? 0.9 : 0.1;
				context.strokeStyle = isConnected ? resolvedColors[sourceNode.group] || '#ccc' : '#e2e8f0';
			} else {
				context.globalAlpha = 0.2;
				context.strokeStyle = '#ede0d4';
			}
			context.lineWidth = link.width;
			context.moveTo(sourceNode.x, sourceNode.y);
			context.lineTo(targetNode.x, targetNode.y);
			context.stroke();
		});
		nodes.forEach((node) => {
			const isSelected = node.index === selectedNode;
			const isConnected = connectedNodes.has(node.index);
			const isMajor = interchanges.has(node.id);
			const style = getNodeStyle(
				{ node, isSelected, isConnected, isAnyNodeSelected: isNodeSelected, isMajor },
				resolvedColors
			);
			context.globalAlpha = style.alpha;
			context.fillStyle = style.fill;
			context.beginPath();
			context.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
			context.fill();
			context.strokeStyle = style.stroke;
			context.lineWidth = style.strokeWidth;
			context.stroke();
		});
		context.font = '900 12px "Atkinson Hyperlegible", sans-serif';
		context.textBaseline = 'bottom';
		labelsToShow.forEach((label) => {
			context.textAlign = label.textAlign;
			context.fillStyle = !label.isMajor ? resolvedColors[label.nodeGroup] || '#333' : '#333';
			context.globalAlpha = isNodeSelected && !label.isSelected && !label.isConnected ? 0.3 : 1.0;
			context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
			context.lineWidth = 4;
			context.lineJoin = 'round';
			context.strokeText(label.id, label.labelX, label.labelY);
			context.fillText(label.id, label.labelX, label.labelY);
		});
		context.globalAlpha = 1.0;
	}

	function addInteractivity() {
		canvasEl?.addEventListener('mousemove', handleMouseMove);
		canvasEl?.addEventListener('click', handleClick);
	}
	function handleMouseMove(event) {
		const foundNode = findNodeAtPosition(event.offsetX, event.offsetY, nodes);
		if (canvasEl) canvasEl.style.cursor = foundNode ? 'pointer' : 'default';
	}
	function handleClick(event) {
		const clickedNode = findNodeAtPosition(event.offsetX, event.offsetY, nodes);
		if (!clickedNode) {
			selectedStationCode = '';
			return;
		}
		const newStationCode = stationCodeMap.get(clickedNode.id);
		selectedStationCode = selectedStationCode === newStationCode ? '' : newStationCode;
	}
	function closeAndFocus() {
		popoverOpen = false;
		tick().then(() => triggerRef?.focus());
	}

	$effect(() => {
		nodes;
		selectedNode;
		connectedLinks;
		labelsToShow;
		if (context) draw();
	});

	$effect(() => {
		if (width && height && context && worker) {
			untrack(() => {
				isLoading = true;
				setupRetinaCanvas(canvasEl, context, width, height);
				worker.postMessage({
					type: 'RESIZE',
					payload: {
						networkNodes: networkData.nodes,
						networkLinks: networkData.links,
						width,
						height,
						isMobile: isMobile.current,
						simConfig: getSimConfig(isMobile.current),
						interchanges: Array.from(interchanges),
						importantStations: Array.from(importantStations)
					}
				});
			});
		}
	});

	$effect(() => {
		if (isLoading || !worker || !nodes.length) return;
		worker.postMessage({
			type: 'UPDATE_SELECTION_STATE',
			payload: {
				selectedNode,
				connectedNodes: new Set(Array.from(connectedNodes))
			}
		});
	});
</script>

<div class="space-y-4">
	<div class="space-y-1">
		<div class=" flex flex-wrap items-center justify-center border-y py-2 text-muted-foreground">
			<span class="text-center !text-xl !font-bold text-balance text-black md:text-left"
				>Where people tend to go when they board at</span
			>
			<Popover.Root bind:open={popoverOpen}>
				<Popover.Trigger bind:ref={triggerRef}>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							class="h-auto text-xl font-medium text-foreground underline decoration-dotted underline-offset-4 hover:bg-transparent hover:decoration-solid"
							role="combobox"
						>
							<span class="max-w-48 truncate"> {selectedStationName || '_________'} </span>
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
								{#each stationOptions as station (station.value)}
									<Command.Item
										value={station.label}
										onSelect={() => {
											selectedStationCode = station.value;
											closeAndFocus();
										}}
									>
										<CheckIcon
											class={cn(selectedStationCode !== station.value && 'text-transparent')}
										/>
										{station.label}
									</Command.Item>
								{/each}
							</Command.Group>
						</Command.List>
					</Command.Root>
				</Popover.Content>
			</Popover.Root>
		</div>
	</div>
	<div
		class="network-container breakout-lg"
		bind:clientWidth={containerWidth}
		style:height="{height}px"
	>
		{#if isLoading}
			<div class="loading-overlay">
				<div class="loading-spinner"></div>
				<p class="loading-text">Loading metro network...</p>
			</div>
		{/if}
		<canvas bind:this={canvasEl} class:loading={isLoading}></canvas>
	</div>
</div>

<style>
	.network-container {
		position: relative;
		overflow: hidden;
	}
	canvas {
		display: block;
		border-radius: inherit;
		touch-action: manipulation;
		user-select: none;
		transition: opacity 0.3s ease;
	}
	canvas.loading {
		opacity: 0.1;
	}
	.loading-overlay {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		z-index: 10;
	}
	.loading-spinner {
		width: 2rem;
		height: 2rem;
		border: 2px solid #e2e8f0;
		border-top: 2px solid #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.loading-text {
		color: #64748b;
		font-size: 0.875rem;
		margin: 0;
	}
	@media (max-width: 767px) {
		.network-container {
			border-radius: 0;
		}
		canvas {
			border-radius: 0;
		}
	}
</style>
