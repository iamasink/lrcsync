import { s } from "./state.svelte"

/**
 * Represents a single line of lyrics.
 */
export interface LyricLine {
	/**
	 * The text content of the lyric line.
	 */
	text: string

	/**
	 * The time at which this lyric line should be displayed (in ms).
	 */
	time: number
}
/**
 * Metadata tags for an LRC file.
 */
export interface Metadata {
	/** Title of the song */
	ti?: string
	/** Artist performing the song */
	ar?: string
	/** Album the song is from */
	al?: string
	/** Author of the song */
	au?: string
	/** Lyricist of the song */
	lr?: string
	/** Length of the song in mm:ss format, e.g., "03:45" */
	length?: string
	/** Author of the LRC file (not the song) */
	by?: string
	/** Global offset for lyric times in milliseconds, +/- */
	offset?: `+${number}` | `-${number}` | string
	/** Tool that created the LRC file */
	re?: string
	/** Version of the program */
	ve?: string
}



export function parseLRC(content: string): { lyrics: LyricLine[]; meta: Metadata } {
	const meta: Metadata = {}
	const lyrics: LyricLine[] = []

	const lines = content.split("\n")

	for (const line of lines) {
		const metaMatch = line.match(/^\[(\w+):(.*)\]$/)
		if (metaMatch) {
			const [, key, value] = metaMatch

			switch (key.toLowerCase()) {
				case "ti":
					meta.ti = value.trim()
					break
				case "ar":
					meta.ar = value.trim()
					break
				case "al":
					meta.al = value.trim()
					break
				case "au":
					meta.au = value.trim()
					break
				case "by":
					meta.by = value.trim()
					break
				case "lr":
					meta.lr = value.trim()
					break
				case "offset":
					meta.offset = value.trim()
					break
				case "re":
					meta.re = value.trim()
					break
				case "ve":
					meta.ve = value.trim()
					break
			}
			continue
		}

		const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
		if (match) {
			const [, m, s, ms, text] = match
			lyrics.push({
				time:
					60 * 1000 * parseInt(m) +
					1000 * parseInt(s) +
					// hundredths
					10 * parseInt(ms),
				text: text.trim()
			})
		} else {
			lyrics.push({
				time: -1,
				text: line.trim()
			})
		}
	}

	return { lyrics, meta }
}

export function exportLRC(lines: LyricLine[]) {

	return lines.map(({ time, text }) => {
		const timeInSeconds = time / 1000

		if (time === null || time === undefined || time === -1 || timeInSeconds < 0) {
			return text
		}

		const minutes = Math.floor(timeInSeconds / 60)
		const seconds = timeInSeconds % 60
		const wholeSeconds = Math.floor(seconds)
		const centiseconds = Math.round((seconds - wholeSeconds) * 100)

		const formattedMinutes = minutes.toString().padStart(2, "0")
		const formattedSeconds = wholeSeconds.toString().padStart(2, "0")
		const formattedCentiseconds = centiseconds.toString().padStart(2, "0")

		return `[${formattedMinutes}:${formattedSeconds}.${formattedCentiseconds}] ${text}`
	}).join("\n")
}

export function exportWithMetadata(lines: LyricLine[]) {
	const lyricstext = exportLRC(lines)
	const metadata = s.metadata ?? {}
	let final = ""

	for (const key of Object.keys(metadata) as (keyof Metadata)[]) {
		const value = metadata[key]
		if (value) final += `[${key}:${value}]\n`
	}

	final += `\n`
	final += lyricstext

	return final
}



/**
 * Formats a time value into MM:SS.SS format.
 *
 * @param t - Time value in milliseconds.
 * @returns Formatted time string (MM:SS.SS).
 */
export function formatTime(t: number) {
	if (t == -1) return ``

	if (!Number.isFinite(t) || t < 0) t = 0
	const m = Math.floor(t / 60000)
		.toString()
		.padStart(2, "0")
	const s = Math.floor((t % 60000) / 1000)
		.toString()
		.padStart(2, "0")
	const cs = Math.floor((t % 1000) / 10) // centiseconds
		.toString()
		.padStart(2, "0")
	return `${m}:${s}.${cs}`
}


export function formatLine(l: { time: number; text: string }) {
	if (l.time !== null && l.time != -1) {
		return `[${formatTime(l.time)}] ${l.text}`
	} else {
		return `${l.text}`
	}
}

export function sortLines(lines: LyricLine[]) {
	// maybe we can modify this function to sort without all lines having timestamps at some point


	return allHaveTimestamps(lines)
		? lines.sort((a, b) => a.time - b.time)
		: lines
}

export function allHaveTimestamps(lines: LyricLine[]) {
	return lines.every(line =>
		line.time !== null && line.time !== undefined && line.time !== -1 && line.time >= 0
	)
}


export function roundTimestamp(num: number) {
	return Math.round((num + Number.EPSILON) * 100) / 100
}