<script lang="ts">
import { getBeatFromCurrentTime, getBeatFromTime, getTimeAtBeat } from "$lib/bpm"
import Button from "$lib/components/Button.svelte"
import KeybindButton from "$lib/components/KeybindButton.svelte"
import { historyManager } from "$lib/history.svelte"
import { cleanup, roundTimestamp, sortLines, stripBadStuff } from "$lib/parseLRC"
import { scrollLineIntoView } from "$lib/scroll"
import { s } from "$lib/state.svelte"
import { clamp } from "$lib/utils"

const shiftMulti = 1 / 10
const ctrlMulti = 10

let multiplier = $derived(1 * (s.modkeysHeld.shift ? shiftMulti : 1) * (s.modkeysHeld.ctrl ? ctrlMulti : 1))
let stepbuttonvalue = $derived(0.1 * multiplier)
let fastforwardbuttonvalue = $derived(1 * multiplier)
let beatstepbuttonvalue = $derived(1 * (s.modkeysHeld.shift ? 4 : 1))

function handleNextButtonClick() {
	// try to move forward until a valid line is found
	const lastLine = s.currentAudioLine
	const currLine = s.currentAudioLine + 1
	let i = currLine
	while (i < s.lyrics.length && (s.lyrics[i].time == null || s.lyrics[i].time == -1)) {
		i++
	}

	if (i < s.lyrics.length) {
		const time = s.lyrics[i].time
		s.waveformRef?.seekToTime(time / 1000)
		scrollLineIntoView(i)
		s.waveformRef?.updateSelectedRegions([lastLine, currLine])
		s.currentAudioLine = i
	}
}

function handlePrevButtonClick() {
	// try to move backward until a valid line is found
	const lastLine = s.currentAudioLine
	const currLine = s.currentAudioLine - 1
	let i = currLine
	while (i >= 0 && (s.lyrics[i].time == null || s.lyrics[i].time == -1)) {
		i--
	}

	if (i >= 0) {
		const time = s.lyrics[i].time
		s.waveformRef?.seekToTime(time / 1000)
		scrollLineIntoView(i)
		s.waveformRef?.updateSelectedRegions([lastLine, currLine])
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

function handleAdjustClickBeat(offsetBeats: number, beatDivision: number = 1) {
	const line = s.lyrics[s.currentAudioLine]
	const lineIndex = s.currentAudioLine

	if (!line || line.time === -1) {
		console.warn("No valid line selected")
		return
	}

	console.log("beatDivision = ", beatDivision, "offsetBeats = ", offsetBeats)
	if (!s.useBPM) {
		console.warn("BPM not set, cannot adjust by beat")
		return
	}
	const bpm = s.audioBPM || 60
	const beatIntervalMs = (60 * 1000) / bpm / beatDivision
	const lineTimeMs = line.time
	if (lineTimeMs === -1) {
		console.warn("Current line has no timestamp, cannot adjust by beat")
		return
	}

	// if not close to a beat, snap to the closest next/prev beat, otherwise snap to the next/prev
	const lineBeat = getBeatFromTime(lineTimeMs) * beatDivision
	console.log("lineTimeMs = ", lineTimeMs, "ms, lineBeat = ", lineBeat, "beats, offsetBeats = ", offsetBeats, "beats, beatIntervalMs = ", beatIntervalMs, "ms")
	console.log("timeatbeat ", getTimeAtBeat(lineBeat), "ms")

	if (offsetBeats === 0) return
	// if were on a beat
	if (Math.abs(lineBeat - Math.round(lineBeat)) < 0.01) {
		// move to the next/prev beat
		const newLineBeat = Math.round(lineBeat) + offsetBeats
		const newTime = Math.round(getTimeAtBeat(newLineBeat / beatDivision))
		adjustSelectedLine((newTime - lineTimeMs) / 1000)
		historyManager.pushDebounced(`adjusted line ${s.currentAudioLine} by ${offsetBeats} beats`, { offset: (newTime - lineTimeMs) / 1000 })
	} else {
		// snap to the closest next/prev beat
		if (offsetBeats > 0) {
			const nextBeat = Math.ceil(lineBeat)
			const newTime = Math.round(getTimeAtBeat(nextBeat / beatDivision))
			// adjustSelectedLine((newTime - lineTimeMs) / 1000)
			adjustLineSpecific(lineIndex, newTime)
			historyManager.pushDebounced(`adjusted line ${s.currentAudioLine} to next beat`, { offset: (newTime - lineTimeMs) / 1000 })
		} else {
			const prevBeat = Math.floor(lineBeat)
			const newTime = Math.round(getTimeAtBeat(prevBeat / beatDivision))
			// adjustSelectedLine((newTime - lineTimeMs) / 1000)
			adjustLineSpecific(lineIndex, newTime)
			historyManager.pushDebounced(`adjusted line ${s.currentAudioLine} to previous beat`, { offset: (newTime - lineTimeMs) / 1000 })
		}
	}
}

function adjustLineSpecific(lineIndex: number, timeMs: number) {
	if (lineIndex < 0 || lineIndex >= s.lyrics.length) {
		console.warn("invalid line index")
		return
	}

	s.lyrics[lineIndex].time = timeMs
	if (s.waveformRef) {
		s.waveformRef.seekToTime(timeMs / 1000)
		s.waveformRef.updateSelectedRegions([lineIndex])
	}
	console.log(`adjusted line ${lineIndex} to ${timeMs}ms`)
}

function adjustSelectedLine(offsetSec: number) {
	if (s.currentAudioLine < 0 || s.currentAudioLine >= s.lyrics.length) {
		console.warn("No valid line selected")
		return
	}

	const targetLine = s.lyrics[s.currentAudioLine]
	const targetLineIndex = s.currentAudioLine

	if (!targetLine || targetLine.time === -1) return

	let prevTime = 0
	for (let i = targetLineIndex - 1; i >= 0; i--) {
		if (s.lyrics[i].time !== -1) {
			prevTime = s.lyrics[i].time
			break
		}
	}

	let nextTime = Infinity
	for (let i = targetLineIndex + 1; i < s.lyrics.length; i++) {
		if (s.lyrics[i].time !== -1) {
			nextTime = s.lyrics[i].time
			break
		}
	}

	// we might want a minimum time because otherwise the ui becomes fiddle and/or unusable
	// but maybe thats limiting? particularly if we want the lyrics to start immediately
	// for now idk
	let minLineTime = targetLine.text ? 100 : 10
	if (targetLineIndex <= 1) {
		minLineTime = 10
	}
	// const newTime = Math.max(prevTime + minLineTime, Math.min(nextTime, targetLine.time + (offset * 1000)))
	const newTime = clamp(
		targetLine.time + (offsetSec * 1000),
		prevTime + minLineTime,
		nextTime - minLineTime,
	)

	adjustLineSpecific(targetLineIndex, newTime)
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
			onclick={() => s.waveformRef?.seekToTime((s.audioTimeMs / 1000) - fastforwardbuttonvalue)}
			title={`Go back ${fastforwardbuttonvalue}s`}
			shortcut={{ key: "left" }}
			ignoremods={true}
		>
			-{fastforwardbuttonvalue}s
		</KeybindButton>

		<KeybindButton
			onclick={() => s.waveformRef?.seekToTime((s.audioTimeMs / 1000) + fastforwardbuttonvalue)}
			title={`Fastforward ${fastforwardbuttonvalue}s`}
			shortcut={{ key: "right" }}
			ignoremods={true}
		>
			+{fastforwardbuttonvalue}s
		</KeybindButton>

		<KeybindButton title={"Move the audio to the start of next line"} onclick={handleNextButtonClick} shortcut={{ key: "down" }}>next line</KeybindButton>
		<KeybindButton title={"Move the audio to the start of previous line"} onclick={handlePrevButtonClick} shortcut={{ key: "up" }}>prev line</KeybindButton>

		<KeybindButton
			onclick={() => s.waveformRef?.seekToTime((s.audioTimeMs / 1000) - 0.001)}
			disabled={s.currentCaretLine < 0}
			title={`Move back by 1ms`}
			shortcut={{ key: "," }}
			ignoremods={true}
		>
			,
		</KeybindButton>
		<KeybindButton
			onclick={() => s.waveformRef?.seekToTime((s.audioTimeMs / 1000) + 0.001)}
			disabled={s.currentCaretLine < 0}
			title={`Move forward by 1ms`}
			shortcut={{ key: "." }}
			ignoremods={true}
		>
			.
		</KeybindButton>
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
		<KeybindButton
			onclick={(e) => handleAdjustClickBeat(-1, beatstepbuttonvalue)}
			disabled={s.currentCaretLine < 0}
			title={`Move currently playing line earlier by -1/${beatstepbuttonvalue}`}
			shortcut={{ key: "1" }}
			ignoremods={true}
		>
			-{beatstepbuttonvalue}
		</KeybindButton>

		<KeybindButton
			onclick={(e) => handleAdjustClickBeat(1, beatstepbuttonvalue)}
			disabled={s.currentCaretLine < 0}
			title={`Move currently playing line later by 1/${beatstepbuttonvalue} `}
			shortcut={{ key: "2" }}
			ignoremods={true}
		>
			+{beatstepbuttonvalue}
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
