import { guess } from "web-audio-beat-detector"
import { s } from "./state.svelte"

export function getBeatFromCurrentTime() {
	const timeMs = s.audioTimeMs
	return getBeatFromTime(timeMs)
}

export function getBeatFromTime(timeMs: number) {
	const offsetMs = s.audioBPMOffsetMs ?? 0
	const bpm = s.audioBPM ?? 60
	const beatpersecond = bpm / 60

	return ((timeMs - offsetMs) / 1000) * beatpersecond
}

export function getTimeAtBeat(beat: number) {
	const offsetMs = s.audioBPMOffsetMs ?? 0
	const bpm = s.audioBPM ?? 60
	const beatpersecond = bpm / 60

	return (beat * 1000) / beatpersecond + offsetMs
}

export function getBPS() {
	const bpm = s.audioBPM ?? 60
	const beatpersecond = bpm / 60

	return beatpersecond
}

export function getBPM() {
	return s.audioBPM ?? 60
}

export async function guessTempo(min: number, max: number): Promise<{ bpm: number; offset: number } | null> {
	let wavesurfer = s.waveformRef?.getWavesurfer()
	if (!wavesurfer) return null
	console.log("guessing bpm, offset...")
	const mediael = wavesurfer.getMediaElement() as any
	console.log(mediael)
	const buffer = mediael.buffer
	try {
		const { bpm, offset } = await guess(buffer, { minTempo: min, maxTempo: max })
		const offsetms = offset * 1000
		console.log(`guessed bpm ${bpm} and offset ${offsetms}ms`)
		s.audioBPM = bpm
		s.audioBPMOffsetMs = Math.round(offsetms)
		return { bpm, offset: offsetms }
	} catch (err) {
		console.error(err)
		return null
	} finally {
	}
}
