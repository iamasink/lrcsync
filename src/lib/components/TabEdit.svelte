<script lang="ts">
import { goto } from "$app/navigation"
import LyricsBox from "$lib/components/LyricsBox.svelte"
import { exportLRC, formatLine, formatTime, getOffsetToNextLyric, parseLRC, roundTimestamp, sortLines } from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { scrollLineIntoView } from "$lib/scroll"
import { preferences, s } from "$lib/state.svelte"
import KeybindButton from "./KeybindButton.svelte"

let textAreaElement: HTMLTextAreaElement
let textUpdateTimeout: number | null = null

let lyricsText = $derived(exportLRC(s.lyrics))
let lyricsBoxElement: HTMLDivElement

let isScrolling = false
let scrollSource: "textarea" | "lyrics" | null = null

let lineElements = $state(new Array())

// let preferences.syncDelayMs = $state(0)

function handleInput() {
	if (!textAreaElement) return

	const currentScrollTop = textAreaElement.scrollTop

	s.currentCaretLine = textAreaElement.value.substring(0, textAreaElement.selectionStart).split("\n").length - 1
	console.log("caretline", s.currentCaretLine)

	if (textUpdateTimeout) clearTimeout(textUpdateTimeout)

	textUpdateTimeout = window.setTimeout(() => {
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

	timeoutid = window.setTimeout(() => {
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

function gotoNextLine() {
	s.currentCaretLine += getOffsetToNextLyric()
}

function handleSyncButtonClick() {
	s.syncCaretWithAudio = false
	if (!s.waveformRef) {
		return console.log("nuh uh")
	}
	if (s.currentCaretLine == -1) s.currentAudioLine = 0

	// const time = roundTimestamp(s.waveformRef.getCurrentTime() * 1000)
	const time = s.waveformRef.getCurrentTime() * 1000

	setLineTime(time - $preferences.syncDelayMs, s.currentCaretLine)

	gotoNextLine()

	scrollLineIntoView(s.currentCaretLine)
	s.waveformRef.updateRegions()
}
function handleBackButtonClick() {
	s.syncCaretWithAudio = false
	if (!s.waveformRef) {
		return console.log("nuh uh")
	}
	let newline
	newline = s.currentCaretLine - 1
	if (newline < 0) newline = 0
	if (newline >= s.lyrics.length) newline = s.lyrics.length - 1
	s.currentCaretLine = newline
	scrollLineIntoView(s.currentCaretLine)

	s.waveformRef.updateSelectedRegions()
}

function handleSkipButtonClick() {
	s.syncCaretWithAudio = false
	if (!s.waveformRef) {
		return console.log("nuh uh")
	}
	let newline
	newline = s.currentCaretLine + 1
	if (newline < 0) newline = 0
	if (newline >= s.lyrics.length) newline = s.lyrics.length - 1
	s.currentCaretLine = newline
	scrollLineIntoView(s.currentCaretLine)
	s.waveformRef.updateSelectedRegions()
}

function handleBlankButtonClick() {
	s.lyrics.splice(s.currentCaretLine, 0, { text: "", time: s.audioTime - $preferences.syncDelayMs })
	gotoNextLine()

	s.lyrics = sortLines(s.lyrics)

	s.waveformRef?.updateRegions()
}
</script>

<div class="edit-view">
	<div class="above">
		<div class="synccontrols">
			<div>
				<!-- <button onclick={handleSyncButtonClick}>sync (s)</button> -->
				<KeybindButton title="sync the current caret line to the current audio time" onclick={handleSyncButtonClick} shortcut={{ key: "s" }}
				>sync</KeybindButton>
				<KeybindButton title="move the caret up" onclick={handleBackButtonClick} shortcut={{ key: "e" }}>up line</KeybindButton>
			</div>
			<div style="margin-left: 8px"></div>
			<div>
				<KeybindButton title="move the caret down" onclick={handleSkipButtonClick} shortcut={{ key: "d" }}>skip line</KeybindButton>
				<KeybindButton title="insert an empty timed line (break)" onclick={handleBlankButtonClick} shortcut={{ key: "b" }}>insert blank</KeybindButton>
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
			<label>sync offset:
				<input type="number" bind:value={$preferences.syncDelayMs} min="-500" max="500">
			</label>
		</div>
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

  .above {
    display: flex;
    flex-direction: column;
    > div {
      display: flex;
      flex-direction: row;
      div {
        display: flex;
        flex-direction: row;
      }
    }
  }

  .editboxes {
    display: flex;
    flex-direction: row;
    overflow-y: hidden;

    textarea {
      flex: 1;
      resize: none;
      background-color: var(--bg-light);
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
}
</style>
