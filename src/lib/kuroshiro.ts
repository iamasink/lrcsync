
// import { Kuroshiro, KuroshiroAnalyzerKuromoji, Kuromoji } from "kuroshiro-browser"
import { Kuroshiro } from "kuroshiro-browser"
import { s } from "./state.svelte"
import { replaceReading } from "./furigana"

let kuroshiro: Kuroshiro
let ready: Promise<void> | null = null



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

	// if (!analyzer) {
	// 	analyzer = new KuroshiroAnalyzerKuromoji()
	// 	await analyzer.init()
	// }
	// console.log(text, " -> \n", await analyzer.parse(text))


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

	output = output.replaceAll(/([aeiou])　?っ　?([bcdfghjklmnpqrstvwxyz])/gi, "$1$2$2") // fix tsu
	output = output.replaceAll(/a　?ー/gi, "ā　")  // add macrons (maybe bad in some cases?)
	output = output.replaceAll(/i　?ー/gi, "ī　")  // 
	output = output.replaceAll(/u　?ー/gi, "ū　")  // 
	output = output.replaceAll(/e　?ー/gi, "ē　")  // 
	output = output.replaceAll(/o　?ー/gi, "ō　")  // 
	output = output.replaceAll(/(\w)　([n])　/g, "$1$2　") // remove excess space with n
	output = output.replaceAll(/　?っ/gi, "'") // ending tsu to '
	output = output.replaceAll(/　?〜　?/gi, "~") // cleaner ~
	output = output.replaceAll(/　?~　?/gi, "~") // remove ~ spaces
	output = output.replaceAll(/　,　/gi, ",　") // remove comma space
	output = output.replaceAll(/　([!?！？])　/gu, "$1　")  // no space before punctuation
	output = output.replaceAll(/　([!?！？])/gu, "$1")  // 
	output = output.replaceAll("　", " ")  // fullwidth space to normal
	output = output.replaceAll("    ", " ")  // collapse multiple spaces
	output = output.replaceAll("   ", " ")
	output = output.replaceAll("  ", " ")  


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
	if (!lines) return lines
	// console.log("converting..")
	await initKuroshiro()
	return Promise.all(lines.map(line => convert(line)))
}