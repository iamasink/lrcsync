const dictPath = "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict"

let kuroshiro: any = null
let analyser: any = null
let ready: Promise<void> | null = null

export function initKuroshiro(): Promise<void> {
	if (ready) return ready

	ready = (async () => {
		// @ts-ignore
		// if (!Kuroshiro || !KuroshiroAnalyzerKuromoji) {
		// 	throw new Error("Kuroshiro scripts not loaded yet!")
		// }

		// @ts-ignore
		kuroshiro = new Kuroshiro.default()
		// @ts-ignore
		analyser = new KuromojiAnalyzer({ dictPath })

		await kuroshiro.init(analyser)
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