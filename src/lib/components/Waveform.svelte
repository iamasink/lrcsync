<script lang="ts">
import { type LyricLine, roundTimestamp } from "$lib/parseLRC"
import { ampToDB, perceptualToAmplitude } from "$lib/perceptual"
import { s } from "$lib/state.svelte"
import { onDestroy, onMount } from "svelte"
import WaveSurfer from "wavesurfer.js"
import Minimap from "wavesurfer.js/dist/plugins/minimap.esm.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js"
import Regions, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js"
import Spectrogram, { type SpectrogramPluginOptions } from "wavesurfer.js/dist/plugins/spectrogram.esm.js"
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js"
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js"

interface Props {
	file: File
}

let { file }: Props = $props()

let waveformContainer: HTMLDivElement
let spectrogramContainer: HTMLDivElement
let wavesurfer: WaveSurfer
let regions: RegionsPlugin
let timeline: TimelinePlugin
let currentTime = $state(0)
let audioDuration = $state(1)
let visibleRegionIds: Set<string> = $state(new Set())
let isReady = $state(false)

let autoScrollTimeout = $state(0)

$effect(() => {
	s.lyrics.length
	console.log("effect!")
	if (!regions) return
	if (!isReady) return
	console.log("effect 2!")

	setRegions()
})

let volume: number = $state(50)
let volume2: number = $derived(perceptualToAmplitude(volume / 100))

function loadFile(file: File) {
	if (!file || !wavesurfer) return
	const url = URL.createObjectURL(file)
	wavesurfer.load(url)
}

function setRegions() {
	regions.clearRegions()

	s.lyrics.forEach((lyric, index) => {
		if (lyric.time === -1) return

		const regionId = `lyric-${index}`
		const regionStart = lyric.time / 1000
		let end
		if (index == s.lyrics.length - 1) {
			end = audioDuration
		} else {
			let nextlyrictime = s.lyrics[index + 1].time / 1000
			if (nextlyrictime - regionStart > 5) {
				end = regionStart + 5
			} else {
				end = nextlyrictime - 0.01
			}
		}
		const regionEnd = end
		const region = regions.addRegion({
			id: regionId,
			start: regionStart,
			end: regionEnd,
			content: lyric.text,
			color: "rgba(0, 255, 0, 0.1)",
			drag: false,
			resize: true,
			resizeStart: true,
			resizeEnd: false,
		})
	})

	// 	regions = []

	// 	lyrics.forEach((lyric, index) => {
	// 	const regionId = `lyric-${index}`
	// 	const regionStart = lyric.time / 1000
	// 	let end
	// 	if (index == lyrics.length - 1) {
	// 		end = audioDuration
	// 	} else {
	// 		let nextlyrictime = lyrics[index + 1].time / 1000
	// 		if (nextlyrictime < lyric.time) {
	// 			nextlyrictime = lyric.time + 1
	// 			end = nextlyrictime - 0.01
	// 		} else if (nextlyrictime - regionStart > 10) {
	// 			end = regionStart + 5
	// 		} else {
	// 			end = nextlyrictime - 0.01
	// 		}
	// 	}
	// 	const regionEnd = end

	// 	if (regionStart <= currentTimeInSeconds + 10 && regionEnd >= currentTimeInSeconds - 10) {
	// 		const existingRegion = currentRegions.find((region: Region) => region.id === regionId)

	// 		if (!existingRegion) {
	// 			regions.addRegion({ id: regionId, start: regionStart, end: regionEnd, content: lyric.text, color: "rgba(0, 255, 0, 0.1)", drag: false, resize: false })
	// 		} else {
	// 			if (existingRegion.start !== regionStart || existingRegion.end !== regionEnd) {
	// 				existingRegion.setOptions({ start: regionStart, end: regionEnd, content: lyric.text })
	// 			}
	// 		}
	// 		newVisibleRegionIds.add(regionId)
	// 	} else {
	// 		const existingRegion = currentRegions.find((region: Region) => region.id === regionId)
	// 		if (existingRegion) {
	// 			existingRegion.remove()
	// 		}
	// 	}
	// })
}

export function play() {
	console.log("play!")
	s.isAudioPlaying = true
	wavesurfer?.play()
}

export function pause() {
	console.log("pause!")
	s.isAudioPlaying = false
	wavesurfer?.pause()
}

export function seekToTime(time: number) {
	if (wavesurfer) {
		wavesurfer.setTime(time)
	}
}

export function isPlaying() {
	return wavesurfer?.isPlaying() ?? false
}

export function getCurrentTime() {
	return wavesurfer?.getCurrentTime() ?? 0
}

export function getDuration() {
	return wavesurfer?.getDuration() ?? 0
}

export function togglePlayPause() {
	if (!isPlaying()) {
		play()
		console.log("play")
	} else {
		pause()
		console.log("pause")
	}
}

function updateVolume() {
	wavesurfer.setVolume(volume2)
}

onMount(() => {
	regions = Regions.create()
	timeline = Timeline.create()
	const minimap = Minimap.create({})

	const options: SpectrogramPluginOptions = { labels: true, height: 200 }
	const spectrogram = Spectrogram.create(options)

	wavesurfer = WaveSurfer.create({
		container: waveformContainer,
		waveColor: "#4F4A85",
		progressColor: "#383351",
		height: 120,
		dragToSeek: true,
		minPxPerSec: 100,
		plugins: [timeline, spectrogram, regions, minimap],
	})

	if (file) loadFile(file)

	wavesurfer.on("ready", () => {
		console.log("im ready!")
		audioDuration = wavesurfer.getDuration()
	})

	spectrogram.on("ready", () => {
		isReady = true
	})

	wavesurfer.on("timeupdate", () => {
		currentTime = wavesurfer.getCurrentTime()
		s.audioTime = currentTime * 1000
		// updateVisibleRegions()
	})

	wavesurfer.on("seeking", () => {
		console.log("seek!")
		currentTime = wavesurfer.getCurrentTime()
		s.audioTime = currentTime * 1000
		// updateVisibleRegions()
	})

	regions.on("region-updated", (r) => {
		console.log("region updated", r)
		const idx = parseInt(r.id.substring(6))
		console.log(idx)

		const start = roundTimestamp(r.start * 1000)
		const nextstart = roundTimestamp(r.end * 1000) + 10

		console.log(start, nextstart)

		s.lyrics[idx].time = start
		s.lyrics[idx + 1].time = nextstart

		wavesurfer.setTime(start / 1000)
		wavesurfer.options.autoCenter = false
		// wavesurfer.options.autoScroll = false

		if (autoScrollTimeout) {
			clearTimeout(autoScrollTimeout)
		}
		autoScrollTimeout = setTimeout(() => {
			wavesurfer.options.autoCenter = true
			wavesurfer.options.autoScroll = true
		}, 5000)
		wavesurfer.play()
	})

	updateVolume()
})

onDestroy(() => {
	if (wavesurfer) {
		wavesurfer.destroy()
	}
})
</script>

<div class="waveforms-container">
	{#if !isReady}
		<div class="loading">
			<p>Loading waveforms...</p>
		</div>
	{/if}
	<div class="volume">
		<input oninput={updateVolume} bind:value={volume} type="range" min="0" max="100" step="1" />
		<span>{volume}</span>% <span>({ampToDB(volume2).toFixed(1)}db)</span>
	</div>
	<div bind:this={waveformContainer} id="waveform"></div>
	<!-- <div bind:this={spectrogramContainer} class="spectrogram"></div> -->
</div>

<style>
.waveforms-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 450px;
  overflow: hidden;
}

:global(#waveform) {
  flex: 0 0 140px;
}
:global(#waveform ::part(scroll)) {
  scrollbar-width: auto;
}

:global(#waveform ::part(region-handle-right)) {
  display: none;
  cursor: none;
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
