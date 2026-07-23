import type { LyricLine } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"
import { convertAllWithAromanize } from "./aromanize"
import { convertAllWithKuroshiro, kuroshiroConvert } from "./kuroshiro"
import { convertAllWithPinyinPro } from "./pinyin"

export const translitLangs = ["ja", "zh", "ko", "none"] as const
export type TranslitLang = typeof translitLangs[number] | null


export async function convertWithLang(lang: TranslitLang, lyrics: string[]): Promise<string[]> {
	switch (lang) {
		case "ja": {
			console.log("converting all with convertAllWithKuroshiro")
			return await convertAllWithKuroshiro(lyrics)
		}
		case "ja-furigana": {
			console.log("converting all with convertAllWithKuroshiro + replaceReading")
			return Promise.all(lyrics.map(async line => kuroshiroConvert(line, { mode: "furigana", to: "hiragana", convertPunctuation: false })))

		}
		case "zh": {
			console.log("converting all with convertAllWithPinyinPro")
			return await convertAllWithPinyinPro(lyrics)
		}
		// case "ko-rr": {
		// 	console.log("converting all with convertAllWithAromanize rr")
		// 	return convertAllWithAromanize(lyrics, "rr")
		// }
		// case "ko-rr-t": {
		case "ko": {
			console.log("converting all with convertAllWithAromanize rr-t")
			return await convertAllWithAromanize(lyrics, "rr-translit")
		}
		// case "ko-ebi": {
		// 	console.log("converting all with convertAllWithAromanize ebi")
		// 	return convertAllWithAromanize(lyrics, "ebi")
		// }
		default: {
			return Promise.resolve(lyrics)
		}
	}
}


export function convertAllWithSelected(lyrics: string[]): Promise<string[]> {
	return convertWithLang(s.convertedLyricsLang, lyrics)
}

export function detectLanguage(text: string) {
	const hasKana = /[\u3040-\u30ff]/.test(text)
	const hasHangul = /[\uac00-\ud7af]/.test(text)
	const hasHan = /[\u4e00-\u9fff]/.test(text)

	if (hasKana) return "ja"
	if (hasHangul) return "ko"
	if (hasHan) return "zh"
	return "none"
}
export function detectAndUpdateLanguage() {
	s.convertedLyricsLang = detectLanguage(s.lyrics.map(e => e.text).join("\n"))
}