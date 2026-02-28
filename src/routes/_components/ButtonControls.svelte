<script lang="ts">
import Button from "$lib/components/Button.svelte"
import KeybindButton from "$lib/components/KeybindButton.svelte"
import { historyManager } from "$lib/history.svelte"
import { cleanup, sortLines, stripBadStuff } from "$lib/parseLRC"
import { scrollLineIntoView } from "$lib/scroll"
import { s } from "$lib/state.svelte"
import { clamp } from "$lib/utils"

let multiplier = $derived(1 * (s.modkeysHeld.shift ? 5 : 1) * (s.modkeysHeld.ctrl ? 10 : 1))
let stepbuttonvalue = $derived(0.01 * multiplier)
let fastforwardbuttonvalue = $derived(1 * multiplier)

function handleNextButtonClick() {
	// try to move forward until a valid line is found
	let i = s.currentAudioLine + 1
	while (i < s.lyrics.length && (s.lyrics[i].time == null || s.lyrics[i].time == -1)) {
		i++
	}

	if (i < s.lyrics.length) {
		const time = s.lyrics[i].time
		s.waveformRef?.seekToTime(time / 1000)
		scrollLineIntoView(i)
		s.waveformRef?.updateSelectedRegions()
		s.currentAudioLine = i
	}
}

function handlePrevButtonClick() {
	// try to move backward until a valid line is found
	let i = s.currentAudioLine - 1
	while (i >= 0 && (s.lyrics[i].time == null || s.lyrics[i].time == -1)) {
		i--
	}

	if (i >= 0) {
		const time = s.lyrics[i].time + 0.01
		s.waveformRef?.seekToTime(time / 1000)
		scrollLineIntoView(i)
		s.waveformRef?.updateSelectedRegions()
		s.currentAudioLine = i
	}
}

let clearButtonConfirm = $state(false)
let clearButtonTimeout: number | undefined
function handleClearButtonClick() {
	if (!clearButtonConfirm) {
		clearButtonConfirm = true
		clearButtonTimeout = window.setTimeout(() => {
			clearButtonConfirm = false
		}, 5000)
	} else {
		if (clearButtonTimeout) clearTimeout(clearButtonTimeout)
		s.lyrics = s.lyrics.map(line => ({ ...line, time: -1 }))
		historyManager.push("cleared all timestamps")
		clearButtonConfirm = false
	}
}

function handleAdjustClick(offsetSec: number, event: MouseEvent) {
	const adjustmentSec = offsetSec
	console.log(adjustmentSec)
	// total += Math.round(offset * 100)
	adjustSelectedLine(adjustmentSec)

	historyManager.pushDebounced(`adjusted line ${s.currentAudioLine}`, { offset: offsetSec })
}

function adjustSelectedLine(offsetSec: number) {
	if (s.currentAudioLine < 0 || s.currentAudioLine >= s.lyrics.length) {
		console.warn("No valid line selected")
		return
	}

	const targetLine = s.lyrics[s.currentAudioLine]

	if (!targetLine || targetLine.time === -1) return

	let prevTime = 0
	for (let i = s.currentAudioLine - 1; i >= 0; i--) {
		if (s.lyrics[i].time !== -1) {
			prevTime = s.lyrics[i].time
			break
		}
	}

	let nextTime = Infinity
	for (let i = s.currentAudioLine + 1; i < s.lyrics.length; i++) {
		if (s.lyrics[i].time !== -1) {
			nextTime = s.lyrics[i].time
			break
		}
	}

	const minLineTime = targetLine.text ? 100 : 10
	// const newTime = Math.max(prevTime + minLineTime, Math.min(nextTime, targetLine.time + (offset * 1000)))
	const newTime = clamp(
		targetLine.time + (offsetSec * 1000),
		prevTime + minLineTime,
		nextTime,
	)

	targetLine.time = newTime

	if (s.waveformRef) {
		s.waveformRef.updateRegions()
		s.waveformRef.seekToTime(newTime / 1000)
		s.waveformRef.play()
	}
}

function togglePlayPause() {
	if (s.waveformRef) {
		s.waveformRef.togglePlayPause()
	}
}
</script>
<div class="controls">
	<div>
		<KeybindButton onclick={togglePlayPause} shortcut={{ key: "Space" }}>
			{s.isAudioPlaying ? "Pause" : "Play"}
		</KeybindButton>
		<KeybindButton
			onclick={() => {
				if (s.lyrics[s.currentCaretLine].time != -1) s.waveformRef?.seekToTime(s.lyrics[s.currentCaretLine].time / 1000)
			}}
			shortcut={{ key: "w" }}
			title="Move the audio to the caret"
		>
			Play @ caret
		</KeybindButton>
		<KeybindButton
			onclick={() => s.waveformRef?.seekToTime(s.lyrics[s.currentAudioLine].time / 1000)}
			shortcut={{ key: "r" }}
			title="Move the audio to the start of current line"
		>
			Replay line
		</KeybindButton>
		<KeybindButton
			onclick={() => s.waveformRef?.seekToTime((s.audioTime / 1000) - fastforwardbuttonvalue)}
			title={`Go back ${fastforwardbuttonvalue}s`}
			shortcut={{ key: "left" }}
			ignoremods={true}
		>
			-{fastforwardbuttonvalue}s
		</KeybindButton>

		<KeybindButton
			onclick={() => s.waveformRef?.seekToTime((s.audioTime / 1000) + fastforwardbuttonvalue)}
			title={`Fastforward ${fastforwardbuttonvalue}s`}
			shortcut={{ key: "right" }}
			ignoremods={true}
		>
			+{fastforwardbuttonvalue}s
		</KeybindButton>

		<KeybindButton title={"Move the audio to the start of next line"} onclick={handleNextButtonClick} shortcut={{ key: "down" }}>next line</KeybindButton>
		<KeybindButton title={"Move the audio to the start of previous line"} onclick={handlePrevButtonClick} shortcut={{ key: "up" }}>prev line</KeybindButton>
	</div>
	<div>
		<KeybindButton
			onclick={(e) => handleAdjustClick(-stepbuttonvalue, e)}
			disabled={s.currentCaretLine < 0}
			title={`Move currently playing line earlier by -${stepbuttonvalue}s`}
			shortcut={{ key: "x" }}
			ignoremods={true}
		>
			-{stepbuttonvalue.toFixed(2)}s
		</KeybindButton>

		<KeybindButton
			onclick={(e) => handleAdjustClick(stepbuttonvalue, e)}
			disabled={s.currentCaretLine < 0}
			title={`Move currently playing line later by +${stepbuttonvalue}s`}
			shortcut={{ key: "c" }}
			ignoremods={true}
		>
			+{stepbuttonvalue.toFixed(2)}s
		</KeybindButton>

		<!--  -->

		<KeybindButton onclick={(e) => historyManager.undo()} title="Undo" shortcut={{ key: "z", ctrl: true }}>
			Undo
		</KeybindButton>
		<KeybindButton onclick={(e) => historyManager.redo()} title="Redo" shortcut={{ key: "z", ctrl: true, shift: true }}>
			Redo
		</KeybindButton>
	</div>
	<div>
		<Button
			onclick={() => {
				s.lyrics = sortLines(s.lyrics)
				historyManager.push("sorted lines")
			}}
			title="sort lines by timestamp"
		>
			Sort
		</Button>
		<Button
			onclick={() => {
				s.lyrics = cleanup(s.lyrics)
				historyManager.push("cleanup")
			}}
			title="cleanup"
		>
			Cleanup
		</Button>
		<Button
			onclick={() => {
				s.lyrics = stripBadStuff(s.lyrics)
				historyManager.push("strip tags")
			}}
			title="strip bad stuff from imports (eg: [chorus] tags, weird unicode, etc.)"
		>
			Strip
		</Button>
		<Button
			onclick={() => {
				handleClearButtonClick()
			}}
			title="Clear all existing timestamps"
		>
			{clearButtonConfirm ? "Really?" : "Clear"}
		</Button>
		<label><input type="checkbox" bind:checked={s.syncCaretWithAudio} disabled />lock caret</label>
	</div>
</div>
