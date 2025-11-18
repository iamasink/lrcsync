<script lang="ts">
import LyricsBox from "$lib/components/LyricsBox.svelte"
import { historyManager } from "$lib/history.svelte"
import {
	cleanAndSort,
	exportLRC,
	formatLine,
	formatTime,
	formatTimestamp,
	getOffsetToLastLyric,
	getOffsetToNextLyric,
	parseLRC,
	roundTimestamp,
	sortLines,
	toCentiseconds,
} from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"
import { scrollLineIntoView } from "$lib/scroll"
import { preferences, s } from "$lib/state.svelte"
import { onMount } from "svelte"
import KeybindButton from "./KeybindButton.svelte"

let textAreaElement: HTMLTextAreaElement
let textUpdateTimeout: number | null = null

let lyricsText = $derived(exportLRC(s.lyrics))
let lyricsBoxElement: HTMLDivElement

let isScrolling = false
let scrollSource: "textarea" | "lyrics" | null = null

let lineElements = $state(new Array())

// let preferences.syncDelayMs = $state(0)

function handleBlur() {
	if (!textAreaElement) return
	if (textUpdateTimeout) window.clearTimeout(textUpdateTimeout)

	setLyrics()

	// because we update the actual lyrics without pushing to history, its possible
	// that this change is considered part of another..
	historyManager.push("input edited")
}

function handleInput() {
	s.currentCaretLine = textAreaElement.value.substring(0, textAreaElement.selectionStart).split("\n").length - 1

	if (textUpdateTimeout) {
		window.clearTimeout(textUpdateTimeout)
	} else {
		console.log("no timeout:)", textUpdateTimeout)
		historyManager.pushDebounced("input edited", {}, 10000)
	}

	textUpdateTimeout = window.setTimeout(() => {
		try {
			setLyrics()
			historyManager.pushDebounced("input edited", {}, 10000)
		} catch (error) {
			console.warn("Failed to parse LRC text:", error)
		} finally {
			// clear the timeout after it fires
			textUpdateTimeout = null
		}
	}, 500)
}
function setLyrics() {
	const currentScrollTop = textAreaElement.scrollTop
	const updatedLyrics = parseLRC(lyricsText).lyrics

	if (JSON.stringify(s.lyrics) != JSON.stringify(updatedLyrics)) {
		s.lyrics = updatedLyrics
	} else {
		console.log("no change")
	}
	if (textAreaElement && lyricsBoxElement) {
		textAreaElement.scrollTop = currentScrollTop
		syncScroll(textAreaElement, lyricsBoxElement, "textarea")
	}
}

let timeoutid: number | null = null
function syncScroll(source: HTMLElement, target: HTMLElement, origin: "textarea" | "lyrics") {
	if (scrollSource && scrollSource !== origin) return // another scroll is happening

	// console.log("scroll!", origin)

	scrollSource = origin
	const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight)
	target.scrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)

	if (timeoutid) clearTimeout(timeoutid)

	timeoutid = window.setTimeout(() => {
		scrollSource = null
		timeoutid = null
	}, 10)
}

function handleTextAreaScroll(e: Event) {
	if (textAreaElement && lyricsBoxElement) {
		syncScroll(textAreaElement, lyricsBoxElement, "textarea")
	}
	e.stopPropagation()
	e.preventDefault()
}

function handleLyricsBoxScroll(e: Event) {
	if (textAreaElement && lyricsBoxElement) {
		syncScroll(lyricsBoxElement, textAreaElement, "lyrics")
	}
	e.stopPropagation()
	e.preventDefault()
}

function handleWheel(e: WheelEvent) {
	e.stopPropagation()
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

// let syncTimeout: number
function handleSyncButtonClick() {
	s.syncCaretWithAudio = false
	if (!s.waveformRef) {
		return console.log("nuh uh")
	}
	if (s.currentCaretLine == -1) s.currentAudioLine = 0

	// const time = roundTimestamp(s.waveformRef.getCurrentTime() * 1000)
	const time = s.waveformRef.getCurrentTime() * 1000
	const newtime = toCentiseconds(time - $preferences.syncDelayMs)

	setLineTime(newtime, s.currentCaretLine)
	const oldline = s.currentCaretLine

	gotoNextLine()

	scrollLineIntoView(s.currentCaretLine)
	s.waveformRef.updateRegions()

	// if (syncTimeout) clearTimeout(syncTimeout)
	// syncTimeout = window.setTimeout(() => {
	// 	requestAnimationFrame(() => {
	// 		historyManager.push(`synced line ${oldline} (${formatTimestamp(newtime)})`)
	// 	})
	// }, 500)

	historyManager.push(`synced line ${oldline} (${formatTimestamp(newtime)})`)
}
function handleBackButtonClick() {
	s.syncCaretWithAudio = false
	if (!s.waveformRef) {
		return console.log("nuh uh")
	}
	let newline
	newline = s.currentCaretLine + getOffsetToLastLyric()
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
	newline = s.currentCaretLine + getOffsetToNextLyric()
	if (newline < 0) newline = 0
	if (newline >= s.lyrics.length) newline = s.lyrics.length - 1
	s.currentCaretLine = newline
	scrollLineIntoView(s.currentCaretLine)
	s.waveformRef.updateSelectedRegions()
}

function handleBlankButtonClick() {
	const line = s.currentCaretLine
	const time = s.audioTime - $preferences.syncDelayMs

	s.lyrics.splice(line, 0, { text: "", time })
	gotoNextLine()

	cleanAndSort()

	s.waveformRef?.updateRegions()

	historyManager.push(`added blank line line ${line} (${formatTimestamp(time)})`)
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
			onblur={handleBlur}
			onclick={handleInput}
			onkeyup={handleInput}
			oninput={handleInput}
			onscroll={handleTextAreaScroll}
			onwheelcapture={handleWheel}
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

		<div class="lyricsboxcontainer" bind:this={lyricsBoxElement} onscroll={handleLyricsBoxScroll} onwheelcapture={handleWheel}>
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
    flex: 1;

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
