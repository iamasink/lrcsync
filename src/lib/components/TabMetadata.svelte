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

	<pre>{exportWithMetadata(s.lyrics)}</pre>
	<label><button
			onclick={() => {
				s.metadata.re = "iamasink/lrcsync"
				s.metadata.ve = "1"
				s.metadata.by = $preferences.username ?? ""
			}}
		>
			a
		</button></label>
	<label>lrc by: <input type="text" bind:value={$preferences.username}></label>
	<br />
	<button onclick={saveFile}>save</button>
	<button onclick={copy}>copy</button>
</div>

<style>
.metadata-view {
  pre {
    height: 10vh;
    overflow-y: scroll;
  }

  input {
    width: 50%;
  }
}
</style>
