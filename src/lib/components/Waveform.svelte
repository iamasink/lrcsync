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

let { file = $bindable() }: Props = $props()

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
$effect(() => {
	if (!file || !wavesurfer) return
	isReady = false
	wavesurfer.stop()
	const url = URL.createObjectURL(file)
	wavesurfer.load(url)
})

let volume: number = $state(50)
let volume2: number = $derived(perceptualToAmplitude(volume / 100))

function loadFile(file: File) {
	if (!file || !wavesurfer) return
	const url = URL.createObjectURL(file)
	wavesurfer.load(url)
}

function regionHasEndTime(index: number) {
	const lyric = s.lyrics[index]
	const regionStart = lyric.time / 1000

	const nextlyric = s.lyrics[index + 1]
	if (!nextlyric) {
		return true
	}
	let nextlyrictime = nextlyric.time / 1000
	if (nextlyric.text == "") {
		return true
	}
	if (nextlyrictime - regionStart > 5) {
		return true
	} else {
		return false
	}
}
function getRegionEndTime(index: number) {
	const lyric = s.lyrics[index]
	const regionStart = lyric.time / 1000

	const nextlyric = s.lyrics[index + 1]
	if (nextlyric) {
		let nextlyrictime = nextlyric.time / 1000
		if (nextlyric.text == "") {
			return nextlyrictime - 0.01
		}
		if (nextlyrictime - regionStart > 5) {
			return regionStart + 5
		} else {
			return nextlyrictime - 0.01
		}
	} else {
		return regionStart + 5
	}
}

function setRegions() {
	regions.clearRegions()

	const { lyrics, convertedLyrics, currentAudioLine, currentCaretLine } = s

	s.lyrics.forEach((lyric, index) => {
		if (lyric.time === -1) return
		if (lyric.text == "") return
		let resizeEnd = false

		const regionId = `lyric-${index}`
		const regionStart = lyric.time / 1000
		let end

		let color = "rgba(0, 255, 0, 0.1)"
		if (currentAudioLine == index) {
			color = "#ffffff1A"
		}
		if (currentCaretLine == index) {
			color = "#4a90e21A"
		}
		console.log(color)

		// let nextlyrictime = s.lyrics[index + 1].time / 1000
		if (regionHasEndTime(index)) {
			resizeEnd = true
		} else {
		}
		end = getRegionEndTime(index)
		// console.log(regionId, end)

		const regionEnd = end
		const region = regions.addRegion({
			id: regionId,
			start: regionStart,
			end: regionEnd,
			content: `${convertedLyrics[index]}`,
			color: color,
			drag: false,
			resize: true,
			resizeStart: true,
			resizeEnd,
		})
	})
}

let prevAudioLine: number | null = null
let prevCaretLine: number | null = null

export function updateSelectedRegions() {
	const linesToUpdate = new Set<number>()

	if (prevAudioLine !== null) linesToUpdate.add(prevAudioLine)
	if (prevCaretLine !== null) linesToUpdate.add(prevCaretLine)

	if (s.currentAudioLine !== null) linesToUpdate.add(s.currentAudioLine)
	if (s.currentCaretLine !== null) linesToUpdate.add(s.currentCaretLine)

	const allRegions = regions.getRegions()

	linesToUpdate.forEach((index) => {
		const regionId = `lyric-${index}`
		const region = allRegions.find(r => r.id === regionId)
		if (!region) return

		let color = "rgba(0, 255, 0, 0.1)"
		if (s.currentAudioLine === index) color = "rgba(255, 255, 255, 0.1)"
		if (s.currentCaretLine === index) color = "rgba(74, 144, 226, 0.1)"

		region.setOptions({ color: color })
	})

	prevAudioLine = s.currentAudioLine
	prevCaretLine = s.currentCaretLine
}

// https://github.com/katspaugh/wavesurfer.js/issues/3837
function ensureEvenWidth(container: HTMLElement) {
	if (!container) return
	let width = container.clientWidth
	if (width % 2 !== 0) {
		// force odd width
		container.style.width = width - 1 + "px"
	}
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

function onwheel(e: WheelEvent) {
	let delta = e.deltaY || -e.deltaX || e.deltaZ
	let newvolume = volume
	if (delta > 0) {
		newvolume -= 1
	} else if (delta < 0) {
		newvolume += 1
	} else return
	if (newvolume < 0) newvolume = 0
	if (newvolume > 100) newvolume = 100
	volume = newvolume
	updateVolume()
}
function updateVolume() {
	wavesurfer.setVolume(volume2)
}

onMount(() => {
	regions = Regions.create()
	timeline = Timeline.create()
	const minimap = Minimap.create({ overlayColor: "#f9f9f9" })

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
	ensureEvenWidth(waveformContainer)
	window.addEventListener("resize", () => ensureEvenWidth(waveformContainer))

	if (file) loadFile(file)

	wavesurfer.on("ready", () => {
		console.log("im ready!")
		audioDuration = wavesurfer.getDuration()
	})

	spectrogram.on("ready", () => {
		console.log("spectrogram ready!")
		isReady = true
		setRegions()
	})

	minimap.on("drag", (x) => {
		wavesurfer.setScroll(x)
	})

	wavesurfer.on("timeupdate", (newtime) => {
		s.audioTime = newtime * 1000
		// updateVisibleRegions()
	})

	wavesurfer.on("seeking", (newtime) => {
		console.log("seek!")
		s.audioTime = newtime * 1000
		// updateVisibleRegions()
	})

	regions.on("region-updated", (r) => {
		console.log("region updated", r)
		const idx = parseInt(r.id.substring(6))
		console.log(idx)

		const start = roundTimestamp(r.start * 1000)
		s.lyrics[idx].time = start

		if (regionHasEndTime(idx)) {
			console.log(idx, s.lyrics.length)
			if (idx + 1 == s.lyrics.length) {
				console.log("1")
				s.lyrics.push({ time: roundTimestamp(r.end * 1000), text: "" })
			} else {
				if (s.lyrics[idx + 1].text != "") {
					console.log("2")
					s.lyrics.splice(idx + 1, 0, { time: r.end * 1000, text: "" })
				} else {
					console.log("3")
					s.lyrics[idx + 1].time = (r.end + 0.01) * 1000
				}
			}
		}

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

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="waveforms-container"
	onclick={() => {
		const active = document.activeElement as HTMLElement | null
		if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT")) {
			active.blur() // remove focus
		}
	}}
>
	{#if file && !isReady}
		<div class="loading">
			<p>Loading waveforms...</p>
		</div>
	{/if}
	{#if !file}
		<div class="loading">
			<p class="noaudio">no audio loaded.</p>
		</div>
	{/if}
	<div class="volume">
		<input {onwheel} oninput={updateVolume} bind:value={volume} type="range" min="0" max="100" step="1" />
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
  will-change: transform, scroll-position;
}

:global(#waveform) {
  flex: 0 0 140px;
}
:global(#waveform ::part(scroll)) {
  scrollbar-width: auto;
}
/* 
:global(#waveform ::part(region-handle-right)) {
  display: none;
  cursor: none;
} */

.loading {
  position: absolute;
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
