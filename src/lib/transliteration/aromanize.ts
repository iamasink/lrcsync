

async function convertWithAromanize(text: string, rule: HangulRuleName) {
	console.log(text)
	const newtext = Aromanize.hangulToLatin(text, rule)
	if (newtext.replace(" ", "") == text) return text
	if (!newtext) return text
	return newtext
}




export async function convertAllWithAromanize(lines: string[], rule: HangulRuleName) {
	return Promise.all(lines.map(line => convertWithAromanize(line, rule)))
}




// aromanize modified from https://github.com/fujaru/aromanize-js
/*
MIT License

Copyright (c) 2017 Fajar Chandra 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

type HangulRuleName = 'rr' | 'rr-translit' | 'skats' | 'ebi'
interface HangulToLatinOptions {
	text: string
	rule?: HangulRuleName
	hyphen?: string
}

const Aromanize = {

	////////////////////////////////////////////////////////////////////
	// Transliteration rules
	////////////////////////////////////////////////////////////////////

	rules: {

		hangul: {

			/**
			 * Revised Romanization Transcription
			 */
			'rr': {
				// Note: giyeok (0x1100) for middle moeum is different than giyeok (0x3131) for standalone jamo
				cho: {
					'ᄀ': 'g', 'ᄁ': 'kk',
					'ᄂ': 'n',
					'ᄃ': 'd', 'ᄄ': 'tt',
					'ᄅ': 'r',
					'ᄆ': 'm',
					'ᄇ': 'b', 'ᄈ': 'pp',
					'ᄉ': 's', 'ᄊ': 'ss',
					'ᄋ': '',
					'ᄌ': 'j', 'ᄍ': 'jj',
					'ᄎ': 'ch',
					'ᄏ': 'k',
					'ᄐ': 't',
					'ᄑ': 'p',
					'ᄒ': 'h'
				},

				// Note: ᅡ (0x1161) for middle moeum is different than ㅏ (0x314F) for standalone jamo
				jung: {
					'ᅡ': 'a', 'ᅢ': 'ae', 'ᅣ': 'ya', 'ᅤ': 'yae',
					'ᅥ': 'eo', 'ᅦ': 'e', 'ᅧ': 'yeo', 'ᅨ': 'ye',
					'ᅩ': 'o', 'ᅪ': 'wa', 'ᅫ': 'wae', 'ᅬ': 'oe', 'ᅭ': 'yo',
					'ᅮ': 'u', 'ᅯ': 'wo', 'ᅰ': 'we', 'ᅱ': 'wi', 'ᅲ': 'yu',
					'ᅳ': 'eu', 'ᅴ': 'eui', 'ᅵ': 'i'
				},

				// Note: ᆨ (0x11A8) for last jaeum (batchim) is different than ᄀ (0x1100) for first jaeum
				// also different than ㄱ (0x3131) for standalone jamo
				jong: {
					'ᆨ': 'k', 'ᆨᄋ': 'g', 'ᆨᄂ': 'ngn', 'ᆨᄅ': 'ngn', 'ᆨᄆ': 'ngm', 'ᆨᄒ': 'kh',
					'ᆩ': 'kk', 'ᆩᄋ': 'kg', 'ᆩᄂ': 'ngn', 'ᆩᄅ': 'ngn', 'ᆩᄆ': 'ngm', 'ᆩᄒ': 'kh',
					'ᆪ': 'k', 'ᆪᄋ': 'ks', 'ᆪᄂ': 'ngn', 'ᆪᄅ': 'ngn', 'ᆪᄆ': 'ngm', 'ᆪᄒ': 'kch',
					'ᆫ': 'n', 'ᆫᄅ': 'll',
					'ᆬ': 'n', 'ᆬᄋ': 'nj', 'ᆬᄂ': 'nn', 'ᆬᄅ': 'nn', 'ᆬᄆ': 'nm', 'ᆬㅎ': 'nch',
					'ᆭ': 'n', 'ᆭᄋ': 'nh', 'ᆭᄅ': 'nn',
					'ᆮ': 't', 'ᆮᄋ': 'd', 'ᆮᄂ': 'nn', 'ᆮᄅ': 'nn', 'ᆮᄆ': 'nm', 'ᆮᄒ': 'th',
					'ᆯ': 'l', 'ᆯᄋ': 'r', 'ᆯᄂ': 'll',
					'ᆰ': 'k', 'ᆰᄋ': 'lg', 'ᆰᄂ': 'ngn', 'ᆰᄅ': 'ngn', 'ᆰᄆ': 'ngm', 'ᆰᄒ': 'lkh',
					'ᆱ': 'm', 'ᆱᄋ': 'lm', 'ᆱᄂ': 'mn', 'ᆱᄅ': 'mn', 'ᆱᄆ': 'mm', 'ᆱᄒ': 'lmh',
					'ᆲ': 'p', 'ᆲᄋ': 'lb', 'ᆲᄂ': 'mn', 'ᆲᄅ': 'mn', 'ᆲᄆ': 'mm', 'ᆲᄒ': 'lph',
					'ᆳ': 't', 'ᆳᄋ': 'ls', 'ᆳᄂ': 'nn', 'ᆳᄅ': 'nn', 'ᆳᄆ': 'nm', 'ᆳᄒ': 'lsh',
					'ᆴ': 't', 'ᆴᄋ': 'lt', 'ᆴᄂ': 'nn', 'ᆴᄅ': 'nn', 'ᆴᄆ': 'nm', 'ᆴᄒ': 'lth',
					'ᆵ': 'p', 'ᆵᄋ': 'lp', 'ᆵᄂ': 'mn', 'ᆵᄅ': 'mn', 'ᆵᄆ': 'mm', 'ᆵᄒ': 'lph',
					'ᆶ': 'l', 'ᆶᄋ': 'lh', 'ᆶᄂ': 'll', 'ᆶᄅ': 'll', 'ᆶᄆ': 'lm', 'ᆶᄒ': 'lh',
					'ᆷ': 'm', 'ᆷᄅ': 'mn',
					'ᆸ': 'p', 'ᆸᄋ': 'b', 'ᆸᄂ': 'mn', 'ᆸᄅ': 'mn', 'ᆸᄆ': 'mm', 'ᆸᄒ': 'ph',
					'ᆹ': 'p', 'ᆹᄋ': 'ps', 'ᆹᄂ': 'mn', 'ᆹᄅ': 'mn', 'ᆹᄆ': 'mm', 'ᆹᄒ': 'psh',
					'ᆺ': 't', 'ᆺᄋ': 's', 'ᆺᄂ': 'nn', 'ᆺᄅ': 'nn', 'ᆺᄆ': 'nm', 'ᆺᄒ': 'sh',
					'ᆻ': 't', 'ᆻᄋ': 'ss', 'ᆻᄂ': 'tn', 'ᆻᄅ': 'tn', 'ᆻᄆ': 'nm', 'ᆻᄒ': 'th',
					'ᆼ': 'ng',
					'ᆽ': 't', 'ᆽᄋ': 'j', 'ᆽᄂ': 'nn', 'ᆽᄅ': 'nn', 'ᆽᄆ': 'nm', 'ᆽᄒ': 'ch',
					'ᆾ': 't', 'ᆾᄋ': 'ch', 'ᆾᄂ': 'nn', 'ᆾᄅ': 'nn', 'ᆾᄆ': 'nm', 'ᆾᄒ': 'ch',
					'ᆿ': 'k', 'ᆿᄋ': 'k', 'ᆿᄂ': 'ngn', 'ᆿᄅ': 'ngn', 'ᆿᄆ': 'ngm', 'ᆿᄒ': 'kh',
					'ᇀ': 't', 'ᇀᄋ': 't', 'ᇀᄂ': 'nn', 'ᇀᄅ': 'nn', 'ᇀᄆ': 'nm', 'ᇀᄒ': 'th',
					'ᇁ': 'p', 'ᇁᄋ': 'p', 'ᇁᄂ': 'mn', 'ᇁᄅ': 'mn', 'ᇁᄆ': 'mm', 'ᇁᄒ': 'ph',
					'ᇂ': 't', 'ᇂᄋ': 'h', 'ᇂᄂ': 'nn', 'ᇂᄅ': 'nn', 'ᇂᄆ': 'mm', 'ᇂᄒ': 't'
				}
			},

			/**
			 * Revised Romanization Transliteration
			 */
			'rr-translit': {
				// Note: giyeok (0x1100) for middle moeum is different than giyeok (0x3131) for standalone jamo
				cho: {
					'ᄀ': 'g', 'ᄁ': 'kk',
					'ᄂ': 'n',
					'ᄃ': 'd', 'ᄄ': 'tt',
					'ᄅ': 'l',
					'ᄆ': 'm',
					'ᄇ': 'b', 'ᄈ': 'pp',
					'ᄉ': 's', 'ᄊ': 'ss',
					'ᄋ': '',
					'ᄌ': 'j', 'ᄍ': 'jj',
					'ᄎ': 'ch',
					'ᄏ': 'k',
					'ᄐ': 't',
					'ᄑ': 'p',
					'ᄒ': 'h'
				},

				// Note: ᅡ (0x1161) for middle moeum is different than ㅏ (0x314F) for standalone jamo
				jung: {
					'ᅡ': 'a', 'ᅢ': 'ae', 'ᅣ': 'ya', 'ᅤ': 'yae',
					'ᅥ': 'eo', 'ᅦ': 'e', 'ᅧ': 'yeo', 'ᅨ': 'ye',
					'ᅩ': 'o', 'ᅪ': 'oa', 'ᅫ': 'oae', 'ᅬ': 'oi', 'ᅭ': 'yo',
					'ᅮ': 'u', 'ᅯ': 'ueo', 'ᅰ': 'ue', 'ᅱ': 'ui', 'ᅲ': 'yu',
					'ᅳ': 'eu', 'ᅴ': 'eui', 'ᅵ': 'i'
				},

				// Note: ᆨ (0x11A8) for last jaeum (batchim) is different than ᄀ (0x1100) for first jaeum
				// also different than ㄱ (0x3131) for standalone jamo
				jong: {
					'ᆨ': 'g', 'ᆨᄋ': 'g-',
					'ᆩ': 'kk', 'ᆩᄋ': 'kk-',
					'ᆪ': 'gs', 'ᆪᄋ': 'gs-', 'ᆪᄉ': 'gs-s',
					'ᆫ': 'n', 'ᆫᄋ': 'n-',
					'ᆬ': 'nj', 'ᆬᄋ': 'nj-', 'ᆬᄌ': 'nj-j',
					'ᆭ': 'nh', 'ᆭᄋ': 'nh-',
					'ᆮ': 'd', 'ᆮᄋ': 'd-',
					'ᆯ': 'l', 'ᆯᄋ': 'l-',
					'ᆰ': 'lg', 'ᆰᄋ': 'lg-',
					'ᆱ': 'lm', 'ᆱᄋ': 'lm-',
					'ᆲ': 'lb', 'ᆲᄋ': 'lb-',
					'ᆳ': 'ls', 'ᆳᄋ': 'ls-', 'ᆳᄉ': 'ls-s',
					'ᆴ': 'lt', 'ᆴᄋ': 'lt-',
					'ᆵ': 'lp', 'ᆵᄋ': 'lp-',
					'ᆶ': 'lh', 'ᆶᄋ': 'lh-',
					'ᆷ': 'm', 'ᆷᄋ': 'm-',
					'ᆸ': 'b', 'ᆸᄋ': 'b-',
					'ᆹ': 'bs', 'ᆹᄋ': 'bs-', 'ᆹᄉ': 'bs-s',
					'ᆺ': 's', 'ᆺᄋ': 's-', 'ᆺᄊ': 's-ss',
					'ᆻ': 'ss', 'ᆻᄋ': 'ss-', 'ᆻᄉ': 'ss-s',
					'ᆼ': 'ng', 'ᆼᄋ': 'ng-',
					'ᆽ': 'j', 'ᆽᄋ': 'j-', 'ᆽᄌ': 'j-j',
					'ᆾ': 'ch', 'ᆾᄋ': 'ch-',
					'ᆿ': 'k', 'ᆿᄋ': 'k-',
					'ᇀ': 't', 'ᇀᄋ': 't-',
					'ᇁ': 'p', 'ᇁᄋ': 'p-',
					'ᇂ': 'h', 'ᇂᄋ': 'h-'
				}
			},

			'skats': {
				hyphen: ' ',

				// Note: giyeok (0x1100) for middle moeum is different than giyeok (0x3131) for standalone jamo
				cho: {
					'ᄀ': 'L', 'ᄁ': 'LL',
					'ᄂ': 'F',
					'ᄃ': 'B', 'ᄄ': 'BB',
					'ᄅ': 'V',
					'ᄆ': 'M',
					'ᄇ': 'W', 'ᄈ': 'WW',
					'ᄉ': 'G', 'ᄊ': 'GG',
					'ᄋ': 'K',
					'ᄌ': 'P', 'ᄍ': 'PP',
					'ᄎ': 'C',
					'ᄏ': 'X',
					'ᄐ': 'Z',
					'ᄑ': 'O',
					'ᄒ': 'J',
					' ': '  '
				},

				// Note: ᅡ (0x1161) for middle moeum is different than ㅏ (0x314F) for standalone jamo
				jung: {
					'ᅡ': 'E', 'ᅢ': 'EU', 'ᅣ': 'I', 'ᅤ': 'IU',
					'ᅥ': 'T', 'ᅦ': 'TU', 'ᅧ': 'S', 'ᅨ': 'SU',
					'ᅩ': 'A', 'ᅪ': 'AE', 'ᅫ': 'AEU', 'ᅬ': 'AU', 'ᅭ': 'N',
					'ᅮ': 'H', 'ᅯ': 'HT', 'ᅰ': 'HTU', 'ᅱ': 'HU', 'ᅲ': 'R',
					'ᅳ': 'D', 'ᅴ': 'DU', 'ᅵ': 'U'
				},

				// Note: ᆨ (0x11A8) for last jaeum (batchim) is different than ᄀ (0x1100) for first jaeum
				// also different than ㄱ (0x3131) for standalone jamo
				jong: {
					'ᆨ': 'L', 'ᆩ': 'LL', 'ᆪ': 'LG',
					'ᆫ': 'F', 'ᆬ': 'FP', 'ᆭ': 'FJ',
					'ᆮ': 'B',
					'ᆯ': 'V', 'ᆰ': 'VL', 'ᆱ': 'VM', 'ᆲ': 'VW', 'ᆳ': 'VG', 'ᆴ': 'VZ', 'ᆵ': 'VO', 'ᆶ': 'VJ',
					'ᆷ': 'M',
					'ᆸ': 'W', 'ᆹ': 'WG',
					'ᆺ': 'G', 'ᆻ': 'GG',
					'ᆼ': 'K',
					'ᆽ': 'P',
					'ᆾ': 'C',
					'ᆿ': 'X',
					'ᇀ': 'Z',
					'ᇁ': 'O',
					'ᇂ': 'J'
				}
			},

			/**
			 * Indonesian Transcription
			 */
			'ebi': {
				// Note: giyeok (0x1100) for middle moeum is different than giyeok (0x3131) for standalone jamo
				cho: {
					'ᄀ': 'gh', 'ᄁ': 'k',
					'ᄂ': 'n',
					'ᄃ': 'dh', 'ᄄ': 't',
					'ᄅ': 'r',
					'ᄆ': 'm',
					'ᄇ': 'bh', 'ᄈ': 'p',
					'ᄉ': 's', 'ᄊ': 's',
					'ᄋ': '',
					'ᄌ': 'jh', 'ᄍ': 'c',
					'ᄎ': 'ch',
					'ᄏ': 'kh',
					'ᄐ': 'th',
					'ᄑ': 'ph',
					'ᄒ': 'h'
				},

				// Note: giyeok (0x1100) for middle moeum is different than giyeok (0x3131) for standalone jamo
				cho2: {
					'ᄀ': 'g', 'ᄁ': 'k',
					'ᄂ': 'n',
					'ᄃ': 'd', 'ᄄ': 't',
					'ᄅ': 'r',
					'ᄆ': 'm',
					'ᄇ': 'b', 'ᄈ': 'p',
					'ᄉ': 's', 'ᄊ': 's',
					'ᄋ': '',
					'ᄌ': 'j', 'ᄍ': 'c',
					'ᄎ': 'ch',
					'ᄏ': 'kh',
					'ᄐ': 'th',
					'ᄑ': 'ph',
					'ᄒ': 'h'
				},

				// Note: ᅡ (0x1161) for middle moeum is different than ㅏ (0x314F) for standalone jamo
				jung: {
					'ᅡ': 'a', 'ᅢ': 'è', 'ᅣ': 'ya', 'ᅤ': 'yè',
					'ᅥ': 'ö', 'ᅦ': 'é', 'ᅧ': 'yö', 'ᅨ': 'yé',
					'ᅩ': 'o', 'ᅪ': 'wa', 'ᅫ': 'wè', 'ᅬ': 'wé', 'ᅭ': 'yo',
					'ᅮ': 'u', 'ᅯ': 'wo', 'ᅰ': 'wé', 'ᅱ': 'wi', 'ᅲ': 'yu',
					'ᅳ': 'eu', 'ᅴ': 'eui', 'ᅵ': 'i'
				},

				// Note: ᆨ (0x11A8) for last jaeum (batchim) is different than ᄀ (0x1100) for first jaeum
				// also different than ㄱ (0x3131) for standalone jamo
				jong: {
					'ᆨ': 'k', 'ᆨᄋ': 'g', 'ᆨᄂ': 'ngn', 'ᆨᄅ': 'ngn', 'ᆨᄆ': 'ngm', 'ᆨᄒ': 'kh',
					'ᆩ': 'k', 'ᆩᄋ': 'kg', 'ᆩᄂ': 'ngn', 'ᆩᄅ': 'ngn', 'ᆩᄆ': 'ngm', 'ᆩᄒ': 'kh',
					'ᆪ': 'k', 'ᆪᄋ': 'ks', 'ᆪᄂ': 'ngn', 'ᆪᄅ': 'ngn', 'ᆪᄆ': 'ngm', 'ᆪᄒ': 'kch',
					'ᆫ': 'n', 'ᆫᄅ': 'll',
					'ᆬ': 'n', 'ᆬᄋ': 'nj', 'ᆬᄂ': 'nn', 'ᆬᄅ': 'nn', 'ᆬᄆ': 'nm', 'ᆬㅎ': 'nch',
					'ᆭ': 'n', 'ᆭᄋ': 'nh', 'ᆭᄅ': 'nn',
					'ᆮ': 't', 'ᆮᄋ': 'd', 'ᆮᄂ': 'nn', 'ᆮᄅ': 'nn', 'ᆮᄆ': 'nm', 'ᆮᄒ': 'th',
					'ᆯ': 'l', 'ᆯᄋ': 'r', 'ᆯᄂ': 'll',
					'ᆰ': 'k', 'ᆰᄋ': 'lg', 'ᆰᄂ': 'ngn', 'ᆰᄅ': 'ngn', 'ᆰᄆ': 'ngm', 'ᆰᄒ': 'lkh',
					'ᆱ': 'm', 'ᆱᄋ': 'lm', 'ᆱᄂ': 'mn', 'ᆱᄅ': 'mn', 'ᆱᄆ': 'mm', 'ᆱᄒ': 'lmh',
					'ᆲ': 'p', 'ᆲᄋ': 'lb', 'ᆲᄂ': 'mn', 'ᆲᄅ': 'mn', 'ᆲᄆ': 'mm', 'ᆲᄒ': 'lph',
					'ᆳ': 't', 'ᆳᄋ': 'ls', 'ᆳᄂ': 'nn', 'ᆳᄅ': 'nn', 'ᆳᄆ': 'nm', 'ᆳᄒ': 'lsh',
					'ᆴ': 't', 'ᆴᄋ': 'lt', 'ᆴᄂ': 'nn', 'ᆴᄅ': 'nn', 'ᆴᄆ': 'nm', 'ᆴᄒ': 'lth',
					'ᆵ': 'p', 'ᆵᄋ': 'lp', 'ᆵᄂ': 'mn', 'ᆵᄅ': 'mn', 'ᆵᄆ': 'mm', 'ᆵᄒ': 'lph',
					'ᆶ': 'l', 'ᆶᄋ': 'lh', 'ᆶᄂ': 'll', 'ᆶᄅ': 'll', 'ᆶᄆ': 'lm', 'ᆶᄒ': 'lh',
					'ᆷ': 'm', 'ᆷᄅ': 'mn',
					'ᆸ': 'p', 'ᆸᄋ': 'b', 'ᆸᄂ': 'mn', 'ᆸᄅ': 'mn', 'ᆸᄆ': 'mm', 'ᆸᄒ': 'ph',
					'ᆹ': 'p', 'ᆹᄋ': 'ps', 'ᆹᄂ': 'mn', 'ᆹᄅ': 'mn', 'ᆹᄆ': 'mm', 'ᆹᄒ': 'psh',
					'ᆺ': 't', 'ᆺᄋ': 'sh', 'ᆺᄂ': 'nn', 'ᆺᄅ': 'nn', 'ᆺᄆ': 'nm', 'ᆺᄒ': 'sh',
					'ᆻ': 't', 'ᆻᄋ': 's', 'ᆻᄂ': 'nn', 'ᆻᄅ': 'nn', 'ᆻᄆ': 'nm', 'ᆻᄒ': 'th',
					'ᆼ': 'ng',
					'ᆽ': 't', 'ᆽᄋ': 'j', 'ᆽᄂ': 'nn', 'ᆽᄅ': 'nn', 'ᆽᄆ': 'nm', 'ᆽᄒ': 'ch',
					'ᆾ': 't', 'ᆾᄋ': 'ch', 'ᆾᄂ': 'nn', 'ᆾᄅ': 'nn', 'ᆾᄆ': 'nm', 'ᆾᄒ': 'ch',
					'ᆿ': 'k', 'ᆿᄋ': 'k', 'ᆿᄂ': 'ngn', 'ᆿᄅ': 'ngn', 'ᆿᄆ': 'ngm', 'ᆿᄒ': 'kh',
					'ᇀ': 't', 'ᇀᄋ': 't', 'ᇀᄂ': 'nn', 'ᇀᄅ': 'nn', 'ᇀᄆ': 'nm', 'ᇀᄒ': 'th', 'ᇀ이': 'ch',
					'ᇁ': 'p', 'ᇁᄋ': 'p', 'ᇁᄂ': 'mn', 'ᇁᄅ': 'mn', 'ᇁᄆ': 'mm', 'ᇁᄒ': 'ph',
					'ᇂ': 't', 'ᇂᄋ': 'h', 'ᇂᄂ': 'nn', 'ᇂᄅ': 'nn', 'ᇂᄆ': 'mm', 'ᇂᄒ': 't'
				}
			}
		}
	},

	////////////////////////////////////////////////////////////////////
	// Conversion methods
	////////////////////////////////////////////////////////////////////

	/**
	 * Converts Hangul to Romaja
	 * 
	 * Options/Parameters:
	 * text      - (String) Source string.
	 * rule      - (String) Romanization rule.
	 *             Possible values: rr|rr-translit|skats
	 * hyphen    - (String) Hyphenate syllables with specified characters.
	 * 
	 * Return:
	 * (String) Romanized string.
	 */
	hangulToLatin(text: string, rule?: HangulRuleName, hyphen?: string): string {

		// Helper functions
		// Check if it's letter or numbers
		const isChoseong = (char: string) => {
			if (char.charCodeAt(0) >= 0x1100 && char.charCodeAt(0) <= 0x1112) {
				return true
			}
			else {
				return false
			}
		}

		// Options mapping
		const args = {
			text, rule, hyphen
		}

		if (args.hyphen == null) {
			args.hyphen = ''
		}

		let rulemap: any = this.rules.hangul.rr
		if (args.rule != null && this.rules.hangul[args.rule] != null) {
			rulemap = this.rules.hangul[args.rule]
		}
		else if (args.rule != null) {
			throw 'Invalid rule ' + args.rule
		}

		let rom = ''
		let curr: string | null = null
		let next: string
		let nextIdx: number
		let skipJaeum = false // Indicates jaeum of current iteration to be skipped
		for (let i = 0; i <= args.text.length; i++) {
			// If next is hangul syllable, separate it into jamo
			// 0xAC00 is the first hangul syllable in unicode table
			// 0x1100 is the first hangul jaeum in unicode table
			// 0x1161 is the first hangul moeum in unicode table
			// 0x11A8 is the first hangul batchim in unicode table
			nextIdx = args.text.charCodeAt(i) - 0xAC00
			if (!isNaN(nextIdx) && nextIdx >= 0 && nextIdx <= 11171) {
				next = String.fromCharCode(Math.floor(nextIdx / 588) + 0x1100)
					+ String.fromCharCode(Math.floor(nextIdx % 588 / 28) + 0x1161)
					+ (nextIdx % 28 == 0 ? '' : String.fromCharCode(nextIdx % 28 + 0x11A7)) // Index 0 is reserved for nothing
			}
			else {
				next = args.text.charAt(i)
			}

			// Except for first iteration (curr is null),
			// Curr and next contains 2 or 3 jamo, or 1 non-hangul letter
			if (curr != null) {

				let res = ''

				// Choseong Jaeum
				if (!skipJaeum) {
					// If not the first syllable, try cho2 if defined
					if (i > 0 && !/\s/.test(args.text.charAt(i - 2)) &&
						rulemap.cho2 != undefined &&
						rulemap.cho2[curr.charAt(0)] != undefined
					) {
						res += rulemap.cho2[curr.charAt(0)]
					}
					else if (rulemap.cho[curr.charAt(0)] != undefined) {
						res += rulemap.cho[curr.charAt(0)]
					}
					else {
						res += curr.charAt(0)
					}
				}
				skipJaeum = false

				// Jungseong Moeum
				if (curr.length > 1) {
					if (rulemap.jung[curr.charAt(1)] != undefined) {
						res += rulemap.jung[curr.charAt(1)]
					}
					else {
						res += curr.charAt(1)
					}

					// Add hyphen if no batchim
					if (curr.length == 2 && isChoseong(next.charAt(0))) {
						res += ' '
					}
				}

				// Jongseong Jaeum (Batchim)
				if (curr.length > 2) {
					// Changing sound with next jaeum + moeum
					if (rulemap.jong[curr.charAt(2) + next.charAt(0) + next.charAt(1)] != undefined) {
						res += rulemap.jong[curr.charAt(2) + next.charAt(0) + next.charAt(1)]
						skipJaeum = true

						// No need to add hyphen here as it's already defined
					}
					// Changing sound with next jaeum
					else if (rulemap.jong[curr.charAt(2) + next.charAt(0)] != undefined) {
						res += rulemap.jong[curr.charAt(2) + next.charAt(0)]
						skipJaeum = true

						// No need to add hyphen here as it's already defined
					}
					// Unchanging sound
					else if (rulemap.jong[curr.charAt(2)] != undefined) {
						res += rulemap.jong[curr.charAt(2)]

						// Add hyphen
						if (isChoseong(next.charAt(0))) {
							res += ' '
						}
					}
					else {
						res += curr.charAt(2)

						// Add hyphen
						if (isChoseong(next.charAt(0))) {
							res += ' '
						}
					}
				}

				// Replace hyphen (if this is hangeul word)
				if (curr.length > 1) {
					if (args.hyphen == '' && rulemap.hyphen != null) {
						res = res.replace(' ', rulemap.hyphen)
					}
					else {
						// Soft hyphen
						res = res.replace(' ', args.hyphen)
						// Hard hyphen
						if (args.hyphen != '') {
							res = res.replace('-', args.hyphen)
						}
					}
				}
				rom += res
			}

			curr = next
		}
		return rom
	},
}