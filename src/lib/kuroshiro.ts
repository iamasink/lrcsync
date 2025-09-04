
// import { Kuroshiro, KuroshiroAnalyzerKuromoji, Kuromoji } from "kuroshiro-browser"
import { Kuroshiro } from "kuroshiro-browser"
import { s } from "./state.svelte"

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
	const converted = await kuroshiro.convert(text, { to: "romaji", mode: "spaced" })

	return converted.replace(/ (\p{P})/gu, '$1')
		.replace(/(\p{P}) /gu, '$1')

}

export async function convertAll(lines: string[]): Promise<string[]> {
	if (s.convertedLyricsLang != "ja") return lines
	await initKuroshiro()
	return Promise.all(lines.map(line => convert(line)))
}