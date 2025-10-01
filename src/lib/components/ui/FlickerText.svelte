<script lang="ts">
	export let text = '';
	export let flickerIntensity = 'medium'; // 'light', 'medium', 'heavy'
	export let class_ = '';

	// Group characters into flickering segments of 2-4 characters
	$: chars = (() => {
		const textChars = text.split('');
		const groups = [];
		let i = 0;
		
		while (i < textChars.length) {
			// Random group size between 2-4 characters
			const groupSize = Math.min(2 + Math.floor(Math.random() * 3), textChars.length - i);
			const groupChars = textChars.slice(i, i + groupSize);
			
			// Shared flicker properties for the group
			const sharedProps = {
				delay: Math.random() * 8, // Reasonable delays (0-8s)
				duration: 4 + Math.random() * 6, // Medium timing (4-10s duration)
				intensity: Math.random() * 0.4 + 0.6, // Visible but subtle (0.6-1.0 intensity)
				frequency: Math.random() * 0.2 + 0.1 // Moderate frequency (0.1-0.3 frequency)
			};
			
			// Add each character in the group with the same flicker properties
			groupChars.forEach(char => {
				groups.push({ char, ...sharedProps });
			});
			
			i += groupSize;
		}
		
		return groups;
	})();

	// Flicker intensity settings - visible but natural
	const intensitySettings = {
		light: { opacity: [0.9, 1], brightness: [0.95, 1.05] },
		medium: { opacity: [0.7, 1], brightness: [0.85, 1.15] },
		heavy: { opacity: [0.4, 1], brightness: [0.7, 1.3] }
	};

	$: settings =
		intensitySettings[flickerIntensity as keyof typeof intensitySettings] ||
		intensitySettings.medium;
</script>

<span class="flicker-text {class_}">
	{#each chars as { char, delay, duration, intensity, frequency }}
		<span
			class="flicker-char"
			style="--delay: {delay}s; --duration: {duration}s; --intensity: {intensity}; --frequency: {frequency}; --min-opacity: {settings
				.opacity[0]}; --max-opacity: {settings.opacity[1]}; --min-brightness: {settings
				.brightness[0]}; --max-brightness: {settings.brightness[1]}"
		>
			{char === ' ' ? '\u00A0' : char}
		</span>
	{/each}
</span>

<style>
	.flicker-text {
		display: inline;
	}

	.flicker-char {
		display: inline;
		animation: character-flicker var(--duration) ease-in-out infinite;
		animation-delay: var(--delay);
	}

	@keyframes character-flicker {
		0%,
		92% {
			opacity: var(--max-opacity);
			filter: brightness(var(--max-brightness));
		}

		93% {
			opacity: calc(var(--min-opacity) + (var(--max-opacity) - var(--min-opacity)) * var(--intensity));
			filter: brightness(calc(var(--min-brightness) + (var(--max-brightness) - var(--min-brightness)) * var(--intensity)));
		}

		94% {
			opacity: var(--max-opacity);
			filter: brightness(var(--max-brightness));
		}

		95% {
			opacity: var(--min-opacity);
			filter: brightness(var(--min-brightness));
		}

		96% {
			opacity: calc(var(--max-opacity) * var(--intensity));
			filter: brightness(calc(var(--max-brightness) * var(--intensity)));
		}

		97% {
			opacity: var(--max-opacity);
			filter: brightness(var(--max-brightness));
		}

		98% {
			opacity: calc(var(--min-opacity) + var(--frequency));
			filter: brightness(calc(var(--min-brightness) + var(--frequency)));
		}

		100% {
			opacity: var(--max-opacity);
			filter: brightness(var(--max-brightness));
		}
	}

</style>
