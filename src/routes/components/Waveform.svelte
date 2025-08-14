<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import WaveSurfer from "wavesurfer.js";
	import Spectrogram, {
		type SpectrogramPluginOptions,
	} from "wavesurfer.js/dist/plugins/spectrogram.esm.js";
	import Regions, {
		type Region,
	} from "wavesurfer.js/dist/plugins/regions.esm.js";

	interface Props {
		file: File;
		lyrics: { time: number; text: string }[];
		onTimeUpdate?: (time: number) => void;
	}

	let { file, lyrics, onTimeUpdate }: Props = $props();

	let waveformContainer: HTMLDivElement;
	let spectrogramContainer: HTMLDivElement;
	let wavesurfer: WaveSurfer;
	let regions: any;
	let currentTime = $state(0);
	let audioDuration = $state(1);
	let visibleRegionIds: Set<string> = $state(new Set());
	let isReady = $state(false);

	function loadFile(file: File) {
		if (!file || !wavesurfer) return;
		const url = URL.createObjectURL(file);
		wavesurfer.load(url);
	}

	function updateVisibleRegions() {
		if (!wavesurfer || !regions) return;

		const currentTimeInSeconds = wavesurfer.getCurrentTime();
		const currentRegions = regions.getRegions();

		const newVisibleRegionIds = new Set<string>();

		lyrics.forEach((lyric, index) => {
			const regionId = `lyric-${index}`;
			const regionStart = lyric.time / 1000;
			let end;
			if (index == lyrics.length - 1) {
				end = audioDuration;
			} else {
				let nextlyrictime = lyrics[index + 1].time / 1000;
				if (nextlyrictime - regionStart > 10) {
					end = regionStart + 5;
				} else {
					end = nextlyrictime - 0.01;
				}
			}
			const regionEnd = end;

			if (
				regionStart <= currentTimeInSeconds + 10 &&
				regionEnd >= currentTimeInSeconds - 10
			) {
				const existingRegion = currentRegions.find(
					(region: Region) => region.id === regionId,
				);

				if (!existingRegion) {
					regions.addRegion({
						id: regionId,
						start: regionStart,
						end: regionEnd,
						content: lyric.text,
						color: "rgba(0, 255, 0, 0.1)",
						drag: false,
						resize: false,
					});
				} else {
					if (
						existingRegion.start !== regionStart ||
						existingRegion.end !== regionEnd
					) {
						existingRegion.setOptions({
							start: regionStart,
							end: regionEnd,
							content: lyric.text,
						});
					}
				}
				newVisibleRegionIds.add(regionId);
			} else {
				const existingRegion = currentRegions.find(
					(region: Region) => region.id === regionId,
				);
				if (existingRegion) {
					existingRegion.remove();
				}
			}
		});

		visibleRegionIds = newVisibleRegionIds;
	}

	export function play() {
		wavesurfer?.play();
	}

	export function pause() {
		wavesurfer?.pause();
	}

	export function seekTo(time: number) {
		if (wavesurfer) {
			wavesurfer.setTime(time);
		}
	}

	export function isPlaying() {
		return wavesurfer?.isPlaying() ?? false;
	}

	export function getCurrentTime() {
		return wavesurfer?.getCurrentTime() ?? 0;
	}

	export function getDuration() {
		return wavesurfer?.getDuration() ?? 0;
	}

	export function togglePlayPause() {
		if (!isPlaying()) {
			wavesurfer.play();
			console.log("play");
		} else {
			wavesurfer.pause();
			console.log("pause");
		}
	}

	export function updateRegions() {
		updateVisibleRegions();
	}

	onMount(() => {
		regions = Regions.create();

		const options: SpectrogramPluginOptions = {
			container: spectrogramContainer,
			labels: true,
			height: 200, 
		};
		const spectrogram = Spectrogram.create(options);

		wavesurfer = WaveSurfer.create({
			container: waveformContainer,
			waveColor: "#4F4A85",
			progressColor: "#383351",
			height: 120, 
			dragToSeek: true,
			minPxPerSec: 100,
			plugins: [spectrogram, regions],
		});

		if (file) loadFile(file);

		wavesurfer.on("ready", () => {
			console.log("im ready!");
			audioDuration = wavesurfer.getDuration();
		});

		spectrogram.on("ready", () => {
			isReady = true;
		});

		wavesurfer.on("timeupdate", () => {
			currentTime = wavesurfer.getCurrentTime();
			onTimeUpdate?.(currentTime * 1000); 
			updateVisibleRegions();
		});

		wavesurfer.on("seeking", () => {
			currentTime = wavesurfer.getCurrentTime();
			onTimeUpdate?.(currentTime * 1000);
			updateVisibleRegions();
		});
	});

	onDestroy(() => {
		if (wavesurfer) {
			wavesurfer.destroy();
		}
	});
</script>

<div class="waveforms-container">
	{#if !isReady}
		<div class="loading">
			<p>Loading waveforms...</p>
		</div>
	{/if}
	<div bind:this={waveformContainer} class="waveform"></div>
	<div bind:this={spectrogramContainer} class="spectrogram"></div>
</div>

<style>
	.waveforms-container {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-height: 320px; 
		overflow: hidden; 
	}

	.waveform {
		flex: 0 0 120px;
	}

	.spectrogram {
		flex: 0 0 200px; 
	}

	.loading {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.4); 
		display: flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-size: 1.2rem;
		pointer-events: none;
		z-index: 10;
	}
</style>
