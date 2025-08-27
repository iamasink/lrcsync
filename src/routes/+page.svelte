<script lang="ts">
import CollapsibleText from "$lib/components/CollapsibleText.svelte"
import EditView from "$lib/components/TabEdit.svelte"
import SyncView from "$lib/components/TabSync.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import { initDragDrop } from "$lib/dragDrop"
import { loadFiles } from "$lib/loadFiles"
import { allHaveTimestamps, exportLRC, formatLine, formatTime, parseLRC, sortLines } from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { onMount, setContext } from "svelte"

import TabMetadata from "$lib/components/TabMetadata.svelte"
import { s } from "$lib/state.svelte"
let isPlaying = s.waveformRef?.isPlaying() ?? false

let audioFile = $state<File | null>(null)
let lrcFile = $state<File | null>(null)
let audioSrc = $state("")
let lyricsText = $derived(exportLRC(s.lyrics))

let textAreaElement: HTMLTextAreaElement
let overlayElement: HTMLDivElement

let showFileoverlay = $state(false)

function updateCurrentLine() {
	const time = s.audioTime

	let newIndex = s.lyrics.findIndex((line, i) => time >= line.time && (i === s.lyrics.length - 1 || time < s.lyrics[i + 1].time))

	if (newIndex !== s.currentAudioLine) {
		if (newIndex != -1) {
			console.log(`new line: ${newIndex}`)
			if (s.activeTab == "edit") {
				s.lineElements2[newIndex]?.scrollIntoView({ block: "center", behavior: "smooth" })
			} else {
				if (newIndex < 0) newIndex = 0
				if (newIndex > s.lineElements.length) {
					newIndex = s.lineElements.length - 1
				}
				if (s.syncCaretWithAudio) {
					s.lineElements[newIndex]?.scrollIntoView({ block: "center", behavior: "smooth" })
				}
			}
		}
		s.currentAudioLine = newIndex

		// Sync caret line with audio line if enabled
		if (s.syncCaretWithAudio) {
			s.currentCaretLine = newIndex
		}
	}
}

function adjustSelectedLine(offset: number) {
	if (s.currentCaretLine < 0 || s.currentCaretLine >= s.lyrics.length) {
		console.warn("No valid line selected")
		return
	}

	const lyricsLines = s.lyrics

	const targetLine = s.lyrics[s.currentCaretLine]
	if (!targetLine) return

	const newTime = Math.max(0, targetLine.time + offset * 1000)

	const lineIndex = s.currentCaretLine
	if (lineIndex < lyricsLines.length) {
		targetLine.time = newTime

		if (s.waveformRef) {
			s.waveformRef.seekToTime(newTime / 1000)
			s.waveformRef.play()
		}
	}
}

function handleAdjustClick(offset: number, event: MouseEvent) {
	const adjustment = event.shiftKey ? offset * 5 : offset
	adjustSelectedLine(adjustment)
}

function togglePlayPause() {
	if (s.waveformRef) {
		s.waveformRef.togglePlayPause()
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Shift") {
		s.isShiftHeld = true
	}

	if (event.code === "Space") {
		const target = event.target as HTMLElement

		// skip if in input etc
		if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
			return
		}

		event.preventDefault()

		togglePlayPause()
	}
}

function handleKeyup(event: KeyboardEvent) {
	if (event.key === "Shift") {
		s.isShiftHeld = false
	}
}

function update() {
	updateCurrentLine()
	requestAnimationFrame(update)
}

async function doLoad() {
	if (!audioFile || !lrcFile) {
		console.error("couldn't load! files are null")
		return
	}

	const { audioSrc: src, lyrics: l, meta } = await loadFiles(audioFile, lrcFile)

	audioSrc = src

	s.lyrics = l
	s.metadata = meta
}

onMount(() => {
	const cleanup = initDragDrop(
		// files
		(files) => {
			Array.from(files).forEach((file) => {
				if (file.name.endsWith(".lrc") || file.name.endsWith(".txt")) {
					lrcFile = file
				} else {
					audioFile = file
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

	requestAnimationFrame(update)

	return () => {
		cleanup
		window.removeEventListener("keydown", handleKeydown)
		window.removeEventListener("keyup", handleKeyup)
	}
})
</script>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />

<div class="container">
	{#if showFileoverlay}
		<div class="drag-overlay">Drop files anywhere</div>
	{/if}

	<div class="topcontrols">
		<p>Audio</p>
		{#if !audioFile}
			<input
				id="fileinputaudio"
				type="file"
				accept="audio/*"
				onchange={(e: Event) => {
					const t = e.target as HTMLInputElement
					if (t?.files?.[0]) audioFile = t.files[0]
				}}
			/>
		{/if}
		{#if !lrcFile}
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
		{/if}
		<button onclick={doLoad}>Load</button>
	</div>

	{#if audioFile}
		<div class="waveform">
			<Waveform bind:this={s.waveformRef} file={audioFile as File} />
		</div>
	{/if}

	<div class="info">
		<p>audio line: {s.currentAudioLine}</p>
		<p>caret line: {s.currentAudioLine}</p>
		<p>current time: {(s.audioTime / 1000).toFixed(2)}</p>
		<p>{formatTime(s.audioTime)}</p>
	</div>

	<CollapsibleText>
		<p>asdjasd: {JSON.stringify(s.lineElements)}</p>
		<p>lyric data: {JSON.stringify(s.lyrics, null, 2)}</p>
	</CollapsibleText>
	<p style="height: 2rem">current lyric: {s.lyrics[s.currentAudioLine]?.text ?? ""}</p>

	<div class="controls">
		<div class="controls-1">
			<button onclick={togglePlayPause} disabled={!audioFile}>
				{s.isAudioPlaying ? "Pause" : "Play"} (Space)
			</button>
			<button
				onclick={(e) => handleAdjustClick(-0.01, e)}
				disabled={s.currentCaretLine < 0}
				title={s.isShiftHeld ? "Move selected line earlier by 0.05s" : "Move selected line earlier by 0.01s (Shift for 0.05s)"}
			>
				{s.isShiftHeld ? "-0.05s" : "-0.01s"}
			</button>
			<button
				onclick={(e) => handleAdjustClick(+0.01, e)}
				disabled={s.currentCaretLine < 0}
				title={s.isShiftHeld ? "Move selected line later by 0.05s" : "Move selected line later by 0.01s (Shift for 0.05s)"}
			>
				{s.isShiftHeld ? "+0.05s" : "+0.01s"}
			</button>
		</div>
		<div class="controls-2">
			<button
				onclick={() => {
					s.lyrics = sortLines(s.lyrics)
				}}
				disabled={!allHaveTimestamps(s.lyrics)}
				title="sort lines by timestamp (all lines must have a timestamp)"
			>
				Sort
			</button>
			<label><input type="checkbox" bind:checked={s.syncCaretWithAudio} />lock caret</label>
		</div>
	</div>

	<div class="tabs">
		<button onclick={() => (s.activeTab = "sync")} class:active={s.activeTab === "sync"}>Sync</button>
		<button onclick={() => (s.activeTab = "edit")} class:active={s.activeTab === "edit"}>Edit</button>
		<button onclick={() => (s.activeTab = "metadata")} class:active={s.activeTab === "metadata"}>Metadata</button>
	</div>

	<div class="tabcontent">
		{#if s.activeTab === "sync"}
			<SyncView />
		{:else if s.activeTab === "edit"}
			<EditView />
		{:else if s.activeTab === "metadata"}
			<TabMetadata />
		{:else}
			<p>erm</p>
		{/if}
	</div>
</div>

<style>
:global {
  body {
    font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    margin: 0;
    background: #211b22;
    color: #ffffff;
    width: 100vw;
    overflow-x: hidden;
  }
  button {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    border: 1px solid #e6e9ef;
    background: white;
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

.container {
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100vh;
  overflow: hidden;
}
.topcontrols {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tabs button.active {
  background: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.tabcontent {
  flex: 1;
  border: 2px solid aqua;
  min-height: 0; /*allow it to shrink??*/
}

.info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>
