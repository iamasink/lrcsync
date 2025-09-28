import { describe, it, expect, vi } from "vitest"
import {
	parseLRC,
	exportLRC,
	exportWithMetadata,
	formatTime,
	formatLine,
	sortLines,
	allHaveTimestamps,
	roundTimestamp,
	type LyricLine,
	cleanup
} from "./parseLRC"

// mock state.svelte metadata
vi.mock("./state.svelte", () => ({
	s: { metadata: { ti: "Song Title", ar: "Artist Name" } }
}))

describe("parseLRC", () => {
	it("parses metadata correctly", () => {
		const input = `[ti:My Song]\n[ar:Some Artist]\n`
		const { meta } = parseLRC(input)
		expect(meta.ti).toBe("My Song")
		expect(meta.ar).toBe("Some Artist")
	})

	it("parses lyrics with timestamps", () => {
		const input = "[00:10.50] First line\n[00:20.00] Second line"
		const { lyrics } = parseLRC(input)
		expect(lyrics).toEqual([
			{ time: 10500, text: "First line" },
			{ time: 20000, text: "Second line" }
		])
	})

	it("parses plain text lines", () => {
		const input = "No timestamp here"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: -1, text: "No timestamp here" })
	})



	// messed up stuff:



	it("handles missing milliseconds", () => {
		const input = "[01:23] Just minutes and seconds"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: (1 * 60 * 1000) + (23 * 1000), text: "Just minutes and seconds" })
		expect(exportLRC(lyrics)).toEqual(`[01:23.00] Just minutes and seconds`)
	})

	it("handles milliseconds instead of centiseconds", () => {
		const input = "[01:23.450] invalid milliseconds"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: (1 * 60 * 1000) + (23 * 1000) + (450), text: "invalid milliseconds" })
	})

	it("handles deciseconds", () => {
		const input = "[01:23.5] short"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: (1 * 60 * 1000) + (23 * 1000) + (500), text: "short" })
	})

	it("handles malformed timestamp", () => {
		const input = "[01:23.5000] weird"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: -1, text: "[01:23.5000] weird" })
	})

	it("handles malformed timestamps gracefully", () => {
		const input = "[ab:cd.ef] Not valid"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: -1, text: "[ab:cd.ef] Not valid" })
	})

	it("handles empty brackets", () => {
		const input = "[] Empty"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: -1, text: "[] Empty" })
	})

	it("treats line with only brackets as text", () => {
		const input = "[]"
		const { lyrics } = parseLRC(input)
		expect(lyrics[0]).toEqual({ time: -1, text: "[]" })
	})

	it("handles brackets with other information", () => {
		const input = `line1

[Chorus]
[00:01.00] chorusline
[00:02.00] [Part of lyric] is in brackets`

		const { lyrics } = parseLRC(input)

		expect(lyrics[0]).toEqual({ time: -1, text: "line1" })
		expect(lyrics[1]).toEqual({ time: -1, text: "" })
		expect(lyrics[2]).toEqual({ time: -1, text: "[Chorus]" })
		expect(lyrics[3]).toEqual({ time: 1000, text: "chorusline" })
		expect(lyrics[4]).toEqual({ time: 2000, text: "[Part of lyric] is in brackets" })
	})


	// // TODO: empty line timestamps(to show paragraphs)
	// it("handles empty lines", () => {
	// 	const input = `[00:07.39] But secretly, I'm- (hehe)

	// [00:09.74] うりゃ おい! うりゃ おい! Ooh, fighter!`
	// 	const { lyrics } = parseLRC(input)
	// 	expect(lyrics[1]).toEqual({ time: 9 * 1000 + 740 - 10, text: "" })
	// })


	it("outputs stably", () => {
		const input = `[00:12.30]line2


[00:17.49]
[00:19.61] line5`
		const { lyrics } = parseLRC(input)
		const first = lyrics
		const newtext = exportLRC(lyrics)
		const newlyrics = parseLRC(newtext).lyrics
		const second = newlyrics

		expect(first).toEqual(second)
	})
})


describe("exportLRC", () => {
	it("formats lines back to LRC", () => {
		const lines: LyricLine[] = [
			{ time: 10500, text: "First line" },
			{ time: 20000, text: "Second line" }
		]
		const output = exportLRC(lines)
		expect(output).toContain("[00:10.50] First line")
		expect(output).toContain("[00:20.00] Second line")
	})

	it("handles lines without timestamps", () => {
		const lines: LyricLine[] = [{ time: -1, text: "Untimed" }]
		const output = exportLRC(lines)
		expect(output).toEqual("Untimed")
	})
})

describe("exportWithMetadata", () => {
	it("includes metadata at top", () => {
		const lines: LyricLine[] = [{ time: 1000, text: "Line" }]
		const output = exportWithMetadata(lines)
		expect(output).toContain("[ti:Song Title]")
		expect(output).toContain("[ar:Artist Name]")
		expect(output).toContain("[00:01.00] Line")
	})
})

describe("format helpers", () => {
	it("formats time correctly", () => {
		expect(formatTime(10500)).toEqual("00:10.50")
		expect(formatTime(-1)).toEqual("")
	})

	it("formats lines with and without time", () => {
		expect(formatLine({ time: 10500, text: "Line" })).toEqual("[00:10.50] Line")
		expect(formatLine({ time: -1, text: "Line" })).toEqual("Line")
	})

	it("sortLines correctly", () => {
		const lines2: LyricLine[] = [
			{ time: 2000, text: "two" },
			{ time: 1000, text: "one" }
		]
		expect(sortLines(lines2).map(l => l.text)).toEqual(["one", "two"])


		const lines: LyricLine[] =
			[
				{ "time": 10500, "text": "one" },
				{ "time": -1, "text": "" },
				{ "time": -1, "text": "" },
				{ "time": 11500, "text": "three" },
				{ "time": -1, "text": "" },
				{ "time": 10600, "text": "two" }]


		expect(sortLines(lines).map(l => l.text)).toEqual(["one", "", "", "two", "", "three"])


		const mixed: LyricLine[] = [
			{ time: -1, text: "no time" },
			{ time: 1000, text: "has time" },
			{ time: -1, text: "no time too" },
		]
		expect(sortLines(mixed)).toEqual(mixed)
	})

	it("allHaveTimestamps works", () => {
		const all = [{ time: 1000, text: "a" }, { time: 2000, text: "b" }]
		expect(allHaveTimestamps(all)).toEqual(true)

		const mixed = [{ time: -1, text: "a" }]
		expect(allHaveTimestamps(mixed)).toEqual(false)
	})

	it("roundTimestamp rounds to 2 decimals", () => {
		expect(roundTimestamp(1.23456)).toEqual(1.23)
		expect(roundTimestamp(1.23567)).toEqual(1.24)
	})
})

describe("clean up", () => {
	it("cleans up [chorus] etc.", () => {
		const lines: LyricLine[] =
			[
				{ "time": 10000, "text": "[Chorus]" },
				{ "time": 12000, "text": "the chorus!" },
				{ "time": 14000, "text": "[Verse 1]" },
				{ "time": 16000, "text": "verse one.." },
				{ "time": -1, "text": "" },
				{ "time": -1, "text": "[Verse 2]" },
				{ "time": 20000, "text": "verse two?" }
			]
		const correctlines: LyricLine[] =
			[
				{ "time": -1, "text": "" },
				{ "time": 12000, "text": "the chorus!" },
				{ "time": -1, "text": "" },
				{ "time": 16000, "text": "verse one.." },
				{ "time": -1, "text": "" },
				{ "time": 20000, "text": "verse two?" }
			]

		expect(cleanup(lines)).toEqual(correctlines)
	})


	it("correctly swaps []blank; [time]blank to [time]blank; []blank", () => {
		const lines: LyricLine[] = [
			{ "time": 12000, "text": "text!" },
			{ "time": -1, "text": "" },
			{ "time": 17000, "text": "" },
			{ "time": -1, "text": "" },
			{ "time": 20000, "text": "text 2!" },
		]
		const correctlines: LyricLine[] = [
			{ "time": 12000, "text": "text!" },
			{ "time": 17000, "text": "" },
			{ "time": -1, "text": "" },
			{ "time": -1, "text": "" },
			{ "time": 20000, "text": "text 2!" },
		]

		expect(cleanup(lines)).toEqual(correctlines)
	})
})