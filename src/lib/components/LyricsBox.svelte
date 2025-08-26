<script lang="ts">
import Waveform from "$lib/components/Waveform.svelte"
import { formatLine, type LyricLine } from "$lib/parseLRC"

import { s } from "$lib/state.svelte"

function handleLineClick(lineIndex: number) {
	s.currentCaretLine = lineIndex

	if (s.syncCaretWithAudio && s.waveformRef) {
		s.currentAudioLine = lineIndex
		const timeInSeconds = s.lyrics[lineIndex].time / 1000
		s.waveformRef.seekToTime(timeInSeconds)
	}
}

function handleLineDblClick(lineIndex: number) {
	s.currentCaretLine = lineIndex

	s.currentAudioLine = lineIndex
	const timeInSeconds = s.lyrics[lineIndex].time / 1000
	if (s.waveformRef) {
		s.waveformRef.seekToTime(timeInSeconds)
	}
}
</script>

<div class="lyricsbox">
	{#each s.lyrics as line, i}
		<div
			bind:this={s.lineElements[i]}
			class:current={i === s.currentAudioLine}
			class:caret={i === s.currentCaretLine}
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

<style>
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
</style>
