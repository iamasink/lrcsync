<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import type { LyricLine } from "$lib/parseLRC"
import { exportWithMetadata, formatLine, formatTime } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"
import { getContext } from "svelte"
</script>

<div class="metadata-view">
	<div>
		{#if s.isTauri}
			<p>straight up tauri'ng it</p>
		{:else}
			<p>im so normal</p>
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
</div>

<style>
.metadata-view {
  margin: 1rem;

  pre {
    height: 10vh;
    overflow-y: scroll;
  }
}
</style>
