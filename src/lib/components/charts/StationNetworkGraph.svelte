<script>
	import { onMount, tick, untrack, onDestroy } from 'svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
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
		const workerCode = `
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide,
  forceX,
  forceY,
  scaleSqrt
} from 'https://cdn.skypack.dev/d3';

let simulation;
let nodes = [];
let bounds = {
  width: 0,
  height: 0
};
let interchanges = new Set();
let importantStations = new Set();
let latestSelectedNode = null;
let latestConnectedNodes = new Set();

self.onmessage = (e) => {
  const {
    type,
    payload
  } = e.data;
  switch (type) {
    case 'RESIZE':
      bounds = {
        width: payload.width,
        height: payload.height
      };
      interchanges = new Set(payload.interchanges);
      importantStations = new Set(payload.importantStations);
      simulation?.stop();
      initializeSimulation(payload);
      break;
    case 'UPDATE_SELECTION_STATE':
      latestSelectedNode = payload.selectedNode;
      latestConnectedNodes = payload.connectedNodes;

      calculateAndPostLabels({
        selectedNode: latestSelectedNode,
        connectedNodes: latestConnectedNodes
      });

      break;
  }
};

function initializeSimulation({
  networkNodes,
  networkLinks,
  width,
  height,
  isMobile,
  simConfig
}) {
  nodes = networkNodes.map((d, i) => ({
    ...d,
    index: i
  }));
  const rawLinks = Object.values(networkLinks).map(([source, target, value]) => ({
    source,
    target,
    value
  }));
  const maxRidership = Math.max(...nodes.map((d) => d.total_ridership));
  const radiusScale = scaleSqrt().domain([0, maxRidership]).range([simConfig.NODE_RADIUS_MIN, simConfig.NODE_RADIUS_MAX]);
  nodes.forEach((node) => (node.radius = radiusScale(node.total_ridership || 1)));
  const maxValue = Math.max(...rawLinks.map((d) => d.value));
  const linkWidthScale = scaleSqrt().domain([1, maxValue]).range([simConfig.LINK_WIDTH_MIN, simConfig.LINK_WIDTH_MAX]);
  const linksForSim = rawLinks.map((d) => ({
    ...d,
    width: linkWidthScale(d.value)
  }));
  const lineFocalPoints = isMobile ? {
    Purple: {
      x: width / 2,
      y: height * 0.25
    },
    Green: {
      x: width / 2,
      y: height * 0.75
    },
    default: {
      x: width / 2,
      y: height / 2
    }
  } : {
    Purple: {
      x: width * 0.25,
      y: height / 2
    },
    Green: {
      x: width * 0.75,
      y: height / 2
    },
    default: {
      x: width / 2,
      y: height / 2
    }
  };
  const linkDistanceScale = scaleSqrt().domain([1, maxValue]).range([simConfig.LINK_DISTANCE * 0.3, simConfig.LINK_DISTANCE]);
  const linkStrengthScale = scaleSqrt().domain([1, maxValue]).range([simConfig.LINK_STRENGTH * 0.2, simConfig.LINK_STRENGTH]);
  const boundaryForce = () => {
    const margin = 50;
    nodes.forEach((node) => {
      if (node.x < margin) node.vx += (margin - node.x) * 0.1;
      else if (node.x > width - margin) node.vx += (width - margin - node.x) * 0.1;
      if (node.y < margin) node.vy += (margin - node.y) * 0.1;
      else if (node.y > height - margin) node.vy += (height - margin - node.y) * 0.1;
    });
  };
  simulation = forceSimulation(nodes)
    .force('link', forceLink(linksForSim).id((d) => d.index).distance((d) => linkDistanceScale(d.value)).strength((d) => linkStrengthScale(d.value)))
    .force('charge', forceManyBody().strength(simConfig.CHARGE_STRENGTH))
    .force('collide', forceCollide().radius((d) => d.radius + simConfig.COLLIDE_PADDING))
    .force('boundary', boundaryForce)
    .force('x', forceX((d) => (lineFocalPoints[d.group] || lineFocalPoints.default).x).strength(simConfig.FORCE_X_STRENGTH))
    .force('y', forceY((d) => (lineFocalPoints[d.group] || lineFocalPoints.default).y).strength(simConfig.FORCE_Y_STRENGTH));

  const linksForMainThread = linksForSim.map((l) => ({
    source: l.source.index,
    target: l.target.index,
    value: l.value,
    width: l.width
  }));
  self.postMessage({
    type: 'INIT_DONE',
    payload: {
      nodes,
      links: linksForMainThread
    }
  });
  let tickCount = 0;
  const maxTicks = simConfig.ANIMATION_DURATION_MS / 16;
  simulation.on('tick', () => {
    self.postMessage({
      type: 'TICK',
      payload: {
        nodes
      }
    });
    if (++tickCount > maxTicks) {
      simulation.stop();
    }
  });

  simulation.on('end', () => {
    calculateAndPostLabels({
      selectedNode: latestSelectedNode,
      connectedNodes: latestConnectedNodes
    });

    self.postMessage({
      type: 'SIMULATION_END'
    });
  });
}

function calculateAndPostLabels({
  selectedNode,
  connectedNodes
}) {
  if (nodes.length === 0) return;
  const labels = [];
  const placedBoxes = [];
  const FONT_SIZE = 12;
  const CHAR_WIDTH = FONT_SIZE * 0.6;
  const PADDING = 4;
  const MARGIN = 10;
  const getPriority = (node) => {
    if (node.index === selectedNode) return 5;
    if (connectedNodes.has(node.index)) return 4;
    if (interchanges.has(node.id)) return 3;
    if (importantStations.has(node.id)) return 2;
    return 1;
  };
  const sortedNodes = [...nodes].sort((a, b) => {
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
    if (priorityA !== priorityB) return priorityB - priorityA;
    return (b.total_ridership || 0) - (a.total_ridership || 0);
  });
  for (const node of sortedNodes) {
    const priority = getPriority(node);
    if (priority < 2) continue;
    const labelWidth = node.id.length * CHAR_WIDTH;
    const labelHeight = FONT_SIZE;
    const positions = [{
      x: node.x,
      y: node.y - node.radius - PADDING - 3,
      anchor: 'middle'
    },
    {
      x: node.x,
      y: node.y + node.radius + labelHeight,
      anchor: 'middle'
    },
    {
      x: node.x - node.radius - PADDING,
      y: node.y + labelHeight / 2 - 2,
      anchor: 'end'
    },
    {
      x: node.x + node.radius + PADDING,
      y: node.y + labelHeight / 2 - 2,
      anchor: 'start'
    }
    ];
    for (const pos of positions) {
      let x1, x2;
      if (pos.anchor === 'middle') {
        x1 = pos.x - labelWidth / 2;
        x2 = pos.x + labelWidth / 2;
      } else if (pos.anchor === 'end') {
        x1 = pos.x - labelWidth;
        x2 = pos.x;
      } else {
        x1 = pos.x;
        x2 = pos.x + labelWidth;
      }
      const box = {
        x1: x1 - PADDING,
        y1: pos.y - labelHeight - PADDING,
        x2: x2 + PADDING,
        y2: pos.y + PADDING
      };
      if (box.x1 < MARGIN || box.x2 > bounds.width - MARGIN || box.y1 < MARGIN || box.y2 > bounds.height - MARGIN) continue;
      let collides = placedBoxes.some((placed) => box.x1 < placed.x2 && box.x2 > placed.x1 && box.y1 < placed.y2 && box.y2 > placed.y1);
      if (!collides) {
        labels.push({
          id: node.id,
          labelX: pos.x,
          labelY: pos.y,
          textAlign: pos.anchor,
          nodeGroup: node.group,
          isMajor: interchanges.has(node.id),
          isSelected: node.index === selectedNode,
          isConnected: connectedNodes.has(node.index)
        });
        placedBoxes.push(box);
        break;
      }
    }
  }
  self.postMessage({
    type: 'LABELS_UPDATED',
    payload: {
      labels
    }
  });
}
		`;
		
		const blob = new Blob([workerCode], { type: 'application/javascript' });
		worker = new Worker(URL.createObjectURL(blob), { type: 'module' });
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
