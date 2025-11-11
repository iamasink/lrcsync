
// import { Kuroshiro, KuroshiroAnalyzerKuromoji, Kuromoji } from "kuroshiro-browser"
import { Kuroshiro } from "kuroshiro-browser"
import { s } from "./state.svelte"
import { stripFurigana } from "./furigana"

let kuroshiro: any = null
let analyser: any = null
let ready: Promise<void> | null = null

export function initKuroshiro(): Promise<void> {
	if (ready) return ready

	ready = (async () => {
		const IS_PROD = (import.meta.env.MODE == 'production')
		console.log("is prod?", IS_PROD)
		kuroshiro = await Kuroshiro.buildAndInitWithKuromoji(true)

	})()

	return ready
}

export async function convert(text: string): Promise<string> {
	await initKuroshiro()
	const converted = await kuroshiro.convert(
		stripFurigana(text),
		{ to: "romaji", mode: "spaced" }
	)
	const cleaned = normalize(converted)

	// only output converted if there are real changes
	if (stripIgnorable(cleaned) === stripIgnorable(text)) {
		return text
	}

	const final = cleaned
		.replace(/([A-Za-z]+) ?々/g, "$1$1")



	return final
}
function normalize(input: string): string {
	let output = input

	const replacements: [RegExp | string, string][] = [
		[/ (\p{P})/gu, "$1"],  // no space before punctuation
		// [/(\p{P}) /gu, "$1"],  // no space after punctuation
		["　", " "],           // fullwidth space to normal
		["    ", " "],       // collapse multiple spaces
		["   ", " "],       // collapse multiple spaces
		["  ", " "],       // collapse multiple spaces
	]

	for (const [pattern, replacement] of replacements) {
		if (pattern instanceof RegExp) {
			output = output.replace(pattern, replacement)
		} else {
			output = output.replaceAll(pattern, replacement)
		}
	}

	return output
}

function stripIgnorable(input: string): string {
	const ignoreChars = [" ", ",", "'", "’", "m", "n"]
	let output = input
	for (const ch of ignoreChars) {
		output = output.replaceAll(ch, "")
	}
	// console.log(input, "=>", output.toLowerCase())
	return output.toLowerCase()
}


export async function convertAll(lines: string[]): Promise<string[]> {
	if (s.convertedLyricsLang != "ja") return lines
	// console.log("converting..")
	await initKuroshiro()
	return Promise.all(lines.map(line => convert(line)))
}