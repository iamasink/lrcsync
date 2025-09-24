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

		// const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
		const match = line.match(/\[(\d+):(\d+)(?:\.(\d+))?\](.*)/)
		if (match) {
			const [, m, s, ms = "00", text] = match
			const msNum = parseInt(ms)

			// normalize to milliseconds
			let msFinal
			if (ms.length === 1) msFinal = msNum * 100   // 0.1 deciseconds
			else if (ms.length === 2) msFinal = msNum * 10   // 0.01 centiseconds
			else if (ms.length === 3) msFinal = msNum * 1   // 0.01 centiseconds
			else {
				console.log("weird timestamp!!")
				lyrics.push({ time: -1, text: line.trim() })
				continue
			}


			lyrics.push({
				time:
					60 * 1000 * parseInt(m) +
					1000 * parseInt(s) +
					// hundredths
					msFinal,
				text: text.trim()
			})
		} else {
			lyrics.push({
				time: -1,
				text: line.trim()
			})
		}
	}



	// for (const [index, line] of lyrics.entries()) {
	// 	console.log(index, line)

	// 	// all empty lines, without a timestamp will take on the next line's time
	// 	if (line.time === -1 && line.text == "" && index != lyrics.length - 1 && index != 0) {
	// 		const nextlyric = lyrics[index + 1]
	// 		if (nextlyric.time != -1 && nextlyric.text != "") {
	// 			line.time = nextlyric.time - 10
	// 		}
	// 	}
	// }

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

		const round = (n: number, mult: number = 100) => {
			return Math.round(n * mult) / mult
		}
		const formattedMinutes = round(minutes).toString().padStart(2, "0")
		const formattedSeconds = round(wholeSeconds).toString().padStart(2, "0")
		const formattedCentiseconds = round(centiseconds).toString().padStart(2, "0")

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
 * @param time - Time value in milliseconds.
 * @returns Formatted time string (MM:SS.SS).
 */
export function formatTime(time: number) {
	if (time == -1) return ``

	if (!Number.isFinite(time) || time < 0) time = 0
	const m = Math.floor(time / 60000)
		.toString()
		.padStart(2, "0")
	const s = Math.floor((time % 60000) / 1000)
		.toString()
		.padStart(2, "0")
	const cs = Math.floor((time % 1000) / 10) // centiseconds
		.toString()
		.padStart(2, "0")
	return `${m}:${s}.${cs}`
}

export function formatTimestamp(time: number) {
	if (time == -1) return ``
	return `[${formatTime(time)}]`
}


export function formatLine(l: { time: number; text: string }) {
	if (l.time !== null && l.time != -1) {
		return `[${formatTime(l.time)}] ${l.text}`
	} else {
		return `${l.text}`
	}
}

export function sortLines(lines: LyricLine[]): LyricLine[] {
	// lines with timestamps
	const timestamped: LyricLine[] = lines.filter(l => l.time !== -1)

	timestamped.sort((a, b) => (a.time! - b.time!))

	const result: LyricLine[] = []
	let tsIndex = 0

	for (const line of lines) {
		if (line.time !== -1) {
			result.push(timestamped[tsIndex++])
		} else {
			result.push(line) // keep non-timestamped lines in place
		}
	}

	return result
}

export function cleanup(lines: LyricLine[]): LyricLine[] {
	const regex = /\[(Pre-|Post-)?(Chorus|Bridge|Verse|Intro|Outro|Break|Instrumental)( \d*)?\]/gi
	const result: LyricLine[] = []

	for (const line of lines) {
		const match = line.text.match(regex)
		if (match) {
			result.push({ time: -1, text: "" })
		} else {
			result.push(line)
		}
	}

	// now cleanup any double lines
	const cleaned: LyricLine[] = []

	for (const [index, line] of result.entries()) {
		if (line.text == "") {
			if (cleaned.at(-1)?.text == "") {
				continue
			}
		}
		cleaned.push(line)
	}

	console.log(cleaned)
	return cleaned
}

export function allHaveTimestamps(lines: LyricLine[]) {
	return lines.every(line =>
		line.time !== null && line.time !== undefined && line.time !== -1 && line.time >= 0
	)
}


export function roundTimestamp(num: number) {
	return Math.round((num + Number.EPSILON) * 100) / 100
}