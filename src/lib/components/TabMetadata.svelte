<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import type { LyricLine } from "$lib/parseLRC"
import { exportWithMetadata, formatLine, formatTime } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"
import { getContext } from "svelte"

async function saveFile() {
	console.log("saving audio")
	if (s.isTauri) {
		console.error("saving on tauri not implemented yet")
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
			let filename
			if (s.filePaths.lyrics) {
				// because we might've imported a .txt or something
				const index = s.filePaths.lyrics.lastIndexOf(".")
				if (index > 0) filename = s.filePaths.lyrics.slice(0, index) + ".lrc"
			} else if (s.filePaths.audio) {
				const index = s.filePaths.audio.lastIndexOf(".")
				if (index > 0) filename = s.filePaths.audio.slice(0, index) + ".lrc"
			}
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
		{#if s.isTauri}
			<p>straight up tauri'ng it</p>
		{:else}
			<p>im browser</p>
		{/if}
		<p>audio {s.filePaths.audio}</p>
		<p>lyrics {s.filePaths.lyrics}</p>
	</div>

	<pre>{exportWithMetadata(s.lyrics)}</pre>
	<label><button
			onclick={() => {
				s.metadata.re = "iamasink/lrcsync"
			}}
		>
			a
		</button></label>
	<label>lrc by: <input type="text" bind:value={s.metadata.by}></label>
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
}
</style>
