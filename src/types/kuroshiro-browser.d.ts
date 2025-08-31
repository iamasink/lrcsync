
//https://github.com/Shuruni/kuroshiro-browser
declare module "kuroshiro-browser" {
	export class Kuromoji {
		constructor()
		builder(): any
		dictionaryBuilder(): any
	}

	export class KuroshiroAnalyzerKuromoji {
		constructor()
		init(): Promise<void>
		parse(str?: string): Promise<any>
	}
	type KuroshiroUtil = {
		isHiragana(str: string): boolean
		isKatakana(str: string): boolean
		isKana(str: string): boolean
		isKanji(str: string): boolean
		isJapanese(str: string): boolean
		hasHiragana(str: string): boolean
		hasKatakana(str: string): boolean
		hasKana(str: string): boolean
		hasKanji(str: string): boolean
		hasJapanese(str: string): boolean
		kanaToHiragna(str: string): string
		kanaToKatakana(str: string): string
		kanaToRomaji(str: string): string
	}

	export class Kuroshiro {
		constructor()
		init(analyzer: KuroshiroAnalyzerKuromoji, IS_PROD?: boolean): Promise<void>
		convert(str: string, options?: any): Promise<string>
		Util: KuroshiroUtil
		getFurigana(text: string, debug?: Record<string, (...args: any[]) => void>): Promise<any>

		/** Preferred constructor */
		static buildAndInitWithKuromoji(IS_PROD?: boolean): Promise<Kuroshiro>
	}
}
