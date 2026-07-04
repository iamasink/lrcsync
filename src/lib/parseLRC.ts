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
	if (content.trim() === "") {
		return { lyrics: [], meta: {} }
	}

	const meta: Metadata = {}
	const lyrics: LyricLine[] = []
	const lines = content.split("\n")
	const metaRegex = /^\[(ti|ar|al|au|by|re|ve|offset|length|lr):(.*)\]$/i
	let lastWasMeta = false

	for (const [index, line] of lines.entries()) {
		if (index === 0 && (line.trim() === "" || line.trim() === "[00:00.00]")) {
			console.log("ignoring empty line")
			continue
		}

		const metaMatch = line.match(metaRegex)
		if (metaMatch) {
			const [, key, value] = metaMatch
			switch (key.toLowerCase()) {
				case "ti": meta.ti = value.trim(); break
				case "ar": meta.ar = value.trim(); break
				case "al": meta.al = value.trim(); break
				case "au": meta.au = value.trim(); break
				case "by": meta.by = value.trim(); break
				case "lr": meta.lr = value.trim(); break
				case "offset": meta.offset = value.trim(); break
				case "re": meta.re = value.trim(); break
				case "ve": meta.ve = value.trim(); break
				case "length": meta.length = value.trim(); break
				default: // should be unreachable cuz regex
			}
			lastWasMeta = true
			continue
		}

		const timestampRegex = /\[(\d+):(\d+)(?:\.(\d+))?\]/g
		const timestamps: number[] = []
		let match
		let lastIndex = 0

		// this goes over each case cuz funny regex thing
		while ((match = timestampRegex.exec(line)) !== null) {
			const [, m, s, ms = "00"] = match
			const msNum = parseInt(ms)

			// normalize to milliseconds
			let msFinal
			if (ms.length === 1) msFinal = msNum * 100
			else if (ms.length === 2) msFinal = msNum * 10
			else if (ms.length === 3) msFinal = msNum * 1
			else {
				console.log("weird timestamp!!")
				lyrics.push({ time: -1, text: line.trim() })
				continue
			}

			timestamps.push(
				60 * 1000 * parseInt(m) +
				1000 * parseInt(s) +
				msFinal
			)
			lastIndex = match.index + match[0].length
		}

		const text = line.substring(lastIndex).trim()

		// skip empty lines immediately after metadata
		if (text === "" && timestamps.length === 0) {
			if (lastWasMeta) {
				lastWasMeta = false
				continue
			}
		}

		lastWasMeta = false

		if (timestamps.length > 0) {
			for (const time of timestamps) {
				lyrics.push({ time, text })
			}
		} else {
			lyrics.push({
				time: -1,
				text: text
			})
		}
	}

	if (lyrics[0].text != "" || lyrics[0].time != 0) {
		lyrics.unshift({ text: "", time: 0 })
	}

	console.log("meta: ", meta)

	return { lyrics, meta }
}

export function exportLRC(lines: LyricLine[], forMetadata = false) {
	return lines.map(({ time, text }) => {
		if (forMetadata && time === 0 && text === "") return // skip beginning empty line

		if (time === null || time === undefined || time === -1 || time < 0) {
			return text
		}

		const timestamp = formatTimestamp(time)
		return `${timestamp} ${text}`
	}).filter(line => line !== undefined).join("\n")
}

export function exportWithMetadata(lines: LyricLine[]) {
	const lyricstext = exportLRC(lines, true)
	const metadata = s.metadata ?? {}
	let final = ""

	const preferredOrder: (keyof Metadata | "#")[] = [
		"ti",       // Title
		"ar",       // Artist
		"al",       // Album
		"au",       // Author
		"lr",       // Lyricist
		"length",   // Length of the song
		"by",       // LRC file author
		"offset",   // Timing offset
		"re",       // Program/tool
		"ve",       // Program version
		"#"         // Comment marker
	]

	const allKeys = Object.keys(metadata) as (keyof Metadata)[]
	const sortedKeys = allKeys.sort((a, b) => {
		const ai = preferredOrder.indexOf(a)
		const bi = preferredOrder.indexOf(b)
		if (ai === -1 && bi === -1) return a.localeCompare(b)
		if (ai === -1) return 1
		if (bi === -1) return -1
		return ai - bi
	})

	for (const key of sortedKeys) {
		const value = metadata[key]
		if (value) final += `[${key}:${value}]\n`
	}

	final += `\n` + lyricstext
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

	// round to nearest 10 ms
	time = Math.round(time / 10) * 10

	const m = Math.floor(time / 60000).toString().padStart(2, "0")
	const s = Math.floor((time % 60000) / 1000).toString().padStart(2, "0")
	const cs = Math.floor((time % 1000) / 10).toString().padStart(2, "0") // centiseconds

	return `${m}:${s}.${cs}`
}

// rounds to nearest 10ms
export function toCentiseconds(timeMs: number) {
	if (!Number.isFinite(timeMs) || timeMs < 0) timeMs = 0
	// round to nearest 10 ms
	timeMs = Math.round(timeMs / 10) * 10
	return timeMs
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

export function cleanup(lines: LyricLine[], force = false): LyricLine[] {
	const cleaned: LyricLine[] = []

	// cleanup any double empty lines
	for (const line of lines) {
		if (line.text === "" && line.time === -1) {
			const last = cleaned.at(-1)
			if (last && last.time === -1 && last.text === "") {
				continue
			}
		}
		cleaned.push(line)
	}

	// now swap order of blanks so timed comes first: 
	// [-1] blank, [timed] blank -> [timed] blank, [-1] blank
	for (let i = 0; i < cleaned.length - 1; i++) {
		if (
			cleaned[i].time === -1 &&
			cleaned[i].text === "" &&
			cleaned[i + 1].time !== -1 &&
			cleaned[i + 1].text === ""
		) {
			const temp = cleaned[i]
			cleaned[i] = cleaned[i + 1]
			cleaned[i + 1] = temp
		}
	}

	return cleaned
}

export function stripTags(lines: LyricLine[]) {
	let regex: RegExp

	regex = /\[ ?(Pre-|Post-)?(Chorus|Choruses|Cho|Bridge|Bridges|Br\.?|Verse|Verses|V\.?|Intro|Int\.?|Outro|Out\.?|Break|Instrumental|Instr\.?|Refrain|Interlude|Interl\.?|Drop|Hook|Build|Solo|Theme|Part|Section|Sec\.?)\.?( \.?\d*)? ?(:.*|\(.*\))?\]$/i

	return lines.map(line => {
		if (regex.test(line.text)) return { time: -1, text: "" }
		return {
			...line,
			text: line.text.replace(regex, "").trim()
		}
	})


}

export function stripBadCharacters(lines: LyricLine[]) {
	return lines.map(line => {
		return {
			...line,
			text: line.text
				.replaceAll("‘", "'")
				.replaceAll("’", "'")
				.replaceAll("“", "\"")
				.replaceAll("”", "\"")
				.replaceAll("‚", ",")
				.replaceAll("‛", "'")
				.replaceAll("‵", "'")
				.replaceAll("‶", "\"")
				.replaceAll("‷", "\"")
				.replaceAll("′", "'")
		}
	})
}

export function stripAll(lines: LyricLine[]) {
	return stripBadCharacters(stripTags(lines))
}

export function cleanAndSort() {
	const lyrics = s.lyrics
	const cleanedLyrics = cleanup(lyrics)
	const sortedLyrics = sortLines(cleanedLyrics)
	s.lyrics = sortedLyrics
	// return sortedLyrics
}

export function allHaveTimestamps(lines: LyricLine[]) {
	return lines.every(line =>
		line.time !== null && line.time !== undefined && line.time !== -1 && line.time >= 0
	)
}

export function roundTimestamp(time: number): number {
	return Math.round((time + Number.EPSILON) * 100) / 100
}

/** Returns the offset to next non-empty lyric. */
export function getOffsetToNext(lines: LyricLine[], currentIndex: number, limit = 3): number {
	let offset = 1
	for (let i = 0; i < limit; i++) {
		const lyric = lines[currentIndex + offset]
		if (!lyric) return 1
		if (lyric.text === "") {
			offset++
		} else {
			return offset
		}
	}
	return 1
}

/** Returns the offset to next non-empty, timed lyric. */
export function getOffsetToNextTimed(lines: LyricLine[], currentIndex: number, limit = 3): number {
	let offset = 1
	for (let i = 0; i < limit; i++) {
		const lyric = lines[currentIndex + offset]
		if (!lyric) return 1
		if (lyric.time == -1) {
			offset++
		} else {
			return offset
		}
	}
	return 1
}
/** Returns the offset to last non-empty, timed lyric. */
function getOffsetToLast(lines: LyricLine[], currentIndex: number, limit = 3): number {
	let offset = -1
	for (let i = 0; i < limit; i++) {
		const lyric = lines[currentIndex + offset]
		if (!lyric) return 0
		if (lyric.text === "") {
			offset--
		} else {
			return offset
		}
	}
	return 1
}

// naming hell <3

/** Returns offset to next lyric from current caret line */
export function getOffsetToNextLyric() {
	return getOffsetToNext(s.lyrics, s.currentCaretLine)
}
/** Returns offset to last lyric from current caret line */
export function getOffsetToLastLyric() {
	return getOffsetToLast(s.lyrics, s.currentCaretLine)
}