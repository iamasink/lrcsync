<script lang="ts">
import CollapsibleText from "$lib/components/CollapsibleText.svelte"
import EditView from "$lib/components/TabEdit.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import { type FileWithHandle, initDragDrop } from "$lib/dragDrop"
import { loadAudio, loadLRC } from "$lib/loadFiles"
import {
	allHaveTimestamps,
	cleanup,
	exportLRC,
	formatLine,
	formatTime,
	getOffsetToNext,
	getOffsetToNextLyric,
	getOffsetToNextTimed,
	parseLRC,
	sortLines,
} from "$lib/parseLRC"
import { onMount, setContext } from "svelte"

import Button from "$lib/components/Button.svelte"
import DialogNewAudio from "$lib/components/DialogNewAudio.svelte"
import Footer from "$lib/components/Footer.svelte"
import History from "$lib/components/History.svelte"
import TabMetadata from "$lib/components/TabMetadata.svelte"
import { addRuby } from "$lib/furigana"
import { historyManager } from "$lib/history.svelte"
import { scrollLineIntoView } from "$lib/scroll"
import { s } from "$lib/state.svelte"
import CurrentLyrics from "./_components/CurrentLyrics.svelte"
import DragOverlay from "./_components/DragOverlay.svelte"
import TopControls from "./_components/TopControls.svelte"
import ButtonControls from "./_components/ButtonControls.svelte"
import { getBeatAtTime } from "$lib/bpm"
import Tooltip from "$lib/components/Tooltip.svelte"
import BPMMenu from "./_components/BPMMenu.svelte"
import { findCompanionFile, getBaseName } from "$lib/fileSystem"

let updateRafId: number
let fpsRafId: number

let audioFile = $state<FileWithHandle | null>(null)
let lrcFile = $state<FileWithHandle | null>(null)
let audioSrc = $state("")

let isDialogNewAudioOpen: boolean = $state(false)

let fps = $state(0)
let lastFrameTime = performance.now()
let frameCount = 0

let showFileoverlay = $state(false)
let showTopControls = $state(true)
let showBPMMenu = $state(false)

const BAD_EXTENSIONS = new Set([
	// images
	".jpg",
	".jpeg",
	".png",
	".gif",
	".bmp",
	".webp",
	".svg",
	".ico",
	".tiff",
	".psd",
	".heic",
	// info stuff
	".cue",
	".m3u",
	".m3u8",
	".nfo",
	".sfv",
	// archive
	".zip",
	".rar",
	".7z",
	".tar",
	".gz",
	// hidden
	".DS_Store",
	".thumbs.db",
])

const LYRIC_EXTENSIONS = new Set([".lrc", ".txt"])

const AUDIO_EXTENSIONS = new Set([".mp3", ".flac", ".opus"])

/**
 * Gets the current lyric line based on the time.
 * @param time time in ms
 * @returns The index of the line at the specified time.
 * @returns `null` if no lyrics/audio
 * @returns `-1` if playback is before the first lyric line.
 */
function getCurrentLine(time = s.audioTimeMs): number | null | -1 {
	if (!s.lyrics || time < 0) {
		return null
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
	const time = s.audioTimeMs
	if (time == lasttime) return
	lasttime = time

	let newIndex = getCurrentLine()
	if (newIndex == null) return

	if (newIndex !== s.currentAudioLine) {
		// if (newIndex == -1) return
		if (s.lyrics[newIndex]?.time == -1) return

		if (
			(s.currentCaretLine === s.currentAudioLine)
			// only if increasing because of reasons to do with history and syncing and its a mess
			// im sorry <3
			&& (newIndex >= s.currentCaretLine)
		) {
			s.currentCaretLine = newIndex
			scrollLineIntoView(newIndex)
		}

		if (s.syncCaretWithAudio) {
			s.currentCaretLine = newIndex
			scrollLineIntoView(newIndex)
		}

		s.currentAudioLine = newIndex
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

function update(now: number) {
	updateCurrentLine()
	updateRafId = requestAnimationFrame(update)
}
function countfps(now: number) {
	frameCount++
	if (now - lastFrameTime >= 1000) {
		fps = frameCount
		frameCount = 0
		lastFrameTime = now
	}
	fpsRafId = requestAnimationFrame(countfps)
}

async function doLoad() {
	// if (lrcFile) {
	// 	s.filePaths.lyrics = lrcFile.name
	// 	if (lrcFile.handle) {
	// 		s.fileHandles.lyrics = lrcFile.handle
	// 	} else {
	// 		s.fileHandles.lyrics = undefined
	// 	}
	// }
	// if (audioFile) {
	// 	s.filePaths.audio = audioFile.name
	// 	if (audioFile.handle) {
	// 		s.fileHandles.audio = audioFile.handle
	// 	} else {
	// 		s.fileHandles.audio = undefined
	// 	}
	// }

	// discover companion files before loading
	if (audioFile?.handle && !lrcFile) {
		const companion = await findCompanionFile(audioFile.handle, LYRIC_EXTENSIONS)
		if (companion) {
			const file: FileWithHandle = await companion.getFile()
			file.handle = companion
			lrcFile = file
			alert(`found a companion lrc file (${lrcFile.name}), so that was also loaded!`)
		}
	} else if (lrcFile?.handle && !audioFile) {
		const companion = await findCompanionFile(lrcFile.handle, AUDIO_EXTENSIONS)
		if (companion) {
			const file: FileWithHandle = await companion.getFile()
			file.handle = companion
			audioFile = file
			alert(`found a companion audio file (${audioFile.name}), so that was also loaded!`)
		}
	}

	// update file metadata after companion discovery
	s.filePaths.lyrics = lrcFile?.name
	s.fileHandles.lyrics = lrcFile?.handle

	s.filePaths.audio = audioFile?.name
	s.fileHandles.audio = audioFile?.handle

	const loadedLyrics = !!lrcFile
	const loadedAudio = !!audioFile

	if (lrcFile) {
		console.log("loading lrc")
		const { lyrics: l, meta } = await loadLRC(lrcFile)
		s.lyrics = l
		s.metadata = meta

		// reset history
		historyManager.clear()
		historyManager.push(`Loaded LRC file: ${$state.snapshot(s.filePaths.audio)}`)
	}
	if (audioFile) {
		console.log("loading audio")
		const { audioSrc: src } = await loadAudio(audioFile)
		audioSrc = src
		if (!s.waveformRef) return
		s.waveformRef.loadFile(audioFile)

		console.log("loaded audio")
		historyManager.push(`Loaded audio track`)
	}
	// if only a new audio is loaded, give the warning
	if (audioFile && !lrcFile) {
		if (s.lyrics.length > 1) {
			isDialogNewAudioOpen = true
		}
	}

	// if we just loaded a file, there shouldn't be any changes to worry about?
	// s.unsavedChanges = true
	s.unsavedChanges = false // set false because history set it to true already

	showTopControls = false
	lrcFile = null
	audioFile = null

	console.log("yay, loaded!")
	console.log(`new lyric file: ${s.filePaths.lyrics} handle ${s.fileHandles.lyrics}`)
	console.log(`new audio file: ${s.filePaths.audio} handle ${s.fileHandles.audio}`)
}

onMount(() => {
	// @ts-ignore
	s.isTauri = !!(window.__TAURI_INTERNALS__)

	const cleanupfns: (() => void)[] = []

	function onFiles(files: FileWithHandle[]) {
		console.log(`processing all files:`, files)
		Array.from(files).forEach((file) => {
			console.log("processing file", file.name)
			const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()

			if (BAD_EXTENSIONS.has(ext)) {
				console.log(`ignoring file ext ${ext}`)
				return
			}

			if (LYRIC_EXTENSIONS.has(ext)) {
				lrcFile = file
				// s.filePaths.lyrics = file.name
				// if (file.handle) {
				// 	s.fileHandles.lyrics = file.handle
				// } else {
				// 	s.fileHandles.lyrics = undefined
				// }
			} else {
				audioFile = file
				// s.filePaths.audio = file.name
				// if (file.handle) {
				// 	s.fileHandles.audio = file.handle
				// } else {
				// 	s.fileHandles.audio = undefined
				// }
			}
		})
	}

	console.log("hi world")
	const dragDropCleanup = initDragDrop(
		// files
		onFiles,
		// show
		(show) => (showFileoverlay = show),
		// onAfterDrop
		doLoad,
	)

	const listeners = [
		["keydown", handleKeydown],
		["keyup", handleKeyup],
		["blur", () => {
			s.modkeysHeld.shift = false
			s.modkeysHeld.ctrl = false
			s.modkeysHeld.alt = false
		}],
		["beforeunload", (e: BeforeUnloadEvent) => {
			console.log("beforeunload fired", s.unsavedChanges)
			if (s.unsavedChanges) {
				e.preventDefault()
				e.returnValue = true
			}
		}],
	] as const

	listeners.forEach(([event, handler]) => {
		window.addEventListener(event, handler as EventListener)
		cleanupfns.push(() => window.removeEventListener(event, handler as EventListener))
	})

	updateRafId = requestAnimationFrame(update)
	fpsRafId = requestAnimationFrame(countfps)

	return () => {
		cancelAnimationFrame(updateRafId)
		cancelAnimationFrame(fpsRafId)
		dragDropCleanup()
		cleanupfns.forEach(fn => fn())
	}
})

let multiplier = $derived(1 * (s.modkeysHeld.shift ? 5 : 1) * (s.modkeysHeld.ctrl ? 10 : 1))

$effect(() => {
	if (!audioFile) return

	// Reset playback state
	s.currentAudioLine = 0
	s.currentCaretLine = 0
	s.audioTimeMs = 0

	// Stop old waveform
	s.waveformRef?.pause()

	return () => {
		if (audioSrc) {
			URL.revokeObjectURL(audioSrc)
			audioSrc = ""
		}
	}
})
</script>

<svelte:head>
	<title>{(s.unsavedChanges ? "*" : "") + getBaseName(s.filePaths.audio || s.filePaths.lyrics || "") + " | LRCSync" || "LRCSync"}</title>
</svelte:head>

<noscript>
	<div class="dialog-backdrop" role="dialog" aria-modal="true">
		<div class="dialog-box">
			<h1>LRCSync</h1>
			<p>lrc file editor with timeline audio visualization.</p>
			<p>JavaScript is required.</p>
		</div>
	</div>
</noscript>
<!-- <ScreensizeWarning /> -->
<DialogNewAudio bind:open={isDialogNewAudioOpen} />
<BPMMenu bind:open={showBPMMenu} />

<div class="app">
	<div class="container">
		<DragOverlay bind:open={showFileoverlay}></DragOverlay>

		{#if showTopControls}
			<div class="topcontrols">
				<TopControls bind:lrcFile bind:audioFile></TopControls>
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
			<Tooltip message="position of audio in the lyrics">
				<p>audio line: {s.currentAudioLine}</p>
			</Tooltip>
			<Tooltip message="position of the caret in the lyrics">
				<p>caret line: {s.currentCaretLine}</p>
			</Tooltip>
			<Tooltip message="time in seconds">
				<p>{(s.audioTimeMs / 1000).toFixed(2)}s</p>
			</Tooltip>
			<Tooltip message="time">
				<p>{formatTime(s.audioTimeMs)}</p>
			</Tooltip>
			<Tooltip message="frames per second">
				<p>FPS: {fps}</p>
			</Tooltip>
			<!-- TODO -->
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<Tooltip message="beats per minute">
				<!-- <Button type="button" onclick={() => (showBPMMenu = true)}>{s.audioBPM} BPM</Button> -->
				<!-- TODO: FIX this p, make button and remove svelte-ignores -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<p style="background-color: var(--bg-light)" onclick={() => (showBPMMenu = true)}>BPM: {s.useBPM ? s.audioBPM : "off"}</p>
			</Tooltip>
			{#if s.useBPM}
				<Tooltip message="current beat">
					<p>{getBeatAtTime(s.audioTimeMs).toFixed(2)}</p>
				</Tooltip>
				<div class="metronome">
					{#each Array(4) as _, i}
						<div class="beat" class:active={Math.floor(getBeatAtTime(s.audioTimeMs)) % 4 === i}></div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="belowwaveform">
			<div class="belowwaveform-left">
				<CurrentLyrics></CurrentLyrics>
				<ButtonControls></ButtonControls>
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
		<CollapsibleText title="debug info">
			<!-- <p>state: {JSON.stringify(s)}</p> -->
			<p>asdjasd: {JSON.stringify(s.lineElements)}</p>
			<p>lyric data: {JSON.stringify(s.lyrics, null, 2)}</p>
		</CollapsibleText>
		<br />
		<hr />
		<Footer></Footer>
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
    color: var(--bg-dark);
    background: var(--button-bg);
    cursor: pointer;
    font-weight: 600;

    .danger {
      background: var(--danger);
      color: white;
    }
  }
  label {
    cursor: pointer;
  }
  label:hover {
    border: 1px dashed red;
  }
}

.container {
  max-width: 2000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  height: 100svh;
  /* avoid the scrollbar */
  padding-right: 1rem;
  overflow: hidden;

  @media only screen and (max-width: 600px) {
    gap: 0px;
    height: 100%;
  }
}
.topcontrols {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid var(--border-muted);
}

.belowwaveform {
  display: flex;
  gap: 2rem;
  > * {
    flex: 1;
  }
  .belowwaveform-left {
    flex: 2;
  }
  /* .left {
  flex: 2;
   } */
}

button:hover:not(:disabled) {
  filter: brightness(0.98);
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tabarea {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
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
  min-height: 0;
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

.metronome {
  display: flex;
  gap: 0.5rem;
  align-items: center;

  .beat {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--border-muted);
    transition: all 0s 0s ease;

    &.active {
      background-color: var(--highlight);
      transition: all 0s 0s ease;
      transform: scale(1.3);
    }
  }
}
</style>
