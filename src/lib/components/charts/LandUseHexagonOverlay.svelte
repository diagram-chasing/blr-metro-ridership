<script>
	import { browser } from '$app/environment';

	let { data, width, height } = $props();

	let canvasElement = $state(null);

	$effect(() => {
		if (!browser || !canvasElement || !data || width === 0 || height === 0) return;
		const ctx = canvasElement.getContext('2d', { alpha: true });
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		canvasElement.style.width = `${width}px`;
		canvasElement.style.height = `${height}px`;

		const bufferWidth = Math.round(width * dpr);
		const bufferHeight = Math.round(height * dpr);

		if (canvasElement.width !== bufferWidth || canvasElement.height !== bufferHeight) {
			canvasElement.width = bufferWidth;
			canvasElement.height = bufferHeight;
			ctx.scale(dpr, dpr);
		}

		ctx.clearRect(0, 0, width, height);

		for (const hexagon of data) {
			if (!hexagon.points || hexagon.points.length < 3) continue;
			ctx.fillStyle = hexagon.color;
			ctx.globalAlpha = hexagon.opacity;
			ctx.beginPath();
			ctx.moveTo(hexagon.points[0].x, hexagon.points[0].y);
			for (let i = 1; i < hexagon.points.length; i++) {
				ctx.lineTo(hexagon.points[i].x, hexagon.points[i].y);
			}
			ctx.closePath();
			ctx.fill();
		}

		ctx.globalAlpha = 1.0;
	});
</script>

<canvas bind:this={canvasElement}></canvas>
