import { parseLRC, type Metadata } from "$lib/parseLRC"


export async function loadAudio(
	audioFile: File | null,
) {
	let audioSrc = ""

	if (audioFile) {
		audioSrc = URL.createObjectURL(audioFile)
	}

	return { audioSrc }
}

export async function loadLRC(
	lrcFile: File | null
) {
	let lyrics: { time: number; text: string }[] = []
	let meta: Metadata = {}

	if (lrcFile) {
		const lyrictext = await lrcFile.text()
		const parsed = parseLRC(lyrictext)
		lyrics = parsed.lyrics
		meta = parsed.meta
	}

	return { lyrics, meta }
}
