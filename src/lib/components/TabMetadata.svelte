<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import type { LyricLine } from "$lib/parseLRC"
import { exportWithMetadata, formatLine, formatTime } from "$lib/parseLRC"
import { preferences, s } from "$lib/state.svelte"
import { save } from "@tauri-apps/plugin-dialog"
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs"
import { getContext } from "svelte"

function getLrcName() {
	let filename

	if (s.filePaths.lyrics) {
		// because we might've imported a .txt or something
		const index = s.filePaths.lyrics.lastIndexOf(".")
		if (index > 0) filename = getBaseName(s.filePaths.lyrics).slice(0, index) + ".lrc"
	} else if (s.filePaths.audio) {
		const index = s.filePaths.audio.lastIndexOf(".")
		if (index > 0) filename = getBaseName(s.filePaths.audio).slice(0, index) + ".lrc"
	}

	return filename ? filename : ""
}

function getParentDir(filePath: string): string {
	if (!filePath) return ""
	const parts = filePath.split(/[\\/]/)
	parts.pop()
	return parts.join("/") || ""
}
function getBaseName(filePath: string): string {
	if (!filePath) return ""
	const parts = filePath.split(/[\\/]/)
	return parts.pop() || ""
}

let parentDir: string = $derived(getParentDir(s.filePaths.lyrics || s.filePaths.audio || ""))
let audioName: string = $derived(getBaseName(s.filePaths.audio ?? ""))
let lrcName: string = $derived(getLrcName())

// if (s.isTauri) {
// 	parentDir = getParentDir(s.filePaths.lyrics || s.filePaths.audio || "")
// }

async function saveFile() {
	console.log("saving lyrics")
	const text = exportWithMetadata(s.lyrics)
	if (s.isTauri) {
		try {
			// save dialog, default to original path
			const filePath = await save({ defaultPath: s.filePaths.lyrics || "unknown.lrc", filters: [{ name: "LRC Files", extensions: ["lrc", "txt"] }] })

			if (!filePath) return // cancelled?

			await writeTextFile(filePath, text)
			console.log("File saved to", filePath)
		} catch (err) {
			console.error("error saving file", err)
		}
	} else {
		const text = exportWithMetadata(s.lyrics)
		// @ts-ignore
		if (window.showSaveFilePicker) {
			// @ts-ignore
			const handle = await window.showSaveFilePicker({
				suggestedName: s.filePaths.lyrics,
				types: [{ description: "LRC Files", accept: { "text/plain": [".lrc", ".txt"] } }],
			})

			const writable = await handle.createWritable()
			await writable.write(text)
			await writable.close()
		} else {
			const blob = new Blob([text], { type: "text/plain" })

			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			let filename = getLrcName()
			if (!filename) filename = "unknown.lrc"

			a.download = filename
			a.click()

			URL.revokeObjectURL(url)
		}
	}
}
async function copy() {
	const text = exportWithMetadata(s.lyrics)
	navigator.clipboard.writeText(text)
}
</script>

<div class="metadata-view">
	<div>
		<!-- TODO: FIX THIS -->
		{#if s.isTauri}
			<p>straight up tauri'ng it</p>
			<label>base path <input type="text" bind:value={parentDir} /></label><br />
			<label>audio name: <input type="text" bind:value={audioName} /></label><br />
			<label>lrc name: <input type="text" bind:value={lrcName} placeholder={getLrcName()} /></label>
		{:else}
			<p>im browser</p>
			<label>audio name: <input type="text" bind:value={s.filePaths.audio} /></label><br />
			<label>lrc name: <input type="text" bind:value={s.filePaths.lyrics} placeholder={getLrcName()} /></label>
		{/if}
	</div>

	<pre class="lrcpreview">{exportWithMetadata(s.lyrics)}</pre>
	<label><button
			onclick={() => {
				s.metadata.re = "iamasink/lrcsync"
				s.metadata.ve = "1"
				s.metadata.by = $preferences.username ?? ""
			}}
		>
			add metadata
		</button></label>
	<!-- <details> -->
	<!-- <summary>edit metadata</summary> -->
	<!-- <div class="content"> -->
	<!-- <label><button bind:value={s.metadata.}></button></label> -->
	<!--
		<label>Title (ti)<input bind:value={s.metadata.ti}></label><br />
		<label>Artist (ar)<input bind:value={s.metadata.ar}></label><br />
		<label>Album (al)<input bind:value={s.metadata.al}></label><br />
		<label>Author (au)<input bind:value={s.metadata.au}></label><br />
		<label>Lyricist (lr)<input bind:value={s.metadata.lr}></label><br />
		<label>Length of the song (length)<input bind:value={s.metadata.length}></label><br />
		<label>LRC file author (by)<input bind:value={s.metadata.by}></label><br />
		<label>Timing offset (offset)<input bind:value={s.metadata.offset}></label><br />
		<label>Program/tool (re)<input bind:value={s.metadata.re}></label><br />
		<label>Program version (ve)<input bind:value={s.metadata.ve}></label><br />
	-->
	<!-- <label>Comment marker (#)<input bind:value={s.metadata.c}> -->
	<!-- </div> -->
	<!-- </details> -->
	<label>lrc by: <input type="text" bind:value={$preferences.username} placeholder="your name"></label>
	<br />
	<button onclick={saveFile}>save</button>
	<button onclick={copy}>copy</button>
</div>

<style>
.metadata-view {
  pre {
    height: 10vh;
    overflow-y: scroll;
    border: var(--border-muted) 1px solid;
    margin: 0.5rem;
  }

  details {
    overflow-y: auto;
    max-height: 10rem;
    border: var(--border-muted) 1px solid;
    margin: 0.5rem;
  }

  input {
    width: 50%;
  }
}
</style>
