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
	return content.split("\n").map(line => {
		const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/)
		if (!match) return null
		const [, m, s, ms, text] = match
		return {
			time:
				60 * 1000 * parseInt(m) +
				1000 * parseInt(s) +
				// hundredths
				10 * parseInt(ms),
			text: text.trim()
		}
	}).filter(line => line != null)
}

export function exportLRC(lines: { time: number; text: string }[]) {
	return lines.map(({ time, text }) => {
		const m = Math.floor(time / 60).toString().padStart(2, "0")
		const s = Math.floor(time % 60).toString().padStart(2, "0")
		return `[${m}:${s}.${(time % 1).toFixed(2)}] ${text}`
	}).join("\n")
}


/**
 * Formats a time value into MM:SS.SS format.
 *
 * @param t - Time value in milliseconds.
 * @returns Formatted time string (MM:SS.SS).
 */
export function formatTime(t: number) {
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
	return `[${formatTime(l.time)}] ${l.text}`
}