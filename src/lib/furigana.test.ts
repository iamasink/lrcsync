import { describe, it, expect } from "vitest"
import { FURIGANA_REGEX, addRuby, replaceReading } from "./furigana"

describe("FURIGANA_REGEX", () => {
	it("matches single-kanji with reading", () => {
		const m = [..."狂[クル]".matchAll(FURIGANA_REGEX)]
		expect(m[0][1]).toBe("狂")
		expect(m[0][2]).toBe("クル")
	})

	it("matches multi-kanji base", () => {
		const m = [..."本気[マジ]".matchAll(FURIGANA_REGEX)]
		expect(m[0][1]).toBe("本気")
		expect(m[0][2]).toBe("マジ")
	})

	it("matches mixed kanji+kana base", () => {
		const m = [..."東京き[トウキョウ]".matchAll(FURIGANA_REGEX)]
		expect(m[0][1]).toBe("東京")
		expect(m[0][2]).toBe("トウキョウ")
	})

	it("does not match kana before bracket", () => {
		const m = [..."これは本気[マジ]".matchAll(FURIGANA_REGEX)]
		expect(m.length).toBe(1)
		expect(m[0][1]).toBe("本気")
	})

	it("matches well in a sentence", () => {
		const m = [..."お生憎様の今日[きょう]".matchAll(FURIGANA_REGEX)]
		expect(m[0][1]).toBe("今日")
		expect(m[0][2]).toBe("きょう")
	})

	it("does not match kana-only bases", () => {
		const m = [..."これは[コレハ]".matchAll(FURIGANA_REGEX)]
		expect(m.length).toBe(0)
	})

	it("supports multiple occurrences", () => {
		const m = [..."本気[マジ]で狂[クル]".matchAll(FURIGANA_REGEX)]
		expect(m.length).toBe(2)
		expect(m[0][1]).toBe("本気")
		expect(m[0][2]).toBe("マジ")
		expect(m[1][1]).toBe("狂")
		expect(m[1][2]).toBe("クル")
	})

	it("ignores malformed tags", () => {
		expect([... "本気[マジ[]".matchAll(FURIGANA_REGEX)]).toHaveLength(0)
		expect([... "の[本]マジ]]]".matchAll(FURIGANA_REGEX)]).toHaveLength(0)
	})

	it("supports weird cases", () => {
		const m = [..."获[フォ]".matchAll(FURIGANA_REGEX)]
		expect(m[0][1]).toBe("获")
		expect(m[0][2]).toBe("フォ")
	})


	// it("kinda matches different format", () => {
	// 	const m = [..."".matchAll(FURIGANA_REGEX)]
	// })
})

describe("convertFurigana()", () => {
	it("converts furigana properly", () => {
		expect(addRuby("本気[マジ]"))
			.toBe("<ruby>本気<rt>マジ</rt></ruby>")
	})

	it("converts multiple entries", () => {
		expect(addRuby("本気[マジ]で狂[クル]"))
			.toBe("<ruby>本気<rt>マジ</rt></ruby>で<ruby>狂<rt>クル</rt></ruby>")
	})

	it("leaves plain text untouched", () => {
		expect(addRuby("これはテストです"))
			.toBe("これはテストです")
	})
})

describe("stripFurigana()", () => {
	it("keeps only the reading", () => {
		expect(replaceReading("本気[マジ]")).toBe("マジ")
	})

	it("handles multiple occurrences", () => {
		expect(replaceReading("本気[マジ]で狂[クル]"))
			.toBe("マジでクル")
	})

	it("does nothing to normal text", () => {
		expect(replaceReading("これはテストです"))
			.toBe("これはテストです")
	})
})
