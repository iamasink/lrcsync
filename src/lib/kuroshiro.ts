
// import { Kuroshiro, KuroshiroAnalyzerKuromoji, Kuromoji } from "kuroshiro-browser"
import { Kuroshiro, KuroshiroAnalyzerKuromoji } from "kuroshiro-browser"
import { s } from "./state.svelte"
import { replaceReading } from "./furigana"

let kuroshiro: Kuroshiro
let ready: Promise<void> | null = null

let analyzer: KuroshiroAnalyzerKuromoji



export function initKuroshiro(): Promise<void> {
	if (ready) {
		return ready
	}

	console.log("readying kuroshiro")
	ready = (async () => {
		const IS_PROD = (import.meta.env.MODE == 'production')
		console.log("is prod?", IS_PROD)
		kuroshiro = await Kuroshiro.buildAndInitWithKuromoji(true)

	})()

	return ready
}

export async function getKuroshiro() {
	initKuroshiro()
	return kuroshiro
}



export async function convert(text: string): Promise<string> {
	await initKuroshiro()

	if (!analyzer) {
		analyzer = new KuroshiroAnalyzerKuromoji()
		await analyzer.init()
	}
	console.log(text, " -> \n", await analyzer.parse(text))


	const toconvert =
		replaceReading(
			text.normalize("NFC")
		)

	const converted = await kuroshiro.convert(
		toconvert,
		{ to: "romaji", mode: "spaced" }
	)
	const cleaned = doreplacements(converted)

	// only output converted if there are real changes
	if (stripIgnorable(cleaned) === stripIgnorable(text)) {
		return text
	}

	const final = cleaned
		.replace(/([A-Za-z]+) ?々/g, "$1$1")



	return final
}
function doreplacements(input: string): string {
	let output = input

	output = output.replaceAll(/([aeiou])　?っ　?([bcdfghjklmnpqrstvwxyz])/gi, "$1$2$2")
	output = output.replaceAll(/a　?ー/gi, "ā　")
	output = output.replaceAll(/i　?ー/gi, "ī　")
	output = output.replaceAll(/u　?ー/gi, "ū　")
	output = output.replaceAll(/e　?ー/gi, "ē　")
	output = output.replaceAll(/o　?ー/gi, "ō　")
	output = output.replaceAll(/(\w)　([n])　/g, "$1　$2")
	output = output.replaceAll(/　?っ/gi, "'")
	output = output.replaceAll(/　?〜　?/gi, "~")
	output = output.replaceAll(/　?~　?/gi, "~")
	output = output.replaceAll(/　,　/gi, ",　")

	const punctuation = "!?！？"

	const replacements: [RegExp | string, string][] = [
		[/　([!?！？])　/gu, "$1　"],  // no space before punctuation
		[/　([!?！？])/gu, "$1"],  // no space before punctuation
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