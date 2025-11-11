
const KANJI = "一-龯々〆ヵヶ"
const KANA = "ぁ-ゖァ-ヺー"

export const FURIGANA_REGEX =
	new RegExp(`(?<![${KANJI}])([${KANJI}]{1,3})[${KANA}]?\\[([${KANA}]+)\\]`, "gu")

// create ruby tags
export function convertFurigana(text: string): string {
	return text.replace(FURIGANA_REGEX, (_, kanji, furigana) => {
		return `<ruby>${kanji}<rt>${furigana}</rt></ruby>`
	})
}

// replace kanji with the furigana
export function stripFurigana(text: string): string {
	return text.replace(FURIGANA_REGEX, "$2")
}
