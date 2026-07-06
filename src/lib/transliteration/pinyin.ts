import { pinyin } from "pinyin-pro"

async function convertWithPinyinPro(text: string) {
	console.log(text)
	const newtext = pinyin(text, { nonZh: "consecutive" })
	if (newtext.replace(" ", "") == text) return text
	if (!newtext) return text
	return newtext
}




export async function convertAllWithPinyinPro(lines: string[]) {
	return Promise.all(lines.map(line => convertWithPinyinPro(line)))
}