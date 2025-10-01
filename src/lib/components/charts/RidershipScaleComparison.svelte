<script>
	import Image from '$lib/components/ui/Image.svelte';
	import person1 from '$lib/assets/people/1.png?enhanced';
	import Crowd from '$lib/assets/images/people.png?enhanced';
</script>

<div class="breakout-md mx-auto my-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
	<div class="flex flex-col text-center">
		<h3 class="mb-3 text-xl font-bold md:text-2xl">1 Person</h3>
		<p class="mb-4 text-sm text-neutral-600 md:mb-6">Travelled from Beratena Agrahara to Mysore Road</p>
		<div class="flex flex-1 items-center justify-center">
			<Image src={person1} alt="Single traveler" class="h-[80px] w-auto md:h-[100px]" />
		</div>
	</div>

	<div class="flex flex-col text-center">
		<h3 class="mb-3 text-xl font-bold md:text-2xl">300 People</h3>
		<p class="mb-4 text-sm text-neutral-600 md:mb-6">Travelled from Benniganahalli to Majestic</p>
		<div class="flex flex-1 items-center justify-center">
			<Image src={Crowd} alt="Crowd of travelers" class="h-[120px] w-auto md:h-[150px]" />
		</div>
	</div>
</div>
