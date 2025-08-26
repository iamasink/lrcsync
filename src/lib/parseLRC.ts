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

export function parseLRC(content: string): LyricLine[] {
	const lines = content.split("\n").map(line => {
		const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
		if (match) {
			const [, m, s, ms, text] = match
			return {
				time:
					60 * 1000 * parseInt(m) +
					1000 * parseInt(s) +
					// hundredths
					10 * parseInt(ms),
				text: text.trim()
			}
		} else {
			return {
				time: -1,
				text: line.trim()
			}
		}
	}).filter(line => line != null) as LyricLine[]

	// const allHaveTimestamps = lines.every(line =>
	// 	line.time !== null && line.time !== undefined && line.time !== -1 && line.time >= 0
	// )

	// return allHaveTimestamps
	// 	? lines.sort((a, b) => a.time - b.time)
	// 	: lines

	return lines
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

	const allHaveTimestamps = lines.every(line =>
		line.time !== null && line.time !== undefined && line.time !== -1 && line.time >= 0
	)

	return allHaveTimestamps
		? lines.sort((a, b) => a.time - b.time)
		: lines
}


export function roundTimestamp(num: number) {
	return Math.round((num + Number.EPSILON) * 100) / 100
}