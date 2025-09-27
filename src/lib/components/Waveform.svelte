<script lang="ts">
import { type LyricLine, roundTimestamp } from "$lib/parseLRC"
import { ampToDB, perceptualToAmplitude } from "$lib/perceptual"
import { s } from "$lib/state.svelte"
import { onDestroy, onMount } from "svelte"
import type { WheelEventHandler } from "svelte/elements"
import WaveSurfer from "wavesurfer.js"
import Minimap from "wavesurfer.js/dist/plugins/minimap.esm.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js"
import Regions, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js"
import Spectrogram, { type SpectrogramPluginOptions } from "wavesurfer.js/dist/plugins/spectrogram.esm.js"
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js"
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js"

let file: File | null = $state(null)
let waveformContainer: HTMLDivElement
let spectrogramContainer: HTMLDivElement
let wavesurfer: WaveSurfer | null = null
let regions: RegionsPlugin
let timeline: TimelinePlugin
let currentTime = $state(0)
let audioDuration = $state(1)
let visibleRegionIds: Set<string> = $state(new Set())
let isReady = $state(false)

const AUTOCENTER_DEFAULT = true
const AUTOSCROLL_DEFAULT = true

let autoScrollTimeout: number = $state(0)

const regionColours = { default: "rgba(0, 255, 0, 0.04)", audio: "rgba(255, 255, 255, 0.3)", caret: "rgba(74, 144, 226, 0.3)" }
let volume: number = $state(50)
let volume2: number = $derived(perceptualToAmplitude(volume / 100))

let regionCache: Record<string, Region> = {}

let lastObjectUrl: string | null = null
let resizeHandler: (() => void) | null = null

$effect(() => {
	s.lyrics
	if (!isReady) return

	updateRegions()
})

$effect(() => {
	// run whenever file or waveformContainer changes
	if (!waveformContainer) return

	// if there's no file, destroy any existing instance
	if (!file) {
		if (wavesurfer) {
			wavesurfer.stop()
			wavesurfer.destroy()
			wavesurfer = null
		}
		regionCache = {}
		isReady = false
		if (lastObjectUrl) {
			URL.revokeObjectURL(lastObjectUrl)
			lastObjectUrl = null
		}
		// remove resize handler if present
		if (resizeHandler) {
			window.removeEventListener("resize", resizeHandler)
			resizeHandler = null
		}
		return
	}

	// destroy previous instance
	if (wavesurfer) {
		wavesurfer.stop()
		wavesurfer.destroy()
		wavesurfer = null
	}
	regionCache = {}
	isReady = false
	visibleRegionIds = new Set()

	regions = RegionsPlugin.create()
	timeline = Timeline.create()
	const minimap = Minimap.create({ overlayColor: "#f9f9f9" })
	const spectrogram = Spectrogram.create({ labels: true, height: 200 })

	wavesurfer = WaveSurfer.create({
		container: waveformContainer,
		waveColor: "#4F4A85",
		progressColor: "#383351",
		height: 120,
		dragToSeek: false,
		minPxPerSec: 100,
		plugins: [timeline, spectrogram, regions, minimap],
		autoCenter: AUTOCENTER_DEFAULT,
		autoScroll: AUTOSCROLL_DEFAULT,
		backend: "WebAudio",
	})

	// ensure even width
	ensureEvenWidth(waveformContainer)
	resizeHandler = () => ensureEvenWidth(waveformContainer)
	window.addEventListener("resize", resizeHandler)

	wavesurfer.on("ready", () => {
		audioDuration = wavesurfer?.getDuration() ?? 0

		wavesurfer?.setVolume(perceptualToAmplitude(volume / 100))
	})

	spectrogram.on("ready", () => {
		isReady = true
		updateRegions()
	})

	minimap.on("drag", (x) => {
		wavesurfer?.setScroll(x)
	})

	wavesurfer.on("timeupdate", (newtime) => {
		s.audioTime = newtime * 1000
	})
	wavesurfer.on("seeking", (newtime) => {
		s.audioTime = newtime * 1000
	})

	regions.on("region-updated", (r) => {
		updateregion(r)
		wavesurfer?.setTime(r.start)
	})

	if (lastObjectUrl) {
		URL.revokeObjectURL(lastObjectUrl)
		lastObjectUrl = null
	}
	lastObjectUrl = URL.createObjectURL(file)
	wavesurfer.load(lastObjectUrl)

	// cleanup
	return () => {
		if (wavesurfer) {
			wavesurfer.stop()
			wavesurfer.destroy()
			wavesurfer = null
		}
		if (lastObjectUrl) {
			URL.revokeObjectURL(lastObjectUrl)
			lastObjectUrl = null
		}
		if (resizeHandler) {
			window.removeEventListener("resize", resizeHandler)
			resizeHandler = null
		}
		regionCache = {}
		isReady = false
	}
})
$effect(() => {
	if (!wavesurfer) return
	wavesurfer.setVolume(volume2)
})

export async function loadFile(loadfile: File) {
	if (!loadfile) return
	file = loadfile

	if (wavesurfer) {
		if (lastObjectUrl) {
			URL.revokeObjectURL(lastObjectUrl)
			lastObjectUrl = null
		}
		lastObjectUrl = URL.createObjectURL(loadfile)
		await wavesurfer.load(lastObjectUrl)
	}
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
	// if (nextlyrictime - regionStart > 5) {
	// 	return true
	// }

	return false
}
function getRegionEndTime(index: number) {
	const lyric = s.lyrics[index]
	const regionStart = lyric.time / 1000

	// find the next valid lyric with a timestamp
	for (let lookahead = 1; index + lookahead < s.lyrics.length; lookahead++) {
		const nextLyric = s.lyrics[index + lookahead]
		if (!nextLyric || nextLyric.time === -1) continue
		return nextLyric.time / 1000 - 0.01
	}

	return wavesurfer?.getDuration() ?? 9999
}

export function updateRegions() {
	const { lyrics, convertedLyrics, currentAudioLine, currentCaretLine } = s
	if (!regions || !wavesurfer) return
	const existingRegions = regions.getRegions()

	const usedRegions = new Set<string>()

	for (let i = 0; i < lyrics.length; i++) {
		const lyric = lyrics[i]
		if (lyric.time === -1 || lyric.text === "") continue

		const regionId = `lyric-${i}`
		const regionStart = lyric.time / 1000
		const regionEnd = getRegionEndTime(i)
		const resizeEnd = regionHasEndTime(i)

		let color: string

		if (currentCaretLine === i) {
			color = regionColours.caret
		} else if (currentAudioLine === i) {
			color = regionColours.audio
		} else {
			color = regionColours.default
		}

		let region = regionCache[regionId]

		if (region) {
			// console.log("updating region for lyric", `lyric-${i}`, { start: regionStart, end: regionEnd, content: convertedLyrics[i], color, resizeEnd })
			region.setOptions({
				id: regionId,
				start: regionStart,
				end: regionEnd,
				content: convertedLyrics[i],
				color,
				drag: false,
				resize: true,
				resizeStart: true,
				resizeEnd,
			})
		} else {
			// console.log("creating new region for lyric", `lyric-${i}`)
			region = regions.addRegion({
				id: regionId,
				start: regionStart,
				end: regionEnd,
				content: convertedLyrics[i],
				color,
				drag: false,
				resize: true,
				resizeStart: true,
				resizeEnd,
			})
			regionCache[regionId] = region
		}

		usedRegions.add(regionId)
	}

	for (const region of existingRegions) {
		if (!usedRegions.has(region.id)) {
			region.remove()
			delete regionCache[region.id]
		}
	}
}

let prevAudioLine: number | null = null
let prevCaretLine: number | null = null

export function updateSelectedRegions() {
	// console.log("update regions")
	// const linesToUpdate = new Set<number>()

	// if (prevAudioLine !== null) linesToUpdate.add(prevAudioLine)
	// if (prevCaretLine !== null) linesToUpdate.add(prevCaretLine)

	// if (s.currentAudioLine !== null) linesToUpdate.add(s.currentAudioLine)
	// if (s.currentCaretLine !== null) linesToUpdate.add(s.currentCaretLine)

	// const allRegions = regions.getRegions()

	// linesToUpdate.forEach((index) => {
	// 	const regionId = `lyric-${index}`
	// 	console.log("updating region", regionId)
	// 	const region = allRegions.find(r => r.id === regionId)
	// 	if (!region) return

	// 	let color = "rgba(0, 255, 0, 0.1)"
	// 	if (s.currentAudioLine === index) color = "rgba(255, 255, 255, 0.1)"
	// 	if (s.currentCaretLine === index) color = "rgba(74, 144, 226, 0.1)"

	// 	region.setOptions({ color: color })
	// })

	// prevAudioLine = s.currentAudioLine
	// prevCaretLine = s.currentCaretLine
	updateRegions()
}

// https://github.com/katspaugh/wavesurfer.js/issues/3837
function ensureEvenWidth(container: HTMLElement) {
	requestAnimationFrame(() => {
		console.log("1")
		if (!container) return
		console.log("2")
		let width = container.clientWidth
		if (width % 2 !== 0) {
			container.style.width = width - 1 + "px"
		}
	})
}

export function play() {
	// console.log("play!")
	s.isAudioPlaying = true
	wavesurfer?.play()
}

export function pause() {
	// console.log("pause!")
	s.isAudioPlaying = false
	wavesurfer?.pause()
}

export function seekToTime(time: number) {
	if (time == -1) return
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
		// console.log("play")
	} else {
		pause()
		// console.log("pause")
	}
}

function onvolumewheel(e: WheelEvent) {
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
	e.preventDefault()
	updateVolume()
}
function updateVolume() {
	if (wavesurfer) {
		wavesurfer.setVolume(volume2)
	}
}

function updateregion(r: Region, side: "start" | "end" | undefined = undefined) {
	// console.log("region updated", r.id)
	const idx = parseInt(r.id.substring(6))
	console.log(idx)

	const start = roundTimestamp(r.start * 1000)
	s.lyrics[idx].time = start

	if (regionHasEndTime(idx)) {
		if (idx + 1 == s.lyrics.length) {
			s.lyrics.push({ time: roundTimestamp(r.end * 1000), text: "" })
		} else {
			if (s.lyrics[idx + 1].text != "") {
				s.lyrics.splice(idx + 1, 0, { time: r.end * 1000, text: "" })
			} else {
				s.lyrics[idx + 1].time = (r.end + 0.01) * 1000
			}
		}
	}
	if (wavesurfer) {
		wavesurfer.options.autoCenter = false
		// wavesurfer.options.autoScroll = false

		if (autoScrollTimeout) {
			clearTimeout(autoScrollTimeout)
		}
		autoScrollTimeout = window.setTimeout(() => {
			if (!wavesurfer) return

			wavesurfer.options.autoCenter = AUTOCENTER_DEFAULT
			wavesurfer.options.autoScroll = AUTOSCROLL_DEFAULT
		}, 5000)
		wavesurfer.play()
	}
}

function handleScroll(e: WheelEvent) {
	let delta = e.deltaY
	if (!delta) return
	let newscroll = (wavesurfer?.getScroll() ?? 0) + (delta / 2)
	if (wavesurfer) {
		wavesurfer.options.autoCenter = false
		wavesurfer.options.autoScroll = false
		wavesurfer.setScroll(newscroll)
	}

	if (autoScrollTimeout) {
		clearTimeout(autoScrollTimeout)
	}
	autoScrollTimeout = window.setTimeout(() => {
		if (!wavesurfer) return
		wavesurfer.options.autoCenter = AUTOCENTER_DEFAULT
		wavesurfer.options.autoScroll = AUTOSCROLL_DEFAULT
	}, 5000)

	e.preventDefault()
}
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
	<div class="above">
		<div class="volume" onwheel={onvolumewheel}>
			<input oninput={updateVolume} bind:value={volume} type="range" min="0" max="100" step="1" />
			<span>{volume}</span>% <span>({ampToDB(volume2).toFixed(1)}db)</span>
		</div>
		<div class="nextlyric">
			<i>syncing:</i> {s.lyrics[s.currentCaretLine]?.text ?? ""}
		</div>
	</div>
	<div bind:this={waveformContainer} id="waveform" onwheel={handleScroll}></div>
</div>

<style>
.waveforms-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 450px;
  overflow: hidden;
  will-change: transform, scroll-position;
}

:global(#waveform) {
  flex: 0 0 140px;
  background-color: #000000;
}
:global(#waveform ::part(scroll)) {
  scrollbar-width: auto;
}
:global(#waveform ::part(region-content)) {
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.836);
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

.above {
  flex-direction: row;
  display: flex;
  min-width: 100%;
  justify-content: space-between;

  .nextlyric {
    position: absolute;
    left: 60%;

    i {
      opacity: 50%;
    }
  }
}
</style>
