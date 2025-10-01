<script>
	import HourlyRidershipHeatmap from './HourlyRidershipHeatmap.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';

	let activeTab = 'weekday';
</script>

<Tabs.Root bind:value={activeTab}>
	<div class="flex flex-wrap items-center justify-center border-y py-2 text-muted-foreground">
		<span class="text-center !text-xl !font-bold text-balance text-black md:text-left">
			How many people board at each station at each hour on
		</span>

		<Tabs.List
			class="rounded-9px shadow-mini-inset !data-[state=active]:border-warm-5 !data-[state=active]:border-2 mx-auto my-2 grid w-64 grid-cols-2 gap-1 bg-gray-200 p-1 text-sm leading-[0.01em] font-semibold"
		>
			<Tabs.Trigger
				class="h-7 rounded-[3px] bg-transparent py-2 font-sans text-xl font-bold !shadow-none data-[state=active]:bg-warm-4"
				value="weekday"
			>
				Weekdays
			</Tabs.Trigger>

			<Tabs.Trigger
				class="h-7 rounded-[3px] bg-transparent py-2 font-sans text-xl font-bold !shadow-none data-[state=active]:bg-brand-orange data-[state=active]:text-white"
				value="weekend"
			>
				Weekends
			</Tabs.Trigger>
		</Tabs.List>
	</div>
</Tabs.Root>

<HourlyRidershipHeatmap dayType="weekday" visible={activeTab === 'weekday'} />
<HourlyRidershipHeatmap dayType="weekend" visible={activeTab === 'weekend'} />
