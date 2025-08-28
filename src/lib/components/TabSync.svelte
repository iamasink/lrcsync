<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import Waveform from "$lib/components/Waveform.svelte"
import type { LyricLine } from "$lib/parseLRC"
import { formatLine, formatTime } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"
const waveformRef = s.waveformRef

$effect(() => {
	if (s.lyrics.length !== s.lineElements.length) {
		s.lineElements = new Array(s.lyrics.length)
	}
})

function setLineTime(time: number, lineIndex: number) {
	const lyricsLines = s.lyrics

	if (lineIndex < lyricsLines.length) {
		const line = lyricsLines[lineIndex]
		line.time = time
	}
}

function handleSyncButtonClick() {
	s.syncCaretWithAudio = false
	if (!waveformRef) {
		return console.log("nuh uh")
	}
	setLineTime(waveformRef.getCurrentTime() * 1000, s.currentCaretLine)
	s.currentCaretLine++
	s.lineElements[s.currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}
function handleSkipButtonClick() {
	s.syncCaretWithAudio = false
	if (!waveformRef) {
		return console.log("nuh uh")
	}
	s.currentCaretLine++
	s.lineElements[s.currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}
</script>

<div class="sync-view">
	<div class="synccontrols">
		<button onclick={handleSyncButtonClick}>sync</button>
		<button onclick={handleSkipButtonClick}>skip line</button>
	</div>

	<!--
		<div class="lyricsbox">
			{#each lyrics as line, i}
				<div
					bind:this={lineElements[i]}
					class:current={i === currentAudioLine}
					class:caret={i === currentCaretLine}
					onclick={() => handleLineClick(i)}
					ondblclick={() => handleLineDblClick(i)}
					role="button"
					tabindex="0"
					onkeydown={(e) => {
						if (e.key === "q") {
							handleLineClick(i)
						}
					}}
				>
					{formatLine(line)}
				</div>
			{/each}
		</div>
	-->
	<div class="lyricsboxcontainer">
		<LyricsBox bind:lineElements={s.lineElements} />
	</div>
</div>

<style>
.sync-view {
  height: 100%;
  display: flex;
  flex-direction: column;

  .lyricsboxcontainer {
    overflow-y: scroll;
  }

  .synccontrols {}
}
</style>
