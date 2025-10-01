<script lang="ts">
	import { onMount } from 'svelte';

	export let stationSvg = '';
	export let peopleCount = 50;
	export let particleSize = 3;
	export let densityColor = '70, 130, 220'; // RGB values for density visualization
	export let densityOpacity = 0.6;
	export let particleColor = '0, 255, 255'; // RGB values for individual particles
	export let particleOpacity = 0.8;
	export let clusterRadius = 25;
	export let densityBandwidth = 8; // Multiplier for cluster radius based on size
	export let maxDensityIntensity = 0.6;

	interface Point {
		x: number;
		y: number;
	}

	interface Platform {
		path: Path2D;
		bounds: {
			x: number;
			y: number;
			width: number;
			height: number;
		};
	}

	let canvasElement: HTMLCanvasElement;
	let svgElement: HTMLElement;
	let isVisible = true;
	let ctx: CanvasRenderingContext2D;

	function extractPlatformBounds(): Platform[] {
		if (!svgElement) return [];

		const svgDoc = svgElement.querySelector('svg');
		if (!svgDoc) return [];

		const platforms = svgDoc.querySelectorAll('[fill="#D9D9D9"]');
		const viewBox = svgDoc.getAttribute('viewBox');
		const rect = svgDoc.getBoundingClientRect();

		let scaleX = 1,
			scaleY = 1;
		if (viewBox) {
			const [, , vw, vh] = viewBox.split(' ').map(Number);
			scaleX = rect.width / vw;
			scaleY = rect.height / vh;
		}

		return Array.from(platforms).map((element) => {
			const bbox = (element as SVGGraphicsElement).getBBox();
			const pathData = getScaledPathData(element, scaleX, scaleY);

			return {
				path: new Path2D(pathData),
				bounds: {
					x: bbox.x * scaleX,
					y: bbox.y * scaleY,
					width: bbox.width * scaleX,
					height: bbox.height * scaleY
				}
			};
		});
	}

	function getScaledPathData(element: Element, scaleX: number, scaleY: number): string {
		const tagName = element.tagName.toLowerCase();

		if (tagName === 'path') {
			const d = element.getAttribute('d') || '';
			return scalePathData(d, scaleX, scaleY);
		}

		if (tagName === 'rect') {
			const x = parseFloat(element.getAttribute('x') || '0') * scaleX;
			const y = parseFloat(element.getAttribute('y') || '0') * scaleY;
			const width = parseFloat(element.getAttribute('width') || '0') * scaleX;
			const height = parseFloat(element.getAttribute('height') || '0') * scaleY;
			return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
		}

		if (tagName === 'polygon') {
			const points = element.getAttribute('points') || '';
			const coords = points.trim().split(/[\s,]+/);
			let pathData = '';

			for (let i = 0; i < coords.length; i += 2) {
				const x = parseFloat(coords[i]) * scaleX;
				const y = parseFloat(coords[i + 1]) * scaleY;
				pathData += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
			}
			return pathData + ' Z';
		}

		return '';
	}

	function scalePathData(pathData: string, scaleX: number, scaleY: number): string {
		return pathData.replace(
			/([MLHVCSQTAZ])\s*((?:[0-9.-]+(?:\s+|,)?)*)/gi,
			(_match: string, command: string, coords: string) => {
				if (!coords.trim()) return command;

				const numbers = coords
					.trim()
					.split(/[\s,]+/)
					.filter((n) => n)
					.map(parseFloat);
				const scaledNumbers: number[] = [];

				for (let i = 0; i < numbers.length; i += 2) {
					if (i + 1 < numbers.length) {
						scaledNumbers.push(numbers[i] * scaleX);
						scaledNumbers.push(numbers[i + 1] * scaleY);
					} else {
						scaledNumbers.push(numbers[i] * scaleX);
					}
				}

				return command + ' ' + scaledNumbers.join(' ');
			}
		);
	}

	function generatePeopleInPlatforms(count: number, platforms: Platform[]): Point[] {
		if (!platforms.length) {
			return Array.from({ length: count }, () => ({
				x: Math.random() * (canvasElement?.width || 400),
				y: Math.random() * (canvasElement?.height || 300)
			}));
		}

		const totalArea = platforms.reduce((sum, p) => sum + p.bounds.width * p.bounds.height, 0);
		const people: Point[] = [];

		platforms.forEach((platform) => {
			const ratio = (platform.bounds.width * platform.bounds.height) / totalArea;
			const peopleForArea = Math.round(count * ratio);

			for (let i = 0; i < peopleForArea && people.length < count; i++) {
				const point = generatePointInPlatform(platform);
				if (point) people.push(point);
			}
		});

		return people;
	}

	function generatePointInPlatform(platform: Platform): Point | null {
		if (!ctx) return null;

		// Try random points within bounds
		for (let attempts = 0; attempts < 100; attempts++) {
			const point: Point = {
				x: platform.bounds.x + Math.random() * platform.bounds.width,
				y: platform.bounds.y + Math.random() * platform.bounds.height
			};

			if (ctx.isPointInPath(platform.path, point.x, point.y)) {
				return point;
			}
		}

		// Fallback to center of bounds
		return {
			x: platform.bounds.x + platform.bounds.width / 2,
			y: platform.bounds.y + platform.bounds.height / 2
		};
	}

	function drawCrowdDensity() {
		if (!canvasElement || !isVisible || !ctx) return;

		const platforms = extractPlatformBounds();
		const people = generatePeopleInPlatforms(peopleCount, platforms);

		ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

		// Draw each platform separately with clipping
		platforms.forEach((platform) => {
			const platformPeople = people.filter((person) =>
				ctx.isPointInPath(platform.path, person.x, person.y)
			);

			if (platformPeople.length === 0) return;

			// Save context and apply clipping mask
			ctx.save();
			ctx.clip(platform.path);

			// Draw density blobs for this platform
			const clusters = createClustersForPlatform(platformPeople);

			clusters.forEach((cluster) => {
				const gradient = ctx.createRadialGradient(
					cluster.x,
					cluster.y,
					0,
					cluster.x,
					cluster.y,
					cluster.radius
				);

				gradient.addColorStop(0, `rgba(${densityColor}, ${cluster.intensity})`);
				gradient.addColorStop(1, `rgba(${densityColor}, 0)`);

				ctx.fillStyle = gradient;
				ctx.beginPath();
				ctx.arc(cluster.x, cluster.y, cluster.radius, 0, Math.PI * 2);
				ctx.fill();
			});

			// Add individual dots for this platform
			ctx.fillStyle = `rgba(${particleColor}, ${particleOpacity})`;
			ctx.beginPath();
			platformPeople.forEach((person) => {
				ctx.moveTo(person.x + particleSize, person.y);
				ctx.arc(person.x, person.y, particleSize * 0.5, 0, Math.PI * 2);
			});
			ctx.fill();

			// Restore context (removes clipping mask)
			ctx.restore();
		});
	}

	interface Cluster {
		x: number;
		y: number;
		radius: number;
		intensity: number;
		count: number;
	}

	function createClustersForPlatform(people: Point[]): Cluster[] {
		const clusters: Cluster[] = [];
		const processed = new Set<number>();

		people.forEach((person, i) => {
			if (processed.has(i)) return;

			const nearby: Point[] = [person];
			let totalX = person.x;
			let totalY = person.y;

			people.forEach((other, j) => {
				if (i === j || processed.has(j)) return;

				const distance = Math.sqrt((person.x - other.x) ** 2 + (person.y - other.y) ** 2);

				if (distance <= clusterRadius) {
					nearby.push(other);
					totalX += other.x;
					totalY += other.y;
					processed.add(j);
				}
			});

			if (nearby.length > 1) {
				clusters.push({
					x: totalX / nearby.length,
					y: totalY / nearby.length,
					radius: Math.sqrt(nearby.length) * densityBandwidth,
					intensity: Math.min((nearby.length / 10) * densityOpacity, maxDensityIntensity),
					count: nearby.length
				});
			}

			processed.add(i);
		});

		return clusters;
	}

	function setupCanvas() {
		if (!canvasElement || !svgElement) return;

		const context = canvasElement.getContext('2d');
		if (!context) return;
		ctx = context;

		const svgDoc = svgElement.querySelector('svg');
		if (!svgDoc) return;

		const rect = svgDoc.getBoundingClientRect();
		canvasElement.width = rect.width;
		canvasElement.height = rect.height;
		canvasElement.style.width = rect.width + 'px';
		canvasElement.style.height = rect.height + 'px';

		drawCrowdDensity();
	}

	onMount(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				isVisible = entries[0].isIntersecting;
				if (isVisible) drawCrowdDensity();
			},
			{ threshold: 0 }
		);

		if (canvasElement) observer.observe(canvasElement);

		if (svgElement) {
			requestAnimationFrame(() => setupCanvas());
		}

		return () => observer.disconnect();
	});

	$: if (
		canvasElement &&
		(peopleCount ||
			particleSize ||
			densityColor ||
			densityOpacity ||
			particleColor ||
			particleOpacity ||
			clusterRadius ||
			densityBandwidth ||
			maxDensityIntensity)
	) {
		drawCrowdDensity();
	}
</script>

<div class="crowd-simulation">
	<div class="svg-container">
		<div bind:this={svgElement} class="svg-content">
			{@html stationSvg}
		</div>
		<canvas bind:this={canvasElement} class="particle-canvas"></canvas>
	</div>
</div>

<style>
	.crowd-simulation {
		position: relative;
		display: inline-block;
	}

	.svg-container {
		position: relative;
		display: inline-block;
	}

	.svg-content {
		display: block;
	}

	.svg-content :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
	}

	.particle-canvas {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
