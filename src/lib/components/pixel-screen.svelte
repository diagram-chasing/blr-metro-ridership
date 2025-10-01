<script>
	import PlasticTexture from '$lib/assets/images/plastic-texture.jpg';
	import PixelTexture from '$lib/assets/images/rgb-pixels-texture.jpg';
	import FlickerText from '$lib/components/ui/FlickerText.svelte';
</script>

<main
	class="pointer-events-none"
	style="--plastic-texture: url('{PlasticTexture}'); --pixel-texture: url('{PixelTexture}')"
>
	<div class="sign-container">
		<div class="mounting-brackets">
			<div class="bracket"></div>
			<div class="bracket"></div>
		</div>

		<div class="sign-housing">
			<div class="bottom-labels">
				<div class="label-section">
					<div class="label-text-kannada">ಕಡೆಗೆ</div>
				</div>
				<!-- <div class="model-info !text-center">PIS-2000</div> -->
				<div class="label-section">
					<div class="label-text-kannada">ಸಮಯ</div>
				</div>
			</div>
			<div class="pixel-bezel">
				<div class="pixel-screen">
					<div class="pixel-overlay"></div>
					<div class="display-content">
						<div class="message-section">
							<div class="kannada-text">A project by</div>
							<div class="english-text">
								<FlickerText text="Diagram Chasing" flickerIntensity="heavy" />
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="bottom-labels">
				<div class="label-section">
					<div class="label-text">Towards</div>
				</div>
				<div class="brand-section">
					<div class="brand-logo">THALES</div>
				</div>
				<div class="label-section">
					<div class="label-text">Time</div>
				</div>
			</div>
		</div>
	</div>
</main>

<style>
	main {
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;
		overflow: hidden;
		padding: 2rem 1rem;
	}

	@media (max-width: 768px) {
		main {
			min-height: 30vh;
			padding: 0 0.5rem;
		}
	}

	.sign-container {
		position: relative;
		transform: perspective(1000px) rotateX(-1deg);
		width: 100%;
	}

	@media (max-width: 768px) {
		.sign-container {
			transform: perspective(800px) rotateX(-0.5deg);
			max-width: 100%;
		}
	}

	.mounting-brackets {
		position: absolute;
		top: -18px;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-between;
		padding: 0 45px;
	}

	@media (max-width: 768px) {
		.mounting-brackets {
			padding: 0 15px;
		}
	}

	.bracket {
		width: 20px;
		height: 40px;
		background:
			linear-gradient(
				145deg,
				rgba(208, 208, 208, 0.9) 0%,
				rgba(184, 184, 184, 0.9) 30%,
				rgba(160, 160, 160, 0.9) 70%,
				rgba(153, 153, 153, 0.9) 100%
			),
			var(--plastic-texture);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-blend-mode: multiply;
		border: 1px solid #888888;
		border-radius: 6px 6px 0 0;
		box-shadow:
			0 2px 4px rgba(0, 0, 0, 0.2),
			inset 0 1px 2px rgba(255, 255, 255, 0.4);
		position: relative;
	}

	.bracket::before {
		content: '';
		position: absolute;
		top: 4px;
		left: 50%;
		transform: translateX(-50%);
		width: 6px;
		height: 6px;
		background: radial-gradient(circle, #222222 0%, #444444 40%, #666666 100%);
		border-radius: 50%;
		box-shadow:
			inset 0 1px 1px rgba(0, 0, 0, 0.6),
			0 1px 1px rgba(255, 255, 255, 0.2);
	}

	.sign-housing {
		background:
			linear-gradient(
				145deg,
				rgba(240, 240, 240, 0.95) 0%,
				rgba(220, 220, 220, 0.95) 30%,
				rgba(200, 200, 200, 0.95) 70%,
				rgba(190, 190, 190, 0.95) 100%
			),
			var(--plastic-texture);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		background-blend-mode: multiply;
		border: 1px solid #999999;
		border-radius: 8px;
		padding: 6px;
		box-shadow:
			0 8px 16px rgba(0, 0, 0, 0.25),
			inset 0 2px 4px rgba(255, 255, 255, 0.3),
			inset 0 -1px 2px rgba(0, 0, 0, 0.1);
		position: relative;
		width: 100%;
	}

	@media (max-width: 768px) {
		.sign-housing {
			padding: 4px;
			border-radius: 6px;
		}
	}

	.pixel-bezel {
		background: linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0a0a0a 100%);
		border: 1px solid #333333;
		border-radius: 4px;
		padding: 8px;
		box-shadow:
			inset 0 2px 4px rgba(0, 0, 0, 0.8),
			0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.pixel-screen {
		background: #0a0a0a;
		border-radius: 2px;
		padding: 20px 10px;
		position: relative;
		overflow: hidden;
		min-height: 100px;
		animation: screen-flicker 18s ease-in-out infinite;
	}

	@media (max-width: 768px) {
		.pixel-screen {
			padding: 16px 20px;
			min-height: 80px;
		}
	}

	.pixel-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background:
			linear-gradient(rgba(255, 255, 0, 0.03), rgba(255, 255, 0, 0.03)), var(--pixel-texture);
		background-size: cover;
		background-position: center;
		border-radius: 2px;
		pointer-events: none;
		opacity: 0.4;
		animation: pixel-shimmer 8s ease-in-out infinite alternate;
	}

	@keyframes pixel-shimmer {
		0% {
			opacity: 0.3;
		}
		100% {
			opacity: 0.5;
		}
	}

	.display-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: flex-start;
		height: 100%;
		position: relative;
		z-index: 2;
	}

	.message-section {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		text-align: left;
	}

	.kannada-text {
		font-family: 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 600;
		color: #ffff00;
		text-shadow:
			0 0 8px rgba(255, 255, 0, 0.6),
			0 0 16px rgba(255, 255, 0, 0.3);
		letter-spacing: 0.5px;
		line-height: 1.2;
	}

	.english-text {
		font-family: 'Inter', sans-serif;
		font-size: 24px;
		font-weight: 800;
		color: #ffff00;
		text-shadow:
			0 0 10px rgba(255, 255, 0, 0.7),
			0 0 20px rgba(255, 255, 0, 0.4);
		letter-spacing: 0.3px;
		line-height: 1.1;
		text-transform: uppercase;
	}

	@media (max-width: 768px) {
		.kannada-text {
			font-size: 16px;
			letter-spacing: 0.3px;
		}

		.english-text {
			font-size: 20px;
			letter-spacing: 0.2px;
		}
	}

	.bottom-labels {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0 8px;
	}

	.label-section {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.label-text-kannada {
		font-family: serif;
		font-size: 16px;
		font-weight: 600;
		color: #121212;
		letter-spacing: 0.3px;
		margin-bottom: 2px;
	}

	.label-text {
		font-family: serif;
		font-size: 20px;
		font-weight: 700;
		color: #121212;
		text-transform: capitalize;
		letter-spacing: 0.5px;
		text-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1);
	}

	.brand-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		margin-top: 10px;
	}

	.brand-logo {
		font-family: 'Inter', sans-serif;
		font-size: 8px;
		font-weight: 900;
		color: white;
		background: #424242;
		padding: 2px 5px;
		border-radius: 3px;
		letter-spacing: 1px;
		box-shadow:
			inset 0 1px 1px rgba(255, 255, 255, 0.1),
			0 1px 2px rgba(0, 0, 0, 0.3);
	}

	@media (max-width: 768px) {
		.label-text-kannada {
			font-size: 10px;
		}

		.label-text {
			font-size: 9px;
		}

		.brand-logo {
			font-size: 11px;
			padding: 1px 6px;
		}
	}

	.pixel-screen {
		animation: screen-flicker 18s ease-in-out infinite;
	}

	@keyframes screen-flicker {
		0%,
		98%,
		100% {
			opacity: 1;
		}
		99% {
			opacity: 0.97;
		}
	}
</style>
