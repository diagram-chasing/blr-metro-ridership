<script lang="ts">
	import '../app.css';
	import '$lib/styles/markdown.css';
	import SEO from '$lib/components/SEO.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { metadata } from '$lib/SEO.md';

	import Logo from '$lib/assets/images/logo.png?enhanced';
	import Image from '$lib/components/ui/Image.svelte';
	import ConcreteTexture from '$lib/assets/images/concrete.webp';
	let { children } = $props();
</script>

<SEO seoData={metadata} />
<div
	class="metro absolute top-0 left-0 w-full"
	style="--concrete-texture: url('{ConcreteTexture}')"
>
	<div class="flex h-15 w-full justify-center px-4 py-2 md:justify-between">
		<div class="metro-wall-text hidden items-center justify-center gap-2 md:flex">
			<svg
				class="icon-small"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 16 16"
			>
				<path
					fill="currentColor"
					d="M15 7H4.156l4.107-4.854L6.737.854L.69 8l6.047 7.146l1.526-1.292L4.156 9H15z"
				/>
			</svg> SilK Institute
		</div>
		<a
			href="https://diagramchasing.fun"
			class="logo-position flex items-center justify-center rounded border border-transparent px-0.5 py-1 transition-all hover:border-black"
		>
			<Image src={Logo} loading="eager" alt="Diagram Chasing" class=" h-auto w-28 rounded" />
		</a>
		<div class="metro-wall-text hidden items-center justify-center gap-2 md:flex">
			Madavara <svg
				class="icon-small"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 16 16"
			>
				<path
					fill="currentColor"
					d="M1 7h10.844L7.737 2.146l1.526-1.292L15.31 8l-6.047 7.146-1.526-1.292L11.844 9H1z"
				/>
			</svg>
		</div>
	</div>
</div>
<main class="main">
	<div class="content markdown">
		{@render children?.()}
	</div>

	<Footer />
</main>

<style>
	.main {
		min-height: 100vh;
		background: var(--color-background);

		margin: 0 auto;
	}

	.content {
		margin: 0 auto;
		max-width: 64ch;
	}

	@media (max-width: 768px) {
		.main {
			padding: 0;
		}
	}

	.metro {
		background:
			linear-gradient(var(--color-brand-green), var(--color-brand-green)), var(--concrete-texture),
			linear-gradient(to right, var(--color-brand-green), var(--color-brand-green));
		background-size:
			100% 100%,
			cover,
			100% 100%;
		background-position: center, center, center;
		background-blend-mode: normal, multiply, normal;
	}

	:root {
		--noise-bg: none;
		--color-overscroll-top: var(--color-brand-green);
		--color-overscroll-bottom: var(--color-background);
	}

	:root::after {
		content: '';
		position: fixed;
		inset: 0;
		background: linear-gradient(var(--color-overscroll-top) 8%, var(--color-overscroll-bottom) 20%);
		z-index: -1;
	}

	.metro-wall-text {
		font-family: 'Inter', sans-serif;
		font-size: 14px;
		font-weight: 800;
		color: white;
		letter-spacing: 1px;
		text-transform: uppercase;
		line-height: 1.2;
	}
</style>
