<script lang="ts">
import type { LyricLine } from "$lib/parseLRC"
import { formatLine, formatTime } from "$lib/parseLRC"
import Waveform from "./Waveform.svelte"
interface Props {
	lyrics: LyricLine[]
	currentAudioLine: number
	currentCaretLine: number
	lineElements?: HTMLDivElement[]
	waveformRef: Waveform
	syncCaretWithAudio: boolean
}

let { lyrics, currentAudioLine = $bindable(), currentCaretLine = $bindable(), lineElements = $bindable([]), waveformRef, syncCaretWithAudio }: Props = $props()

$effect(() => {
	if (lyrics.length !== lineElements.length) {
		lineElements = new Array(lyrics.length)
	}
})

function handleLineClick(lineIndex: number) {
	currentCaretLine = lineIndex

	if (syncCaretWithAudio) {
		currentAudioLine = lineIndex
		const timeInSeconds = lyrics[lineIndex].time / 1000
		waveformRef.seekTo(timeInSeconds)
	}
}

function handleLineDblClick(lineIndex: number) {
	currentCaretLine = lineIndex

	currentAudioLine = lineIndex
	const timeInSeconds = lyrics[lineIndex].time / 1000
	waveformRef.seekTo(timeInSeconds)
}

function setLineTime(time: number, lineIndex: number) {
	const lyricsLines = lyrics

	if (lineIndex < lyricsLines.length) {
		const line = lyricsLines[lineIndex]
		line.time = time
	}
}

function handleSyncButtonClick() {
	setLineTime(waveformRef.getCurrentTime() * 1000, currentCaretLine)
	currentCaretLine++
	lineElements[currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}
function handleSkipButtonClick() {
	currentCaretLine++
	lineElements[currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}
</script>

<div class="sync-view">
	<div class="synccontrols">
		<input type="checkbox" bind:checked={syncCaretWithAudio} />
		<button onclick={handleSyncButtonClick}>sync</button>
		<button onclick={handleSkipButtonClick}>skip line</button>
	</div>

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
</div>

<style>
.sync-view {
  height: 20vh;
  display: flex;
  flex-direction: column;

  .synccontrols {
    flex-shrink: 0;
  }

  .lyricsbox {
    overflow-y: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;

    div {
      padding: 4px 8px;
      margin: 1px 0;
      border-radius: 3px;
      cursor: pointer;
      transition: background-color 0.15s ease;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;

      &:hover {
        background-color: rgba(0, 0, 0, 0.2);
      }
    }

    .current {
      background-color: #ffffff !important;
      color: #555555;
    }

    .caret {
      background-color: #4a90e2 !important;
      color: #ffffff;
    }

    /* When both current and caret are the same line */
    .current.caret {
      background-color: #ffffff !important;
      color: #555555;
      border: 2px solid #4a90e2;
    }
  }
}
</style>
