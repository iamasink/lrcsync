<script lang="ts">
import { historyManager } from "$lib/history.svelte"
import { cleanAndSort, type LyricLine, roundTimestamp, sortLines, toCentiseconds } from "$lib/parseLRC"
import { ampToDB, perceptualToAmplitude } from "$lib/perceptual"
import { preferences, s } from "$lib/state.svelte"
import { onDestroy, onMount } from "svelte"
import type { WheelEventHandler } from "svelte/elements"
import WaveSurfer from "wavesurfer.js"
import Minimap from "wavesurfer.js/dist/plugins/minimap.esm.js"
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js"
import Regions, { type Region } from "wavesurfer.js/dist/plugins/regions.esm.js"
import Spectrogram, { type SpectrogramPluginOptions } from "wavesurfer.js/dist/plugins/spectrogram.esm.js"
import Timeline from "wavesurfer.js/dist/plugins/timeline.esm.js"
import type TimelinePlugin from "wavesurfer.js/dist/plugins/timeline.esm.js"
import { guess } from "web-audio-beat-detector"

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

let isBpmEnabled = $state(false)
let audioBPM = $state(0)
let audioBPMOffsetMs = $state(0)
let bpmLoading = $state(false)

let bpmMin = $state(100)
let bpmMax = $state(200)

const AUTOCENTER_DEFAULT = true
const AUTOSCROLL_DEFAULT = true

let autoScrollTimeout: number = $state(0)

// BUG: region colours look different (opacity) on firefox, chromium.
// if gfx.webrender.layer-compositor = true (default in future?), this is unnecessary
// const isFirefox = /Firefox/.test(navigator.userAgent)
// const applyFirefoxFix = isFirefox
const applyFirefoxFix = false

function getAlpha(firefox: number, other?: number) {
	if (other) {
		return applyFirefoxFix ? firefox : other
	} else {
		return applyFirefoxFix ? firefox : firefox * 2
	}
}

const regionColours = {
	default: `rgba(0, 255, 0,  ${getAlpha(0.02, 0.10)})`,
	audio: `rgba(255, 255, 255, ${getAlpha(0.15)})`,
	caret: `rgba(74, 144, 226, ${getAlpha(0.15)})`,
	beatTick: `rgba(30, 200, 0, ${getAlpha(0.10)})`,
}

let volume: number = $state($preferences.volume)
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
	if (!isReady || !wavesurfer) return
	updateBpmMarkers()
})

// $effect(() => {
// 	wavesurfer?.setTime(s.audioTime)
// })

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
		s.waveformLoading = false
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
	s.waveformLoading = true
	visibleRegionIds = new Set()

	regions = RegionsPlugin.create()
	timeline = Timeline.create()
	const minimap = Minimap.create({ overlayColor: "#f9f9f9" })
	const spectrogram = Spectrogram.create({ labels: true, height: 200, useWebWorker: true })

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
		ensureEvenWidth(waveformContainer)
	})

	spectrogram.on("ready", () => {
		isReady = true
		s.waveformLoading = false
		updateRegions()
		wavesurfer?.stop()
		guessTempo().then(() => {
			setTimeout(() => {
				updateBpmMarkers()
			}, 1000)
		})
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
		if (!r.id.startsWith("bpm-tick")) {
			updateregion(r)
			wavesurfer?.setTime(r.start)
		}
	})

	if (lastObjectUrl) {
		URL.revokeObjectURL(lastObjectUrl)
		lastObjectUrl = null
	}
	lastObjectUrl = URL.createObjectURL(file)
	// you must be patient.
	// (allow other stuff to load before the big hang from loading waveforms)
	// there must be a better way to handle it, but this works for now<3
	setTimeout(() => {
		wavesurfer?.load(lastObjectUrl!)
	}, 100)

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
$effect(() => {
	if (isReady) {
		console.log("waveform ready! :)")
		// reset time, etc. because bad things might have happened.
		s.audioTime = 0
		s.currentCaretLine = 0
		s.currentAudioLine = 0
	}
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

// is the next line a blank line (giving this region an end time)?
function regionHasEndTime(index: number) {
	const lyric = s.lyrics[index]
	const regionStart = lyric.time / 1000

	for (let i = index + 1; i < s.lyrics.length; i++) {
		const nextLyric = s.lyrics[i]
		if (nextLyric.time === -1) continue // skip invalid times

		if (nextLyric.text === "") {
			return true
		}
		return false
	}

	return true
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

export function updateBpmMarkers() {
	if (!regions || !wavesurfer) return

	const duration = wavesurfer.getDuration()
	if (!duration || duration <= 0) return

	const beatInterval = 60 / audioBPM // seconds per beat

	const existingRegions = regions.getRegions()
	const usedBpmRegions = new Set<string>()

	if (isBpmEnabled) {
		for (let time = audioBPMOffsetMs / 1000; time < duration; time += beatInterval) {
			if (time < 0) continue

			const regionId = `bpm-tick-${Math.round(time * 1000)}`
			usedBpmRegions.add(regionId)

			const existingRegion = existingRegions.find(r => r.id === regionId)

			if (!existingRegion) {
				regions.addRegion({ id: regionId, start: time, content: "", color: regionColours.beatTick, drag: false, resize: false })
			}
		}
	}

	for (const region of existingRegions) {
		if (region.id.startsWith("bpm-tick") && !usedBpmRegions.has(region.id)) {
			region.remove()
		}
	}
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

		// add part for lyrics that can be dragged on the right
		if (regionHasEndTime(i)) {
			// console.log("awawa") // region.element?.querySelector(".region-handle-right")!.classList.add("nextblank")
			// region.element?.querySelector(".region-handle-right")!.part.add("handle-right-nextblank")
			;(region.element?.childNodes[1] as HTMLElement).part.add("handle-right-nextblank")
		} else {
			;(region.element?.childNodes[1] as HTMLElement).part.remove("handle-right-nextblank")
		}

		usedRegions.add(regionId)
	}

	for (const region of existingRegions) {
		if (!usedRegions.has(region.id) && !region.id.startsWith("bpm-tick")) {
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
	if (!container) return

	const cssWidth = container.clientWidth
	const evenCssWidth = cssWidth - (cssWidth % 2) // make even

	const innerdiv = container.querySelector("div")
	// console.log(innerdiv)
	if (!innerdiv) return
	// idk
	innerdiv.style.width = (Math.floor(evenCssWidth / 10) * 10).toString() + "px"
	// q.style.width = "501px"
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

// Jump to a specific time in the audio (in seconds)
export function seekToTime(time: number) {
	if (!wavesurfer) return

	time = Math.max(0, time)
	time = Math.min(wavesurfer?.getDuration(), time)

	wavesurfer.setTime(time)
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

	// update start,
	const start = toCentiseconds(r.start * 1000)
	if (start != s.lyrics[idx].time) {
		console.log("sjkfhdkjsdf")
		console.log("start", start)
		console.log(toCentiseconds(s.lyrics[idx - 1].time ?? 0) + 10)

		s.lyrics[idx].time = Math.max(start, toCentiseconds(s.lyrics[idx - 1].time ?? 0) + 100)
		historyManager.pushDebounced(`updated line ${idx} via region`)
	}

	if (regionHasEndTime(idx)) {
		if (idx + 1 == s.lyrics.length) {
			// if this is the last lyric, add an ending line?
			s.lyrics.push({ time: toCentiseconds(r.end * 1000), text: "" })
			historyManager.pushDebounced(`added line ${s.lyrics.length} via region end`)
		} else {
			// if the next lyric is blank,
			if (s.lyrics[idx + 1].text == "") {
				// set it to start at the end of this one
				s.lyrics[idx + 1].time = (r.end + 0.01) * 1000
				historyManager.pushDebounced(`updated blank line ${idx + 1} via region`)
			} else {
				// append a blank line at the region's end
				s.lyrics.splice(idx + 1, 0, { time: r.end * 1000, text: "" })
				historyManager.pushDebounced(`added line ${idx + 1} via region end`)
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

	cleanAndSort()
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

function handleGuessButton(e: MouseEvent) {
	bpmMin = 100
	bpmMax = 200
	guessTempo()
}

async function guessTempo(min = bpmMin, max = bpmMax): Promise<{ bpm: number; offset: number } | null> {
	if (!wavesurfer) return null
	console.log("guessing bpm, offset...")
	const mediael = wavesurfer.getMediaElement() as any
	console.log(mediael)
	bpmLoading = true
	const buffer = mediael.buffer
	try {
		const { bpm, offset } = await guess(buffer, { minTempo: min, maxTempo: max })
		const offsetms = offset * 1000
		console.log(`guessed bpm ${bpm} and offset ${offsetms}ms`)
		audioBPM = bpm
		audioBPMOffsetMs = offsetms
		return { bpm, offset: offsetms }
	} catch (err) {
		console.error(err)
		return null
	} finally {
		bpmLoading = false
	}
}
function guessTempoHigher() {
	bpmMin = audioBPM
	guessTempo(bpmMin + 0.1, bpmMax + 20)
}
function guessTempoLower() {
	bpmMax = audioBPM
	guessTempo(bpmMin - 20, bpmMax - 0.5)
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
	<div class="above" onclick={(e) => e.stopPropagation()}>
		<div class="volume" onwheel={onvolumewheel}>
			<input oninput={updateVolume} bind:value={volume} type="range" min="0" max="100" step="1" />
			<span>{volume}</span>% <span>({ampToDB(volume2).toFixed(1)}db)</span>
		</div>
		<div class="bpm-controls">
			<label>
				{#if !isBpmEnabled}
					Enable Beat Ticks
				{/if}
				<input type="checkbox" bind:checked={isBpmEnabled} />
			</label>
			{#if isBpmEnabled}
				<button onclick={handleGuessButton}>{bpmLoading ? "Guessing..." : "Guess"}</button>
				{#if audioBPM}
					<button onclick={guessTempoHigher}>Higher</button>
					<button onclick={guessTempoLower}>Lower</button>
				{/if}
				<label>
					BPM:
					<input type="number" bind:value={audioBPM} min="1" max="300" onblur={updateBpmMarkers} />
				</label>
				<label>
					Offset:
					<input type="number" bind:value={audioBPMOffsetMs} min="0" onblur={updateBpmMarkers} />
				</label>
			{/if}
		</div>
		<div class="nextlyric">
			<i>syncing:</i> {s.lyrics[s.currentCaretLine]?.text ?? ""}
		</div>
	</div>
	<div bind:this={waveformContainer} id="waveform" onwheel={handleScroll}></div>
</div>

<style>
.waveforms-container {
  width: 100%;
  min-height: 450px;
  overflow: hidden;
  will-change: transform, scroll-position;
}

:global {
  #waveform {
    flex: 0 0 140px;
    /* background-color: #000000; */
  }

  #waveform ::part(scroll) {
    scrollbar-width: auto;
  }
  #waveform ::part(region-content) {
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.836);
    overflow-wrap: anywhere;
  }
  #waveform ::part(region) {
    transform: translateZ(0);
  }

  #waveform ::part(region) {
    /* this makes firefox's region opacity Consistent (but not correct) */
    mix-blend-mode: multiply;
  }

  #waveform ::part(region-handle-right) {
    /* border-right: 2px solid rgb(94, 94, 94); */

    border-right: 0px;
  }

  #waveform ::part(handle-right-nextblank) {
    border-right: 2px solid rgb(255, 0, 0);
  }
  #waveform ::part(region-handle-left) {
    border-left: 2px solid rgb(94, 94, 94);
  }
}

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
  gap: 1rem;
  padding: 0.5rem;

  button {
    padding: revert;
  }

  .volume {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .bpm-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .nextlyric {
    position: absolute;
    left: 40%;

    i {
      opacity: 50%;
    }
  }
}
</style>
