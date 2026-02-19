

<script lang="ts">
import Waveform from "$lib/components/Waveform.svelte";
import { formatLine, formatTime, formatTimestamp, type LyricLine } from "$lib/parseLRC";
import { convertAll, initKuroshiro } from "$lib/kuroshiro";
import { s } from "$lib/state.svelte"
import { onMount } from "svelte";
import type { UIEventHandler } from "svelte/elements";
import Tooltip from "./Tooltip.svelte";
import { historyManager } from "$lib/history.svelte";


// onMount(async () => {
// 	// @ts-ignore
// 	kuroshiro = new Kuroshiro.default();
// 	console.log(kuroshiro)
	
// 	// @ts-ignore
// 	console.log("new!", await new KuromojiAnalyzer())
// 	// @ts-ignore
// 	analyser = await kuroshiro.init(new KuromojiAnalyzer({ dictPath }))

// 	console.log(await convert("私の名前は何ですか？"))
// })

$effect(() => {
	// init on load
	initKuroshiro()
})

  $effect(() => {
    if (!s.lyrics.length) return;

    for (const line of s.lyrics) line.text;

    (async () => {
      s.convertedLyrics = await convertAll(s.lyrics.map(l => l.text));
    })();
  });




	interface Props {
		onscroll?: UIEventHandler<HTMLDivElement> | null | undefined;
		element?: HTMLDivElement;
		height?: number;
		lineElements: HTMLDivElement[]
	}

	let { onscroll, element = $bindable(), height = 22.4, lineElements=$bindable() }: Props = $props();

	let popupIndex: number | null = $state(null)

	function handleLineClick(lineIndex: number) {
		console.log("lineclick",lineIndex)
		s.currentCaretLine = lineIndex;

		if (s.syncCaretWithAudio && s.waveformRef) {
			const time = s.lyrics[lineIndex].time
			if (time === null || time === -1) return
			const timeInSeconds = (Math.round((time) * 100) / 100) / 1000;
			console.log("click2", time, timeInSeconds)
			s.waveformRef.seekToTime(timeInSeconds);
		}
	}
	function handleLineDblClick(lineIndex: number) {
		console.log("lineclick",lineIndex)
		s.currentCaretLine = lineIndex;

		if ( s.waveformRef) {
			const time = s.lyrics[lineIndex].time
			if (time === null || time === -1) return
			const timeInSeconds = time/ 1000;
			console.log(timeInSeconds)
			s.waveformRef.seekToTime(timeInSeconds);
		}
	}

	function getWarnings(lineIndex:number) {
		const warnings = [];
		const functions = [checkNextTime, checkSameTime, checkEnd, checkOrder]

		for (const func of functions) {
			const result = func(lineIndex);
			if (result) warnings.push(result);
		}

		return warnings
	}

	// check if the time between the start, and the next time is too big
	function checkNextTime(lineIndex: number) {
		const line = s.lyrics[lineIndex]
		const nextLine = s.lyrics[lineIndex + 1]

		if (!nextLine) return false
		if (line.time == -1) return false

		const gap = nextLine.time - line.time

		if ( gap > 10 * 1000 && line.text != "") {
			return "big gap!"
		}
	}
	function checkSameTime(lineIndex:number) {
		const line = s.lyrics[lineIndex]
		const prevLine = s.lyrics[lineIndex - 1]

		if (!prevLine) return false
		if (line.time == -1) return false

		const gap = prevLine.time - line.time
		if (gap === 0) return "same time as last!"
	}
	function checkEnd(lineIndex:number) {
		if (lineIndex+1==s.lyrics.length && s.lyrics[lineIndex].text !="") {
			return "no end time!"
		}
	}
	function checkOrder(lineIndex:number) {
		const line = s.lyrics[lineIndex]
		const nextLine = s.lyrics[lineIndex + 1]

		if (!nextLine) return false
		if (nextLine.time === -1) return false
		if (line.time === -1) return false
		if (lineIndex === 0) return false

		if (nextLine.time < line.time) {
			return "out of order!"
		}
	}


function getLine(lineIndex: number) {
	let text = s.convertedLyrics[lineIndex]
	let line = s.lyrics[lineIndex]
	let isInfo = false

	if (lineIndex  === 0 && text === "") {
		text = "(start of audio file)"
		isInfo = true
	}
	else if (lineIndex + 1 === s.lyrics.length && text === "" && line.time !== -1) {
		text = "(end of lyrics)"
		isInfo = true
	}

	return { text, isInfo }
}

function handleRemovetime(i:number) {
s.lyrics[i].time=-1
historyManager.push(`removed time for line ${i}`)
}
function handleDelete(i:number) {
s.lyrics.splice(i,1)
historyManager.push(`deleted line ${i}`)
}

</script>

<div class="lyricsbox" bind:this={element} {onscroll}>
	{#each s.lyrics as line, i}
		{@const lineinfo = getLine(i)}

		<!-- svelte-ignore a11y_no_static_element_interactions -->
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
		<div class="index">
			{i}
		</div>
			<div class="timestamp">
				{formatTimestamp(line.time)}
			</div>
			<div class="text" class:info={lineinfo.isInfo} >
				{lineinfo.text}
			</div>
			{#if !lineinfo.isInfo}
			<div class="buttons">
				<Tooltip message="Remove Time"><button onclick={() => handleRemovetime(i)}>✖️</button></Tooltip>
				<Tooltip message="Delete"><button onclick={() => handleDelete(i)}>🗑️</button></Tooltip>
			</div>
			{/if}
			{#if getWarnings(i).length>0}
			<div class="warning-indicator"
					onmouseenter={() => popupIndex = i}
					onmouseleave={() => popupIndex = null}
					>!
					{#if popupIndex === i}
						<div class="warning-popup">
							{#each getWarnings(i) as warning}
							<!-- TODO -->
								<div class="warning-item">
									<span>{warning}</span>
									<button disabled>Fix</button>
								</div>
							{/each}
						</div>
					{/if}
			</div>
			{/if}
		</div>
	{/each}
</div>
<!-- (❁´◡`❁) -->

<style>
	.lyricsbox {
		background-color: var(--bg-light);
		font-size: 14px;
		padding-top: 4px;
		padding-right: 16px;

		--offset-l-index: -0.4;
		--offset-c-index: 0;

		--offset-l-timestamp: -0.2;
		--offset-c-timestamp: -0.03;

		--colour-normal: var(--text);
		--colour-current: var(--bg);
		--colour-caret: var(oklch(100% 0.00011 271.152));
		--colour-currentcaret: oklch(from var(--colour-current) calc(l - 0.1) c h);
		
		
		.lyric-line {
			box-sizing: border-box;
			display: flex;
			column-gap: 0.5rem;
			height: 22.4px; /* 14px * 1.6 line-height = 22.4px */
			padding: 0 4px;
			align-items: center;
				user-select: none;


			&:hover {
				background-color: rgba(255, 255, 255, 0.1);
			}

			.index {
				width: 2ch;
				color: oklch(from var(--colour-normal) calc(l + var(--offset-l-index)) calc(c + var(--offset-c-index)) h);
			}

			.timestamp {
				color: oklch(from var(--colour-normal) calc(l + var(--offset-l-timestamp)) calc(c + var(--offset-c-timestamp)) h);
				font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono",
					"Segoe UI Mono", monospace;
				font-size: 0.85em;
				width: 70px;
				text-align: right;
			}
			
			.text {
				color: var(--colour-normal);

				flex: 1;
				line-height: 1;
				text-overflow: ellipsis;
				white-space: nowrap;
				min-width: 0;

				&.info {
					opacity: 50%
				}
			}


			.buttons {
				  display: none; /* hidden by default */
			}
			&.lyric-line:hover .buttons {
				  display: flex; /* show when parent is hovered */
			}

		}
		.current {
			background-color: #ffffff !important;

			.index {
				color: oklch(from var(--colour-current) calc(l + var(--offset-l-index)) calc(c + var(--offset-c-index)) h);
			}
			.timestamp {
				color: oklch(from var(--colour-current) calc(l + var(--offset-l-timestamp)) calc(c + var(--offset-c-timestamp)) h);
			}

			.text {
				color: var(--colour-current);
			}

		}

		.caret {
			background-color: #4a90e2 !important;

			.index {
				color: oklch(from var(--colour-caret) calc(l + var(--offset-l-index)) calc(c + var(--offset-c-index)) h);
			}
			.timestamp {
				color: oklch(from var(--colour-caret) calc(l + var(--offset-l-timestamp)) calc(c + var(--offset-c-timestamp)) h);
			}

			.text {
				color: var(--colour-caret)
			}
			
		}

		.current.caret {
			background-color: rgb(207, 229, 255) !important;
			/* border: 2px solid #4a90e2; */

			.index {
				color: oklch(from var(--colour-currentcaret) calc(l + var(--offset-l-index)) calc(c + var(--offset-c-index)) h);
			}
			.timestamp {
				color: oklch(from var(--colour-currentcaret) calc(l + var(--offset-l-timestamp)) calc(c + var(--offset-c-timestamp)) h);
			}
			.text {
				color: var(--colour-currentcaret);
			}


			
		}
	}

	.warning-indicator {
		background-color: #ffcc00;
		padding: 8px;
		font-weight: bold;
		cursor: pointer;
		position: relative;
		user-select: none;
	}

	.warning-popup {
		cursor: default;
		position: absolute;
		transform: translateX(-90%); 
		background: #333;
		border: 1px solid #555;
		padding: 0.5rem;
		border-radius: 4px;
		min-width: 180px;
		z-index: 10;
	}

	/* .warning-item {
		
	} */

</style>
