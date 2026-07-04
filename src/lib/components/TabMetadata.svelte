<script lang="ts">
import { forgetMusicDir, getBaseName, getDescendantPath, getLrcDescendantPath, getLrcName, getMusicDir, getParentDir, saveFile, setMusicDir } from "$lib/fileSystem"
import { historyManager } from "$lib/history.svelte"
import { cleanAndSort, exportWithMetadata } from "$lib/parseLRC"
import { preferences, s } from "$lib/state.svelte"
import { onMount } from "svelte"
	import Button from "./Button.svelte";

let parentDir: string = $derived(getParentDir(s.filePaths.lyrics || s.filePaths.audio || ""))
let audioName: string = $derived(getBaseName(s.filePaths.audio ?? ""))
let lrcName: string = $derived(getLrcName())

let musicDirHandle: FileSystemDirectoryHandle | null = $state(null)
// set on mount
onMount(async () => {
	if (!s.isTauri) {
		// parentDir = getParentDir(s.filePaths.lyrics || s.filePaths.audio || "")
		musicDirHandle = null
		// s.musicDirHandle = null
		musicDirHandle = await getMusicDir()
		console.log("mount musicdirhandle = ", musicDirHandle)
	}
})

// if (s.isTauri) {
// 	parentDir = getParentDir(s.filePaths.lyrics || s.filePaths.audio || "")
// }

async function copy() {
	const text = exportWithMetadata(s.lyrics)
	navigator.clipboard.writeText(text)
}
async function copyRomanized() {
	const text = s.convertedLyrics.join("\n")
	navigator.clipboard.writeText(text)
}

async function handleSaveButton() {
	const result = await saveFile()
	if (result) {
		alert("saved as " + result)
	}
}
async function handleSaveAndClearButton() {
	const result = await saveFile()
	if (result) {
		alert("saved as " + result)
		s.lyrics = []
		s.filePaths.lyrics = undefined
		s.fileHandles.lyrics = undefined
		s.fileHandles.audio = undefined
		s.filePaths.audio = undefined
	}
}

</script>

<div class="metadata-view">
	<div>
		<!-- TODO: FIX THIS -->
		{#if s.isTauri}
			<p>tauri</p>
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
				cleanAndSort()
				s.metadata.re = "iamasink/lrcsync"
				s.metadata.ve = "1"
				s.metadata.by = $preferences.username ?? ""
			}}
		>
			add metadata
		</button></label>
	<label>lrc by: <input type="text" bind:value={$preferences.username} placeholder="your name"></label>

	<br />
	<button
		onclick={() => {
			cleanAndSort()
			historyManager.push("cleanup")
		}}
	>
		cleanup
	</button>
	<details>
	<summary>metadata</summary>
	<div>
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
	</div>
	</details>
	<br />
	<button onclick={handleSaveButton}>save</button>
	<button onclick={handleSaveAndClearButton}>save and clear</button>
	<button onclick={copy}>copy</button>
	<button onclick={copyRomanized}>copy romanized</button>
	<br />
	<Button title="you can give permission for your whole music directory to make editing files easier
	this will allow automatically saving sidecar .lrc files next to dragged in music"
		onclick={async () => {
			musicDirHandle = await setMusicDir()
		}}
	>
		setup music directory. currently <b>{musicDirHandle ? musicDirHandle.name : "not set"}</b>
	</Button>
	<button onclick={async()=>{forgetMusicDir(); musicDirHandle = null; alert("you can remove permission from browser settings")}}>remove directory</button>
	<br />
	<div>
		<p>current music directory: {musicDirHandle?.name || "not set"}</p>
		<p>current audio file: {s.filePaths.audio || "not set"}</p>
		<p>current lrc file: {s.filePaths.lyrics || "not set"}</p>
		{#if musicDirHandle}
			{#if s.fileHandles.audio}
				{#await getDescendantPath(musicDirHandle, s.fileHandles.audio) then path}
					<p>current audio file full path: {path ? path.join("/") : "not set"}</p>
				{/await}
			{/if}
			{#if s.fileHandles.lyrics}
				{#await getLrcDescendantPath(musicDirHandle, s.fileHandles.lyrics) then path}
					<p>current lrc file full path: {path ? path.join("/") : "not set"}</p>
				{/await}
			{/if}
		{/if}
		<p>current audio handle: {s.fileHandles.audio ? s.fileHandles.audio.name : "not set"}</p>
		<p>current lrc handle: {s.fileHandles.lyrics ? s.fileHandles.lyrics.name : "not set"}</p>
	</div>
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
