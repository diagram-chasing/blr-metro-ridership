<script lang="ts">
	import { page } from '$app/stores';

	export let seoData: {
		title: string;
		description: string;
		authors: Array<{
			name: string;
			url?: string;
			twitter?: string;
		}>;
		keywords: string;
		canonical: string;
		site_name: string;
		twitter_creator: string;
		base_url: string;
		og_image: string;
		favicon: string;
		date_published?: string;
		date_modified?: string;
		dataset?: {
			name: string;
			description: string;
			publisher: {
				name: string;
				description: string;
			};
		};
		location?: {
			name: string;
			latitude: number;
			longitude: number;
		};
	};

	$: fullTitle = seoData.title ? `${seoData.title}` : seoData.site_name;

	$: ogImageUrl = seoData.og_image.startsWith('http')
		? seoData.og_image
		: `${seoData.base_url}${seoData.og_image}`;

	$: currentUrl = seoData.canonical || `${seoData.base_url}${$page.url.pathname}`;

	$: faviconUrl = seoData.favicon.startsWith('http')
		? seoData.favicon
		: `${seoData.base_url}${seoData.favicon}`;

	// Derived author data
	$: authorNames = seoData.authors.map(author => author.name).join(', ');
	
	$: structuredAuthors = seoData.authors.map(author => ({
		'@type': 'Person',
		name: author.name,
		...(author.url && { url: author.url }),
		...(author.twitter && { sameAs: [`https://twitter.com/${author.twitter.replace('@', '')}`] })
	}));

	// Structured data for the page
	$: structuredData = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: seoData.title,
		description: seoData.description,
		url: currentUrl,
		...(seoData.date_published && { datePublished: seoData.date_published }),
		...(seoData.date_modified && { dateModified: seoData.date_modified }),
		author: structuredAuthors.length === 1 ? structuredAuthors[0] : structuredAuthors,
		publisher: {
			'@type': 'Organization',
			name: seoData.site_name,
			url: seoData.base_url
		},
		...(seoData.dataset && {
			mainEntity: {
				'@type': 'Dataset',
				name: seoData.dataset.name,
				description: seoData.dataset.description,
				creator: structuredAuthors,
				publisher: {
					'@type': 'Organization',
					name: seoData.dataset.publisher.name,
					description: seoData.dataset.publisher.description
				},
				...(seoData.location && {
					spatialCoverage: {
						'@type': 'Place',
						name: seoData.location.name,
						geo: {
							'@type': 'GeoCoordinates',
							latitude: seoData.location.latitude,
							longitude: seoData.location.longitude
						}
					}
				})
			}
		})
	};
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={seoData.description} />
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<!-- Author and Keywords -->
	<meta name="author" content={authorNames} />
	<meta name="keywords" content={seoData.keywords} />
	{#if seoData.date_published}
		<meta name="date" content={seoData.date_published} />
	{/if}

	<!-- Favicon -->
	<link rel="icon" href={faviconUrl} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={currentUrl} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={seoData.description} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:site_name" content={seoData.site_name} />
	{#if seoData.date_published}
		<meta property="article:published_time" content={seoData.date_published} />
	{/if}
	{#if seoData.date_modified}
		<meta property="article:modified_time" content={seoData.date_modified} />
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={currentUrl} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={seoData.description} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:creator" content={seoData.twitter_creator} />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>`}

	<!-- Canonical -->
	{#if seoData.canonical}
		<link rel="canonical" href={seoData.canonical} />
	{:else}
		<link rel="canonical" href={currentUrl} />
	{/if}
</svelte:head>
