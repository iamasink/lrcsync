<script lang="ts">
import type { LyricLine } from "$lib/parseLRC"
import { formatLine } from "$lib/parseLRC"
import Waveform from "./Waveform.svelte"
interface Props {
	lyrics: LyricLine[]
	currentAudioLine: number
	lineElements?: HTMLDivElement[]
	waveformRef: Waveform
}

let {
	lyrics,
	currentAudioLine = $bindable(),
	lineElements = $bindable([]),
	waveformRef,
}: Props = $props()

$effect(() => {
	if (lyrics.length !== lineElements.length) {
		lineElements = new Array(lyrics.length)
	}
})

function handleLineClick(lineIndex: number) {
	currentAudioLine = lineIndex
	// set audio time to this line
	const timeInSeconds = lyrics[lineIndex].time / 1000
	waveformRef.seekTo(timeInSeconds)
}
</script>

<div class="sync-view">
	{#each lyrics as line, i}
		<div
			bind:this={lineElements[i]}
			class:current={i === currentAudioLine}
			onclick={() => handleLineClick(i)}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					handleLineClick(i)
				}
			}}
		>
			{formatLine(line)}
		</div>
	{/each}
</div>

<style>
.sync-view {
  height: 60vh;
  overflow: auto;

  div {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;
    padding: 4px 8px;
    margin: 1px 0;
    border-radius: 3px;
    cursor: pointer;
    transition: background-color 0.15s ease;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  div:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .current {
    background-color: #ffffff !important;
    color: #555555;
  }
}
</style>
