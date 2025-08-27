<script lang="ts">
	import Waveform from "$lib/components/Waveform.svelte";
	import { formatLine, formatTime, type LyricLine } from "$lib/parseLRC";

	interface Props {
		onscroll?: UIEventHandler<HTMLDivElement> | null | undefined;
		element?: HTMLDivElement;
		height?: number;
		lineElements: HTMLDivElement[]
	}

	let { onscroll, element = $bindable(), height = 22.4, lineElements=$bindable() }: Props = $props();

	import { s } from "$lib/state.svelte";
	import type { UIEventHandler } from "svelte/elements";

	function handleLineClick(lineIndex: number) {
		s.currentCaretLine = lineIndex;

		if (s.syncCaretWithAudio && s.waveformRef) {
			s.currentAudioLine = lineIndex;
			const timeInSeconds = s.lyrics[lineIndex].time / 1000;
			s.waveformRef.seekToTime(timeInSeconds);
		}
	}

	function handleLineDblClick(lineIndex: number) {
		s.currentCaretLine = lineIndex;

		s.currentAudioLine = lineIndex;
		const timeInSeconds = s.lyrics[lineIndex].time / 1000;
		if (s.waveformRef) {
			s.waveformRef.seekToTime(timeInSeconds);
		}
	}
</script>

<div class="lyricsbox" bind:this={element} {onscroll}>
	{#each s.lyrics as line, i}
		<div
			class="lyric-line"
			style="height: {height}px"
			bind:this={lineElements[i]}
			class:current={i === s.currentAudioLine}
			class:caret={i === s.currentCaretLine}
			onclick={() => handleLineClick(i)}
			ondblclick={() => handleLineDblClick(i)}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === "q") {
					handleLineClick(i);
				}
			}}
		>
			<div class="timestamp">
				[{formatTime(line.time)}]
			</div>
			<div class="text">
				{line.text}
			</div>
		</div>
	{/each}
</div>

<style>
	.lyricsbox {
		background-color: #453549;
		font-size: 14px;
		padding-top: 4px;
		
		
		.lyric-line {
			box-sizing: border-box;
			display: flex;
			column-gap: 0.5rem;
			height: 22.4px; /* 14px * 1.6 line-height = 22.4px */
			/* padding: 0 4px; */
			align-items: center;
				user-select: none;


			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
			}

			.timestamp {
				color: #a0a0a0;
				font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono",
					"Segoe UI Mono", monospace;
				font-size: 0.85em;
				width: 70px;
				text-align: right;
			}

			.text {
				flex: 1;
				line-height: 1;
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
				min-width: 0;
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

		.current.caret {
			background-color: #ffffff !important;
			color: #555555;
			border: 2px solid #4a90e2;
			
		}
	}

</style>
