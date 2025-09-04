<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import { exportLRC, formatLine, formatTime, parseLRC } from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"
import KeybindButton from "./KeybindButton.svelte"

let textAreaElement: HTMLTextAreaElement
let textUpdateTimeout: number | null = null

let lyricsText = $derived(exportLRC(s.lyrics))
let lyricsBoxElement: HTMLDivElement

let isScrolling = false
let scrollSource: "textarea" | "lyrics" | null = null

let lineElements = $state(new Array())
const waveformRef = s.waveformRef

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

let timeoutid: number | null = null
function syncScroll(source: HTMLElement, target: HTMLElement, origin: "textarea" | "lyrics") {
	if (scrollSource && scrollSource !== origin) return // another scroll is happening

	console.log("scroll!", origin)

	scrollSource = origin
	const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight)
	target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)

	if (timeoutid) clearTimeout(timeoutid)

	timeoutid = setTimeout(() => {
		scrollSource = null
		timeoutid = null
	}, 1000)
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

// sync
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
	if (s.currentCaretLine == -1) s.currentAudioLine == 0
	setLineTime(waveformRef.getCurrentTime() * 1000, s.currentCaretLine)
	s.currentCaretLine++
	s.lineElements2[s.currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}
function handleBackButtonClick() {
	s.syncCaretWithAudio = false
	if (!waveformRef) {
		return console.log("nuh uh")
	}
	s.currentCaretLine--
	s.lineElements2[s.currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}

function handleSkipButtonClick() {
	s.syncCaretWithAudio = false
	if (!waveformRef) {
		return console.log("nuh uh")
	}
	s.currentCaretLine++
	s.lineElements2[s.currentCaretLine].scrollIntoView({ block: "center", behavior: "smooth" })
}
</script>

<div class="edit-view">
	<div class="synccontrols">
		<div>
			<!-- <button onclick={handleSyncButtonClick}>sync (s)</button> -->
			<KeybindButton onclick={handleSyncButtonClick} shortcut={{ key: "s" }}>sync</KeybindButton>
			<KeybindButton onclick={handleBackButtonClick} shortcut={{ key: "e" }}>up line</KeybindButton>
		</div>
		<div style="margin-left: 8px"></div>
		<div>
			<KeybindButton onclick={handleSkipButtonClick} shortcut={{ key: "d" }}>skip line</KeybindButton>
		</div>
	</div>
	<div class="controls">
		<label>convert from:
			<select bind:value={s.convertedLyricsLang}>
				{#each ["ja", "none"] as lang}
					<option value={lang}>{lang.toUpperCase()}</option>
				{/each}
			</select>
		</label>
	</div>

	<div class="editboxes">
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
</div>

<style>
.edit-view {
  display: flex;
  flex-direction: column;
  height: 100%; /* inherit height from parent */
  box-sizing: border-box;

  .editboxes {
    display: flex;
    flex-direction: row;
    box-sizing: border-box;
    overflow-y: hidden;

    textarea {
      box-sizing: border-box;
      flex: 1;
      resize: none;
      background-color: var(--bg-light);
      color: #ffffff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;
      line-height: 1.6;
      font-size: 14px;
    }
    .lyricsboxcontainer {
      box-sizing: border-box;
      flex: 1;
      overflow-y: scroll;
    }
  }
}
</style>
