
import { Kuroshiro, KuroshiroAnalyzerKuromoji, Kuromoji } from "kuroshiro-browser"

let kuroshiro: any = null
let analyser: any = null
let ready: Promise<void> | null = null

export function initKuroshiro(): Promise<void> {
	if (ready) return ready

	ready = (async () => {
		const IS_PROD = (import.meta.env.MODE == 'production')
		kuroshiro = await Kuroshiro.buildAndInitWithKuromoji(IS_PROD)

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
	await initKuroshiro()
	return Promise.all(lines.map(line => convert(line)))
}