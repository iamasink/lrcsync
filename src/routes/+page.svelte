<script lang="ts">
import CollapsibleText from "$lib/components/CollapsibleText.svelte"
import EditView from "$lib/components/TabEdit.svelte"
import SyncView from "$lib/components/TabSync.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import { initDragDrop } from "$lib/dragDrop"
import { loadAudio, loadLRC } from "$lib/loadFiles"
import {
	allHaveTimestamps,
	cleanup,
	exportLRC,
	formatLine,
	formatTime,
	getOffsetToNextLyric,
	getOffsetToNextLyricAudio,
	parseLRC,
	sortLines,
} from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { onMount, setContext } from "svelte"

import Button from "$lib/components/Button.svelte"
import History from "$lib/components/History.svelte"
import KeybindButton from "$lib/components/KeybindButton.svelte"
import TabMetadata from "$lib/components/TabMetadata.svelte"
import { historyManager } from "$lib/history.svelte"
import { scrollLineIntoView } from "$lib/scroll"
import { s } from "$lib/state.svelte"
let isPlaying = s.waveformRef?.isPlaying() ?? false

let audioFile = $state<File | null>(null)
let lrcFile = $state<File | null>(null)
let audioSrc = $state("")
let lyricsText = $derived(exportLRC(s.lyrics))

let textAreaElement: HTMLTextAreaElement
let overlayElement: HTMLDivElement

let fps = $state(0)
let lastFrameTime = performance.now()
let frameCount = 0

let showFileoverlay = $state(false)
let showTopControls = $state(true)

function getCurrentLine(time = s.audioTime) {
	if (!s.lyrics || time < 0) {
		return -1
	}

	// round to prevent weird things idk
	const newtime = Math.round(time * 1) / 1

	// backwards
	for (let i = s.lyrics.length - 1; i >= 0; i--) {
		const line = s.lyrics[i]

		if (line.time < 0) continue

		// find last lines's time that's less than current time
		if (newtime >= line.time) {
			return i
		}
	}

	return -1
}

let lasttime = -1
function updateCurrentLine() {
	const time = s.audioTime
	if (time == lasttime) return
	lasttime = time

	let newIndex = getCurrentLine()

	if (newIndex !== s.currentAudioLine) {
		// console.log("s.currentCaretLine", s.currentCaretLine)
		// console.log("s.currentAudioLine", s.currentAudioLine)

		if (newIndex == -1) return
		if (s.lyrics[newIndex].time == -1) return
		console.log(`new line: ${newIndex} from ${s.currentAudioLine}`)

		if (s.currentCaretLine === s.currentAudioLine) {
			s.currentCaretLine = newIndex
			scrollLineIntoView(newIndex)
		} else if (s.syncCaretWithAudio) {
			s.currentCaretLine = newIndex
			scrollLineIntoView(newIndex)
		}

		s.currentAudioLine = newIndex
	}
}

function adjustSelectedLine(offset: number) {
	if (s.currentAudioLine < 0 || s.currentAudioLine >= s.lyrics.length) {
		console.warn("No valid line selected")
		return
	}

	const lyricsLines = s.lyrics

	const targetLine = s.lyrics[s.currentAudioLine]
	if (!targetLine) return
	if (targetLine.time == -1) return

	const newTime = Math.max(0, targetLine.time + offset * 1000)

	const lineIndex = s.currentAudioLine
	if (lineIndex < lyricsLines.length) {
		targetLine.time = newTime

		if (s.waveformRef) {
			s.waveformRef.updateRegions()
			s.waveformRef.seekToTime(newTime / 1000)
			s.waveformRef.play()
		}
	}
}

// let adjustTimeout: number = 0
// let total = 0
// function handleAdjustClick(offset: number, event: MouseEvent) {
// 	const adjustment = offset
// 	total += Math.round(offset * 100)
// 	adjustSelectedLine(adjustment)

// 	if (adjustTimeout) clearTimeout(adjustTimeout)
// 	adjustTimeout = window.setTimeout(() => {
// 		requestAnimationFrame(() => {
// 			historyManager.push(`adjusted line ${s.currentAudioLine} by ${total / 100}`)
// 			total = 0
// 		})
// 	}, 500)
// }

function handleAdjustClick(offset: number, event: MouseEvent) {
	const adjustment = offset
	// total += Math.round(offset * 100)
	adjustSelectedLine(adjustment)

	historyManager.pushDebounced(`adjusted line ${s.currentAudioLine}`, { offset })
}

function togglePlayPause() {
	if (s.waveformRef) {
		s.waveformRef.togglePlayPause()
	}
}

function handleKeydown(event: KeyboardEvent) {
	const state = true
	switch (event.key) {
		case "Shift": {
			s.modkeysHeld.shift = state
			break
		}
		case "Alt": {
			s.modkeysHeld.alt = state
			break
		}
		case "Control": {
			s.modkeysHeld.ctrl = state
			break
		}
	}
}

function handleKeyup(event: KeyboardEvent) {
	const state = false
	switch (event.key) {
		case "Shift": {
			s.modkeysHeld.shift = state
			break
		}
		case "Alt": {
			s.modkeysHeld.alt = state
			break
		}
		case "Control": {
			s.modkeysHeld.ctrl = state
			break
		}
	}
}

function update(now?: number) {
	updateCurrentLine()
	requestAnimationFrame(update)
}
function countfps(now: number) {
	frameCount++
	if (now - lastFrameTime >= 1000) {
		fps = frameCount
		frameCount = 0
		lastFrameTime = now
	}
	requestAnimationFrame(countfps)
}

async function doLoad() {
	// if (!audioFile) {
	// 	console.error("couldn't load! no audio file!")
	// 	return
	// }
	if (audioFile) {
		console.log("loading audio")
		const { audioSrc: src } = await loadAudio(audioFile)
		audioSrc = src
		if (!s.waveformRef) return
		s.waveformRef.loadFile(audioFile)
	}
	if (lrcFile) {
		console.log("loading lrc")
		const { lyrics: l, meta } = await loadLRC(lrcFile)
		s.lyrics = l
		s.metadata = meta

		// reset history
		historyManager.clear()
		historyManager.push(`Loaded ${$state.snapshot(s.filePaths.audio)}`)
	}
	showTopControls = false
	lrcFile = null
	audioFile = null
}

onMount(() => {
	// @ts-ignore
	s.isTauri = !!(window.__TAURI_INTERNALS__)

	console.log("hi world")
	const cleanupfns = initDragDrop(
		// files
		(files) => {
			Array.from(files).forEach((file) => {
				console.log("processing file", file.name)
				if (file.name.endsWith(".lrc") || file.name.endsWith(".txt")) {
					lrcFile = file
					s.filePaths.lyrics = file.name
				} else {
					audioFile = file
					s.filePaths.audio = file.name
				}
			})
		},
		// show
		(show) => (showFileoverlay = show),
		// onAfterDrop
		doLoad,
	)

	window.addEventListener("keydown", handleKeydown)
	window.addEventListener("keyup", handleKeyup)
	window.addEventListener("blur", () => {
		s.modkeysHeld.shift = false
		s.modkeysHeld.ctrl = false
		s.modkeysHeld.alt = false
	})

	requestAnimationFrame(update)
	requestAnimationFrame(countfps)

	return () => {
		cleanupfns
		window.removeEventListener("keydown", handleKeydown)
		window.removeEventListener("keyup", handleKeyup)
	}
})

let multiplier = $derived(1 * (s.modkeysHeld.shift ? 5 : 1) * (s.modkeysHeld.ctrl ? 10 : 1))
let stepbuttonvalue = $derived(0.01 * multiplier)
let fastforwardbuttonvalue = $derived(1 * multiplier)

let currentText = $derived(s.lyrics[s.currentAudioLine]?.text ?? "")
let currentTextConverted = $derived(s.convertedLyrics[s.currentAudioLine] ?? "")
let flash = $state(false)
let breaktime = $derived(currentText == "")
$effect(() => {
	// update whenever audioline changes too!
	s.lyrics[s.currentAudioLine]
	if (currentText) {
		flash = true
		const t = setTimeout(() => {
			flash = false
		}, 200)
	}
})

$effect(() => {
	if (!audioFile) return

	// Reset playback state
	s.currentAudioLine = 0
	s.currentCaretLine = 0
	s.audioTime = 0

	// Stop old waveform
	s.waveformRef?.pause()
})

function handleNextButtonClick() {
	// try to move forward until a valid line is found
	let i = s.currentAudioLine + 1
	while (i < s.lyrics.length && (s.lyrics[i].time == null || s.lyrics[i].time == -1)) {
		i++
	}

	if (i < s.lyrics.length) {
		const time = s.lyrics[i].time
		s.waveformRef?.seekToTime(time / 1000)
		scrollLineIntoView(i)
		s.waveformRef?.updateSelectedRegions()
		s.currentAudioLine = i
	}
}

function handlePrevButtonClick() {
	// try to move backward until a valid line is found
	let i = s.currentAudioLine - 1
	while (i >= 0 && (s.lyrics[i].time == null || s.lyrics[i].time == -1)) {
		i--
	}

	if (i >= 0) {
		const time = s.lyrics[i].time + 0.01
		s.waveformRef?.seekToTime(time / 1000)
		scrollLineIntoView(i)
		s.waveformRef?.updateSelectedRegions()
		s.currentAudioLine = i
	}
}

function getBreakTimeRemaining() {
	const max = 30
	const offset = getOffsetToNextLyricAudio()

	const lyric = s.lyrics[s.currentAudioLine + offset]
	let time: number
	if (lyric) {
		time = lyric.time
	} else {
		time = 1
	}

	const result = 1 + Math.floor(time / 1000 - s.audioTime / 1000)

	return Math.min(max, result)
}
</script>

<svelte:head>
	<title>{s.filePaths.audio ? `${s.filePaths.audio} | LRCSync` : "LRCSync"}</title>
</svelte:head>

<div class="app">
	<div class="container">
		{#if showFileoverlay}
			<div class="drag-overlay">Drop files anywhere</div>
		{/if}

		{#if showTopControls}
			<div class="topcontrols">
				<p>Audio</p>
				<!-- {#if !audioFile} -->
				<input
					id="fileinputaudio"
					type="file"
					accept="audio/*"
					onchange={(e: Event) => {
						const t = e.target as HTMLInputElement
						if (t?.files?.[0]) audioFile = t.files[0]
					}}
				/>
				<!-- {/if} -->
				<!-- {#if !lrcFile} -->
				<p>.lrc</p>
				<input
					id="fileinputlyric"
					type="file"
					accept=".lrc,.txt"
					onchange={(e: Event) => {
						const t = e.target as HTMLInputElement
						if (t?.files?.[0]) lrcFile = t.files[0]
					}}
				/>
				<!-- {/if} -->
				<button onclick={doLoad}>Load</button>
				<Button
					title="hide this"
					onclick={() => {
						showTopControls = false
					}}
				>
					x
				</Button>
			</div>
		{/if}

		<!-- {#if audioFile} -->
		<div class="waveform">
			<Waveform bind:this={s.waveformRef} />
		</div>
		<!-- {/if} -->

		<div class="info">
			<p>audio line: {s.currentAudioLine}</p>
			<p>caret line: {s.currentAudioLine}</p>
			<p>{(s.audioTime / 1000).toFixed(2)}s</p>
			<p>{formatTime(s.audioTime)}</p>
			<p>FPS: {fps}</p>
		</div>

		<div class="belowwaveform">
			<div class="left">
				<CollapsibleText>
					<p>asdjasd: {JSON.stringify(s.lineElements)}</p>
					<p>lyric data: {JSON.stringify(s.lyrics, null, 2)}</p>
				</CollapsibleText>
				<div class="currentlyric">
					<div class="left">
						<span>
							current lyric:
						</span>
					</div>
					<div class="lyrictext">
						{#if !breaktime}
							<span class:flash={flash}>{currentText}</span>
							{#if currentText.trim().toLowerCase() != currentTextConverted.trim().toLowerCase()}
								<span class="converted" class:flash={flash}>{currentTextConverted}</span>
							{/if}
						{:else}
							<span class:break={breaktime} class:animate={s.isAudioPlaying}>
								<!-- TODO: make a function and skip empty lines, also fix weird symbols like ’ -->
								{#each { length: getBreakTimeRemaining() }, index}
									{#if index > 6 && Math.random() < (1 / 20)}
										<span class="emoji" style="--i: {index+1}">🎷🐈</span>
									{:else}
										{#if index % 2}
											<span class="emoji" style="--i: {index+1}">🎵</span>
										{:else}
											<span class="emoji" style="--i: {index+1}">🎶</span>
										{/if}
									{/if}
								{/each}
							</span>
						{/if}
					</div>
				</div>

				<div class="controls">
					<div>
						<KeybindButton onclick={togglePlayPause} shortcut={{ key: "Space" }}>
							{s.isAudioPlaying ? "Pause" : "Play"}
						</KeybindButton>
						<KeybindButton
							onclick={() => {
								if (s.lyrics[s.currentCaretLine].time != -1) s.waveformRef?.seekToTime(s.lyrics[s.currentCaretLine].time / 1000)
							}}
							shortcut={{ key: "w" }}
							title="Move the audio to the caret"
						>
							Play @ caret
						</KeybindButton>
						<KeybindButton
							onclick={() => s.waveformRef?.seekToTime(s.lyrics[s.currentAudioLine].time / 1000)}
							shortcut={{ key: "r" }}
							title="Move the audio to the start of current line"
						>
							Replay line
						</KeybindButton>
						<KeybindButton
							onclick={() => s.waveformRef?.seekToTime((s.audioTime / 1000) - fastforwardbuttonvalue)}
							title={`Go back ${fastforwardbuttonvalue}s`}
							shortcut={{ key: "left" }}
							ignoremods={true}
						>
							-{fastforwardbuttonvalue}s
						</KeybindButton>

						<KeybindButton
							onclick={() => s.waveformRef?.seekToTime((s.audioTime / 1000) + fastforwardbuttonvalue)}
							title={`Fastforward ${fastforwardbuttonvalue}s`}
							shortcut={{ key: "right" }}
							ignoremods={true}
						>
							+{fastforwardbuttonvalue}s
						</KeybindButton>

						<KeybindButton title={"Move the audio to the start of next line"} onclick={handleNextButtonClick} shortcut={{ key: "down" }}
						>next line</KeybindButton>
						<KeybindButton title={"Move the audio to the start of previous line"} onclick={handlePrevButtonClick} shortcut={{ key: "up" }}
						>prev line</KeybindButton>
					</div>
					<div>
						<KeybindButton
							onclick={(e) => handleAdjustClick(-stepbuttonvalue, e)}
							disabled={s.currentCaretLine < 0}
							title={`Move currently playing line earlier by -${stepbuttonvalue}s`}
							shortcut={{ key: "x" }}
							ignoremods={true}
						>
							-{stepbuttonvalue}s
						</KeybindButton>

						<KeybindButton
							onclick={(e) => handleAdjustClick(stepbuttonvalue, e)}
							disabled={s.currentCaretLine < 0}
							title={`Move currently playing line later by +${stepbuttonvalue}s`}
							shortcut={{ key: "c" }}
							ignoremods={true}
						>
							+{stepbuttonvalue}s
						</KeybindButton>

						<!--  -->

						<KeybindButton onclick={(e) => historyManager.undo()} title="Undo" shortcut={{ key: "z", ctrl: true }}>
							Undo
						</KeybindButton>
						<KeybindButton onclick={(e) => historyManager.redo()} title="Redo" shortcut={{ key: "z", ctrl: true, shift: true }}>
							Redo
						</KeybindButton>
					</div>
					<div>
						<button
							onclick={() => {
								s.lyrics = sortLines(s.lyrics)
							}}
							title="sort lines by timestamp"
						>
							Sort
						</button>
						<button
							onclick={() => {
								s.lyrics = cleanup(s.lyrics)
								historyManager.push("cleanup")
							}}
							title="cleanup"
						>
							Cleanup
						</button>
						<label><input type="checkbox" bind:checked={s.syncCaretWithAudio} />lock caret</label>
					</div>
				</div>
			</div>
			<div class="history">
				<History></History>
			</div>
		</div>

		<div class="tabarea">
			<div class="tabs">
				<!-- <button onclick={() => (s.activeTab = "sync")} class:active={s.activeTab === "sync"}>Sync</button> -->
				<button onclick={() => (s.activeTab = "edit")} class:active={s.activeTab === "edit"}>Edit</button>
				<button onclick={() => (s.activeTab = "metadata")} class:active={s.activeTab === "metadata"}>Metadata</button>
			</div>

			<div class="tabcontent">
				<!--
					{#if s.activeTab === "sync"}
					<SyncView />
				-->
				{#if s.activeTab === "edit"}
					<EditView />
				{:else if s.activeTab === "metadata"}
					<TabMetadata />
				{:else}
					<p>erm</p>
				{/if}
			</div>
		</div>
	</div>
	<div>
		<hr />
		<hr />
		<hr />
		<Button
			onclick={() => {
				scrollTo({ top: 0 })
				showTopControls = !showTopControls
			}}
		>{showTopControls ? "hide" : "show"} load menu (at top)</Button>
		<br />
		<hr />
		<div class="footer">
			<p>lrcsync - made with <span class="kity"><span>🎷</span><span>🐈</span></span> by <a href="https://iamas.ink">sink</a>.</p>
			<p><a href="https://github.com/iamasink/lrcsync">source</a></p>
			<p><a href="https://iamas.ink/support">support me ❣️</a></p>
		</div>
	</div>
</div>

<style>
:global {
  body {
    font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    margin: 0;
    background: var(--bg);
    color: var(--text);
    width: 100vw;
    overflow-x: hidden;
  }
  button {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--text);
    cursor: pointer;
    font-weight: 600;
  }
  label {
    cursor: pointer;
  }
  label:hover {
    border: 1px dashed red;
  }
}

.footer {
  color: rgba(255, 255, 255, 0.486);
  span {
    display: inline-block;

    :nth-child(1) {
      transform: translateY(0.2rem) rotate(5deg);
    }
    :nth-child(2) {
      transform: translateX(-0.3rem);
    }
  }

  a {
    color: rgba(100, 61, 172, 0.534);
  }

  padding-top: 1rem;
  padding-bottom: 1rem;
  padding-left: 10rem;
}

.container {
  max-width: 2000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  height: 100svh;
  overflow: hidden;

  @media only screen and (max-width: 600px) {
    gap: 0px;
  }
}
.topcontrols {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid var(--border-muted);
}
.controls {
  /* gap: 0.5rem; */

  /* div {} */
}

.belowwaveform {
  display: flex;
  gap: 2rem;
  > * {
    flex: 1;
  }

  .history {
    margin: 1rem;
    border: var(--border-muted) solid 1px;
  }
}

button:hover:not(:disabled) {
  filter: brightness(0.98);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
input[type="file"] {
  font-size: 0.9rem;
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  pointer-events: all;
}

.tabarea {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0; /*allow it to shrink??*/
}
.tabs {
  display: flex;
  gap: 0.5rem;

  button {
    flex: 1;
    background: transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;

    &.active {
      background: #4a90e2;
      color: white;
      border-color: var(--bg);
    }
  }
}

.tabcontent {
  background-color: var(--bg-dark);
  border: 2px solid aqua;
  min-height: 0; /*allow it to shrink??*/
  padding: 0.5rem;
  box-sizing: border-box;
  flex: 1;
}

.info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  opacity: 0.8;
  p {
    width: 6rem;
  }
}

.flash {
  animation: flash-bg 0.5s;
}

@keyframes flash-bg {
  0% {
    background-color: rgb(76, 76, 206);
  }
  100% {
    background-color: transparent;
  }
}

.break {
  background-color: #ffffff;
}
.break.animate {
  .emoji {
    display: inline-block;
    /* margin: 0 0rem; */
    animation: bounce 0.6s infinite alternate ease-in-out;
    transition: opacity 0.3s ease;
    animation-delay: calc(-0.2s * var(--i));
  }

  /* .emoji:nth-child(2) {
    animation-delay: -0.2s;
  }
  .emoji:nth-child(3) {
    animation-delay: -0.4s;
  }
    .emoji:nth-child(4) {
    animation-delay: -0.6s;
  } */
}
@keyframes bounce {
  from {
    transform: translateY(5px);
  }
  to {
    transform: translateY(-7px);
  }
}

.currentlyric {
  max-height: 4rem;
  height: 4rem;
  font-size: large;
  display: flex;

  .left {
    color: var(--text-muted);
    align-self: center;
    /* move slightly up */
    transform: translateY(-0.5rem);
  }

  .lyrictext {
    margin-left: 1rem;
    font-size: x-large;
    display: flex;
    flex-direction: column;
  }
}
</style>
