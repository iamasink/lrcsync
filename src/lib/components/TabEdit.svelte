<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import { exportLRC, formatLine, formatTime, parseLRC } from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"

let textAreaElement: HTMLTextAreaElement
let textUpdateTimeout: number | null = null

let lyricsText = $derived(exportLRC(s.lyrics))
let lyricsBoxElement: HTMLDivElement

let isScrolling = false
let scrollSource: "textarea" | "lyrics" | null = null

let lineElements = $state(new Array())

function handleInput() {
	if (!textAreaElement) return

	const currentScrollTop = textAreaElement.scrollTop

	s.currentCaretLine = textAreaElement.value.substring(0, textAreaElement.selectionStart).split("\n").length - 1
	console.log("caretline", s.currentCaretLine)

	if (textUpdateTimeout) clearTimeout(textUpdateTimeout)

	textUpdateTimeout = setTimeout(() => {
		try {
			console.log("updating lyrics :)")

			requestAnimationFrame(() => {
				const updatedLyrics = parseLRC(lyricsText).lyrics
				if (s.lyrics != updatedLyrics) {
					s.lyrics = updatedLyrics
				}
				if (textAreaElement && lyricsBoxElement) {
					textAreaElement.scrollTop = currentScrollTop
					syncScroll(textAreaElement, lyricsBoxElement, "textarea")
				}
			})
		} catch (error) {
			console.warn("Failed to parse LRC text:", error)
		}
	}, 500)
}

function syncScroll(source: HTMLElement, target: HTMLElement, origin: "textarea" | "lyrics") {
	if (scrollSource && scrollSource !== origin) return // another scroll is happening

	console.log("scroll!", origin)

	scrollSource = origin
	const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight)
	target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)

	setTimeout(() => {
		scrollSource = null
	}, 160)
}

function handleTextAreaScroll() {
	if (textAreaElement && lyricsBoxElement) {
		syncScroll(textAreaElement, lyricsBoxElement, "textarea")
	}
}

function handleLyricsBoxScroll() {
	if (textAreaElement && lyricsBoxElement) {
		syncScroll(lyricsBoxElement, textAreaElement, "lyrics")
	}
}
</script>

<div class="edit-view">
	<textarea
		bind:this={textAreaElement}
		bind:value={lyricsText}
		onclick={handleInput}
		onkeyup={handleInput}
		oninput={handleInput}
		onscroll={handleTextAreaScroll}
	></textarea>
	<!--
		<div class="lyricsbox" bind:this={lyricsBoxElement} onscroll={handleLyricsBoxScroll}>
			{#each s.lyrics as line, i}
				<div class="lyric-line">
					<div class="timestamp">
						[{formatTime(line.time)}]
					</div>
					<div class="text">
						{line.text}
					</div>
				</div>
			{/each}
		</div>
	-->

	<div class="lyricsboxcontainer" bind:this={lyricsBoxElement} onscroll={handleLyricsBoxScroll}>
		<LyricsBox bind:lineElements={s.lineElements2} />
	</div>
</div>

<style>
.edit-view {
  display: flex;
  flex-direction: row;
  height: 100%; /* inherit height from parent */

  textarea {
    flex: 1;
    resize: none;
    background-color: #57425a;
    color: #ffffff;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;
    line-height: 1.6;
    font-size: 14px;
  }
  .lyricsboxcontainer {
    flex: 1;
    overflow-y: scroll;
  }
}
</style>
