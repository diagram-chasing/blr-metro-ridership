<script>
	import rssFeedData from '$lib/data/rss-feed.json';

	const loading = false;
	const error = rssFeedData.error || null;
	const feedItems = rssFeedData.error
		? []
		: rssFeedData.items.map((item) => ({
				...item,
				pubDate: new Date(item.pubDate)
			}));
</script>

<footer class=" pb-8">
	<div class="mx-auto max-w-[72ch] px-8">
		<div>
			<div
				class="mb-4 border-b-2 border-black pb-2 text-center font-sans text-xl font-bold text-black"
			></div>

			{#if loading}
				<div class="p-4 text-center text-black opacity-80">Loading latest posts...</div>
			{:else if error}
				<div class="p-4 text-center text-black opacity-80">
					<p>Unable to load latest posts</p>
					<a
						href="https://diagramchasing.fun"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-black underline"
					>
						Visit Diagram Chasing →
					</a>
				</div>
			{:else if feedItems.length > 0}
				<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
					{#each feedItems as item}
						<a
							href={item.link}
							target="_blank"
							rel="noopener noreferrer"
							class="font-semibold text-black no-underline transition-colors duration-200 hover:text-black hover:underline"
						>
							<article
								class="flex h-full flex-col gap-2 rounded-xs border border-neutral-200 bg-neutral-50 p-2 transition-all duration-200"
							>
								{#if item.image}
									<div class="h-48 w-auto flex-shrink-0 overflow-hidden rounded-md">
										<img
											src={item.image}
											alt={item.title}
											loading="lazy"
											class="h-full w-full object-cover"
										/>
									</div>
								{/if}
								<div class="h-full min-w-0 flex-1">
									<h4 class="m-0 mb-2 !text-xl leading-snug !font-bold">
										{item.title}
									</h4>
									<p class="m-0 mb-2 !text-sm leading-relaxed text-black opacity-80">
										{item.description}
									</p>
									<time class="mt-auto text-xs font-medium text-black opacity-60">
										{item.pubDate.toLocaleDateString('en-US', {
											year: 'numeric',
											month: 'short',
											day: 'numeric'
										})}
									</time>
								</div>
							</article>
						</a>
					{/each}
				</div>
			{:else}
				<div class="p-4 text-center text-black opacity-80">
					<p>No recent posts available</p>
					<a
						href="https://diagramchasing.fun"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium text-black underline"
					>
						Visit Diagram Chasing →
					</a>
				</div>
			{/if}
		</div>
	</div>
</footer>

<style>
	@media (max-width: 768px) {
		footer {
			padding: 1.5rem 0;
			margin-top: 2rem;
		}

		footer > div {
			padding: 0 1rem;
		}

		article {
			flex-direction: column;
			gap: 0.75rem;
		}

		article .flex-shrink-0 {
			width: 100%;
			height: 120px;
		}
	}
</style>
