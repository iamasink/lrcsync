

<script lang="ts">
	import Waveform from "$lib/components/Waveform.svelte";
	import { formatLine, formatTime, formatTimestamp, type LyricLine } from "$lib/parseLRC";
	import { convertAll } from "$lib/kuroshiro";
import { s } from "$lib/state.svelte"
	


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

	import { onMount } from "svelte";
	import type { UIEventHandler } from "svelte/elements";
	import Tooltip from "./Tooltip.svelte";

	function handleLineClick(lineIndex: number) {
		console.log("lineclick",lineIndex)
		s.currentCaretLine = lineIndex;

		if (s.syncCaretWithAudio && s.waveformRef) {
			const time = s.lyrics[lineIndex].time
			if (!time || time == -1) return
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
			if (!time || time == -1) return
			const timeInSeconds = time/ 1000;
			console.log(timeInSeconds)
			s.waveformRef.seekToTime(timeInSeconds);
		}
	}

	function getWarnings(lineIndex:number) {
		const warnings = [];
		const functions = [checkNextTime, checkEnd]

		for (const func of functions) {
			const result = func(lineIndex);
			if (result) warnings.push(result);
		}

		return warnings
	}

	// check if the time between the start, and the next time is too big
	function checkNextTime(lineIndex: number) {
		const line = s.lyrics[lineIndex];
		const nextLine = s.lyrics[lineIndex + 1];

		if (!nextLine) return false;
		if (line.time == -1) return false

		const gap = nextLine.time - line.time;

		if ( gap > 10 * 1000 && line.text != "") {
			return "big gap!"
		}
	}
	function checkEnd(lineIndex:number) {
		if (lineIndex+1==s.lyrics.length && s.lyrics[lineIndex].text !="") {
			return "no end time!"
		}
	}


function getLine(lineIndex: number) {
	let text = s.convertedLyrics[lineIndex]
	let isInfo = false

	if (lineIndex + 1 === s.lyrics.length && text === "") {
		text = "(end of lyrics)"
		isInfo = true
	}

	return { text, isInfo }
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
			<div class="timestamp">
				{formatTimestamp(line.time)}
			</div>
			<div class="text" class:info={lineinfo.isInfo} >
				{lineinfo.text}
			</div>
			<div class="buttons">
				<Tooltip message="Remove Time"><button onclick={() => {s.lyrics[i].time=-1}}>✖️</button></Tooltip>
				<Tooltip message="Delete"><button onclick={() => {s.lyrics.splice(i,1)}}>🗑️</button></Tooltip>
			</div>
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

<style>
	.lyricsbox {
		background-color: var(--bg-light);
		font-size: 14px;
		padding-top: 4px;
		padding-right: 16px;
		
		
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

			.text {
				color: #353535;
			}

			.timestamp {
				color: #2c2c2c;
			}
		}

		.caret {
			background-color: #4a90e2 !important;

			.text {
				color: #ffffff;
			}
			
			.timestamp {
				color: #e0e0e0;
			}
		}

		.current.caret {
			background-color: rgb(207, 229, 255) !important;
			/* border: 2px solid #4a90e2; */

			.text {
				color: #353535;
			}

			.timestamp {
				color: #2c2c2c;
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
