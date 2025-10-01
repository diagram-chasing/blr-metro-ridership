<script>
	import VirtualList from 'svelte-tiny-virtual-list';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { ArrowRight, RefreshCcw } from 'lucide-svelte';
	import { tick } from 'svelte';

	import MetroMap from '$charts/InteractiveMetroMap.svelte';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte.ts';

	import stationCodesData from '$lib/data/charts/station-codes.json';
	import routeData from '$lib/data/charts/04-commute-flow.json';

	let selections = $state({ from: '', to: '' });
	let hoveredRoute = $state(null);
	let tooltipPosition = $state({ y: 0 });

	let fromPopoverOpen = $state(false);
	let toPopoverOpen = $state(false);
	let fromTriggerRef = $state(null);
	let toTriggerRef = $state(null);

	const isMobile = new IsMobile();

	const stationInfoMap = new Map(
		stationCodesData.map((s) => {
			const info = {
				name: s.Station,
				line: s.line,
				isInterchange: s.code === 'KGWA' || s.code === 'RVR'
			};
			if (info.isInterchange) {
				info.color = 'var(--color-neutral-800)';
				info.textColor = 'white';
			} else {
				info.color = `var(--color-brand-${s.line})`;
				info.textColor = s.line === 'yellow' ? 'var(--color-neutral-800)' : 'white';
			}
			return [s.code, info];
		})
	);

	const stationOptions = stationCodesData
		.map((s) => ({ value: s.code, label: s.Station }))
		.sort((a, b) => a.label.localeCompare(b.label));

	const routes = $derived(
		routeData
			.filter((route) => route.r != null)
			.map((route, index) => ({
				...route,
				fromName: stationInfoMap.get(route.f)?.name ?? route.f,
				toName: stationInfoMap.get(route.t)?.name ?? route.t,
				rank: index + 1
			}))
	);

	const maxCommuters = $derived(Math.max(...routes.map((r) => r.r)));
	const fromSelectedLabel = $derived(stationInfoMap.get(selections.from)?.name);
	const toSelectedLabel = $derived(stationInfoMap.get(selections.to)?.name);
	const selectedRoute = $derived(
		routes.find((r) => r.f === selections.from && r.t === selections.to) || null
	);

	function handleItemClick(item) {
		selections.from = item.f;
		selections.to = item.t;
	}
	function handleMouseEnter(event, item) {
		const rect = event.currentTarget.getBoundingClientRect();
		const containerRect = event.currentTarget.closest('.list-container').getBoundingClientRect();
		tooltipPosition.y = rect.top - containerRect.top;
		hoveredRoute = item;
	}
	function handleMouseLeave() {
		hoveredRoute = null;
	}
	function resetSelections() {
		selections.from = '';
		selections.to = '';
	}

	function closeAndFocus(popover, triggerRef) {
		if (popover === 'from') fromPopoverOpen = false;
		if (popover === 'to') toPopoverOpen = false;
		tick().then(() => {
			triggerRef?.focus();
		});
	}
</script>

<div class="border-y py-4">
	<h2 class="text-xl font-bold">How popular is your usual commute?</h2>
	<p class="!mb-0 text-base text-muted-foreground">
		Select a pair of stations to see how many people usually travel that route on a given day
	</p>
</div>
<div class="my-2 space-y-4 md:my-0 md:mb-8">
	<div
		class="sticky top-0 z-10 mb-4 grid grid-cols-1 gap-2 border-b border-border/50 bg-background/95 pt-2 backdrop-blur-sm md:static md:mx-0 md:grid-cols-[1fr_1fr_auto] md:gap-2 md:bg-transparent md:p-0 md:pb-3 md:backdrop-blur-none"
	>
		<div class="space-y-2">
			<Popover.Root bind:open={fromPopoverOpen}>
				<Popover.Trigger bind:ref={fromTriggerRef}>
					{#snippet child({ props })}
						<Button
							{...props}
							variant="outline"
							class="h-8 w-full justify-between text-sm md:h-10"
							role="combobox"
							aria-expanded={fromPopoverOpen}
						>
							<span class="truncate">{fromSelectedLabel || 'From...'}</span>
							<ChevronsUpDownIcon class="flex-shrink-0 opacity-50" />
						</Button>
					{/snippet}
				</Popover.Trigger>
				<Popover.Content class=" p-0">
					<Command.Root>
						<Command.Input placeholder="Search station..." />
						<Command.List>
							<Command.Empty>No station found.</Command.Empty>
							<Command.Group>
								{#each stationOptions as station (station.value)}
									<Command.Item
										value={station.label}
										onSelect={() => {
											selections.from = station.value;
											closeAndFocus('from', fromTriggerRef);
										}}
									>
										<CheckIcon
											class={cn(selections.from !== station.value && 'text-transparent')}
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

		<div class="flex items-end gap-2 md:block md:space-y-2">
			<div class="flex-1 md:flex-none">
				<Popover.Root bind:open={toPopoverOpen}>
					<Popover.Trigger bind:ref={toTriggerRef}>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="outline"
								class="h-8 w-full justify-between text-sm md:h-10"
								role="combobox"
								aria-expanded={toPopoverOpen}
							>
								<span class="truncate">{toSelectedLabel || 'To...'}</span>
								<ChevronsUpDownIcon class="flex-shrink-0 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class=" p-0">
						<Command.Root>
							<Command.Input placeholder="Search station..." />
							<Command.List>
								<Command.Empty>No station found.</Command.Empty>
								<Command.Group>
									{#each stationOptions as station (station.value)}
										<Command.Item
											value={station.label}
											onSelect={() => {
												selections.to = station.value;
												closeAndFocus('to', toTriggerRef);
											}}
										>
											<CheckIcon
												class={cn(selections.to !== station.value && 'text-transparent')}
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

			<Button variant="outline" onclick={resetSelections} class="h-8 px-2 md:hidden">
				<RefreshCcw class="h-3 w-3" />
			</Button>
		</div>

		<Button
			variant="outline"
			size="icon"
			onclick={resetSelections}
			class="hidden items-center justify-center md:flex"
		>
			<RefreshCcw class="h-4 w-4" />
		</Button>
	</div>

	<div class="breakout-md mt-3 mb-8 grid grid-cols-1 gap-2 md:mb-0 md:grid-cols-[2fr_3fr]">
		<div
			class="list-container relative order-2 min-w-0 md:order-1"
			class:h-[200px]={isMobile.current}
			class:h-[600px]={!isMobile.current}
		>
			<VirtualList
				height={isMobile.current ? 200 : 600}
				width="100%"
				itemCount={routes.length}
				itemSize={22}
			>
				<div slot="item" let:index let:style {style}>
					{#if index >= 0}
						{@const item = routes[index]}
						{@const fromInfo = stationInfoMap.get(item.f)}
						{@const toInfo = stationInfoMap.get(item.t)}
						<div
							class="grid h-[20px] cursor-pointer grid-cols-[3fr_60px_60px] items-center gap-2 overflow-hidden rounded-sm px-0.5 text-xs leading-none transition-all duration-150 select-none hover:bg-muted/50 md:grid-cols-[4fr_50px_90px] md:gap-1 md:px-0"
							class:bg-gray-300={isMobile.current &&
								selectedRoute &&
								item.f === selectedRoute.f &&
								item.t === selectedRoute.t}
							onclick={() => handleItemClick(item)}
							onmouseenter={(e) => !isMobile.current && handleMouseEnter(e, item)}
							onmouseleave={() => !isMobile.current && handleMouseLeave()}
							onkeydown={(e) => e.key === 'Enter' && handleItemClick(item)}
							role="button"
							tabindex="0"
						>
							<div class="grid grid-cols-[1fr_12px_1fr] items-center gap-1 overflow-hidden">
								<span
									class="inline-block overflow-hidden rounded-sm px-2 py-0.5 text-xs font-medium text-ellipsis whitespace-nowrap"
									style="background-color: {fromInfo?.color}; color: {fromInfo?.textColor};"
								>
									{item.fromName}
								</span>
								<svg
									class="h-3 w-3 flex-shrink-0 text-neutral-500"
									viewBox="0 0 16 16"
									fill="currentColor"
								>
									<path d="m8.64 5l2.5 2.5v.7l-2.5 2.5l-.71-.7l1.64-1.65H4v-1h5.57L7.92 5.7z" />
								</svg>
								<span
									class="inline-block overflow-hidden rounded-sm px-2 py-0.5 text-xs font-medium text-ellipsis whitespace-nowrap"
									style="background-color: {toInfo?.color}; color: {toInfo?.textColor};"
								>
									{item.toName}
								</span>
							</div>
							<span class="text-right text-xs font-medium text-brand-green"
								>{item?.r?.toLocaleString()}</span
							>
							<div class="sparkline-container pr-2">
								<div class="sparkline-bar" style="width: {(item.r / maxCommuters) * 100}%"></div>
							</div>
						</div>
					{/if}
				</div>
			</VirtualList>

			{#if hoveredRoute && !isMobile.current}
				<div
					class="pointer-events-none absolute left-0 z-50 w-full"
					style="top: {tooltipPosition.y}px;"
				>
					<div
						class="grid w-full grid-cols-[3fr_60px_60px] items-center gap-2 rounded-md border border-brown-600 bg-background p-1 text-xs font-normal text-brown-50 shadow-sm md:w-auto md:grid-cols-[4fr_50px_90px] md:gap-1"
					>
						<div class="grid grid-cols-[1fr_5px_1fr] items-center gap-1 overflow-hidden">
							<span
								class="overflow-hidden px-1 text-sm text-ellipsis whitespace-nowrap"
								style="background-color: {stationInfoMap.get(hoveredRoute.f)
									?.color}; color: {stationInfoMap.get(hoveredRoute.f)?.textColor};"
							>
								{hoveredRoute.fromName}
							</span>
							<svg
								class="h-3 w-3 justify-self-center text-brown-300"
								viewBox="0 0 16 16"
								fill="currentColor"
							>
								<path d="m8.64 5l2.5 2.5v.7l-2.5 2.5l-.71-.7l1.64-1.65H4v-1h5.57L7.92 5.7z" />
							</svg>
							<span
								class="overflow-hidden px-1 text-sm text-ellipsis whitespace-nowrap"
								style="background-color: {stationInfoMap.get(hoveredRoute.t)
									?.color}; color: {stationInfoMap.get(hoveredRoute.t)?.textColor};"
							>
								{hoveredRoute.toName}
							</span>
						</div>
						<span class="text-right text-sm font-medium text-brand-green"
							>{hoveredRoute?.r?.toLocaleString()}</span
						>
						<div class="sparkline-container">
							<div
								class="sparkline-bar"
								style="width: {(hoveredRoute.r / maxCommuters) * 100}%"
							></div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<div class="order-1 min-w-0 space-y-4 md:order-2">
			<div class="w-full rounded-lg border bg-muted/30 px-1 py-2 md:py-0">
				<div
					class="flex min-h-[60px] flex-col items-center gap-3 md:min-h-[40px] md:flex-row md:items-center md:justify-between"
				>
					{#if selectedRoute}
						<div class="flex items-center gap-2 overflow-hidden">
							<span
								class="inline-block rounded-xs px-2 py-1 text-sm font-medium"
								style:background-color={stationInfoMap.get(selectedRoute.f)?.color}
								style:color={stationInfoMap.get(selectedRoute.f)?.textColor}
							>
								{selectedRoute.fromName}
							</span>
							<svg
								class="h-4 w-4 flex-shrink-0 text-muted-foreground"
								viewBox="0 0 16 16"
								fill="currentColor"
							>
								<path d="m8.64 5l2.5 2.5v.7l-2.5 2.5l-.71-.7l1.64-1.65H4v-1h5.57L7.92 5.7z" />
							</svg>
							<span
								class="inline-block rounded-xs px-2 py-1 text-sm font-medium"
								style:background-color={stationInfoMap.get(selectedRoute.t)?.color}
								style:color={stationInfoMap.get(selectedRoute.t)?.textColor}
							>
								{selectedRoute.toName}
							</span>
						</div>

						<div class="flex items-baseline gap-6">
							<div>
								<span class="text-2xl font-bold text-brand-green md:text-3xl">
									{selectedRoute?.r?.toLocaleString()}
								</span>
								<span class="ml-2 text-sm font-medium text-muted-foreground">
									daily commuters
								</span>
							</div>

							<div>
								<span class="text-2xl font-bold md:text-3xl">
									#{selectedRoute.rank}
								</span>
								<span class="ml-1 text-sm font-medium text-muted-foreground"> rank </span>
							</div>
						</div>
					{:else}
						<div class="flex flex-1 items-center justify-center">
							<span class="text-sm font-medium text-muted-foreground"> Select a route </span>
						</div>
					{/if}
				</div>
			</div>

			<MetroMap
				mode="route"
				fromStation={selections.from}
				toStation={selections.to}
				stationRadius={isMobile.current ? 1.5 : 2.5}
				showLanduse={false}
				height={isMobile.current ? 350 : 550}
			/>
		</div>
	</div>
</div>

<style>
	.sparkline-container {
		width: 60px;
		height: 5px;
		background-color: var(--color-gray-200);

		overflow: hidden;
	}
	@media (min-width: 768px) {
		.sparkline-container {
			width: 80px;
		}
	}
	.sparkline-bar {
		height: 100%;
		background-color: var(--color-brand-orange);
		transition: width 0.2s ease;
	}
</style>
