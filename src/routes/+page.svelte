<script lang="ts">
import { initDragDrop } from "$lib/dragDrop"
import { loadFiles } from "$lib/loadFiles"
import { formatLine, parseLRC } from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { onMount } from "svelte"
import CollapsibleText from "./components/CollapsibleText.svelte"
import EditView from "./components/EditView.svelte"
import SyncView from "./components/SyncView.svelte"
import Waveform from "./components/Waveform.svelte"

let audioFile = $state<File | null>(null)
let lrcFile = $state<File | null>(null)
let audioSrc = $state("")
let lyricsText = $state("")
let lyrics: LyricLine[] = $derived(parseLRC(lyricsText))

let waveformRef: Waveform
let lineElements: HTMLDivElement[] = $state([])
let textAreaElement: HTMLTextAreaElement
let overlayElement: HTMLDivElement
let audioTime = $state(0)

let activeTab = $state<"edit" | "sync">("sync")

let showFileoverlay = $state(false)

let currentAudioLine = $state(-1)
let shiftHeld = $state(false)

function updateCurrentLine() {
	const time = audioTime

	let newIndex = lyrics.findIndex((line, i) => time >= line.time && (i === lyrics.length - 1 || time < lyrics[i + 1].time))

	if (newIndex !== currentAudioLine) {
		if (currentAudioLine != -1) {
			console.log(`new line: ${newIndex}`)
			if (activeTab == "edit") {
				if (newIndex >= 0 && textAreaElement) {
					const lineHeight = parseFloat(getComputedStyle(textAreaElement).lineHeight) || 20
					const target = Math.max(0, lineHeight * newIndex - textAreaElement.clientHeight / 2)
					textAreaElement.scrollTo({ top: target, behavior: "smooth" })
				}
			} else {
				if (newIndex < 0) newIndex = 0
				if (newIndex > lineElements.length) {
					newIndex = lineElements.length - 1
				}
				lineElements[newIndex]?.scrollIntoView({ block: "center", behavior: "smooth" })
			}
		}
		currentAudioLine = newIndex
	}
}

function adjustSelectedLine(offset: number) {
	if (currentAudioLine < 0 || currentAudioLine >= lyrics.length) {
		console.warn("No valid line selected")
		return
	}

	const lyricsLines = lyricsText.split("\n")

	const targetLine = lyrics[currentAudioLine]
	if (!targetLine) return

	const newTime = Math.max(0, targetLine.time + offset * 1000)

	const minutes = Math.floor(newTime / 60000)
	const seconds = Math.floor((newTime % 60000) / 1000)
	const milliseconds = Math.floor(newTime % 1000)
	const newTimestamp = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${
		milliseconds.toString().padStart(3, "0").substring(0, 2)
	}`

	const lineIndex = currentAudioLine
	if (lineIndex < lyricsLines.length) {
		const lineText = lyricsLines[lineIndex]
		const timestampRegex = /^\[(\d{2}):(\d{2})\.(\d{2})\]/
		const newLine = lineText.replace(timestampRegex, `[${newTimestamp}]`)

		lyricsLines[lineIndex] = newLine
		lyricsText = lyricsLines.join("\n")

		if (waveformRef) {
			waveformRef.seekTo(newTime / 1000)
			waveformRef.play()
			waveformRef.updateRegions()
		}
	}
}

function handleAdjustClick(offset: number, event: MouseEvent) {
	const adjustment = event.shiftKey ? offset * 5 : offset
	adjustSelectedLine(adjustment)
}

function togglePlayPause() {
	if (waveformRef) {
		waveformRef.togglePlayPause()
	}
}

function handleKeydown(event: KeyboardEvent) {
	if (event.key === "Shift") {
		shiftHeld = true
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
		shiftHeld = false
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

	const { audioSrc: src, lyricstext: l } = await loadFiles(audioFile, lrcFile)
	audioSrc = src

	lyricsText = l
}

onMount(() => {
	const cleanup = initDragDrop(
		(files) => {
			Array.from(files).forEach((file) => {
				if (file.name.endsWith(".lrc") || file.name.endsWith(".txt")) {
					lrcFile = file
				} else {
					audioFile = file
				}
			})
		},
		(show) => (showFileoverlay = show),
		doLoad,
	)

	document.addEventListener("keydown", handleKeydown)
	document.addEventListener("keyup", handleKeyup)

	requestAnimationFrame(update)

	return () => {
		cleanup
		document.removeEventListener("keydown", handleKeydown)
		document.removeEventListener("keyup", handleKeyup)
	}
})
</script>

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />

<div class="container">
	{#if showFileoverlay}
		<div class="drag-overlay">Drop files anywhere</div>
	{/if}

	<div class="controls">
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
			<Waveform bind:this={waveformRef} file={audioFile as File} {lyrics} onTimeUpdate={(time) => (audioTime = time)} />
		</div>
	{/if}

	<div class="info">
		<p>audio line: {currentAudioLine}</p>
		<p>caret line: {currentAudioLine}</p>
		<p>current time: {(audioTime / 1000).toFixed(2)}</p>
		<p>
			{String(Math.floor(audioTime / 1000 / 60)).padStart(2, "0")}:{String(Math.floor((audioTime / 1000) % 60)).padStart(2, "0")}.{
				String(Math.floor(audioTime % 1000)).padStart(3, "0")
			}
		</p>
	</div>

	<CollapsibleText>
		<p>asdjasd: {JSON.stringify(lineElements)}</p>
		<p>lyric data: {JSON.stringify(lyrics, null, 2)}</p>
	</CollapsibleText>
	<p>current lyric: {lyrics[currentAudioLine]?.text ?? ""}</p>

	<div class="controls">
		<button onclick={togglePlayPause} disabled={!audioFile}>
			Play/Pause (Space)
		</button>
		<button
			onclick={(e) => handleAdjustClick(-0.01, e)}
			disabled={currentAudioLine < 0}
			title={shiftHeld ? "Move selected line earlier by 0.05s" : "Move selected line earlier by 0.01s (Shift for 0.05s)"}
		>
			{shiftHeld ? "-0.05s" : "-0.01s"}
		</button>
		<button
			onclick={(e) => handleAdjustClick(+0.01, e)}
			disabled={currentAudioLine < 0}
			title={shiftHeld ? "Move selected line later by 0.05s" : "Move selected line later by 0.01s (Shift for 0.05s)"}
		>
			{shiftHeld ? "+0.05s" : "+0.01s"}
		</button>
	</div>

	<div class="tabs">
		<button onclick={() => (activeTab = "sync")} class:active={activeTab === "sync"}>Sync</button>
		<button onclick={() => (activeTab = "edit")} class:active={activeTab === "edit"}>Edit</button>
	</div>

	{#if activeTab === "sync"}
		<SyncView {lyrics} {waveformRef} bind:lineElements bind:currentAudioLine />
	{:else}
		<EditView bind:lyricsText bind:currentCaretLine={currentAudioLine} bind:textAreaElement />
	{/if}
</div>

<style>
:global(body) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  margin: 0;
  background: #211b22;
  color: #ffffff;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: 100vh;
}
.controls {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}
button {
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #e6e9ef;
  background: white;
  cursor: pointer;
  font-weight: 600;
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

.info {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>
