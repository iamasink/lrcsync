import { parseLRC, type Metadata } from "$lib/parseLRC"

export async function loadFiles(
	audioFile: File | undefined,
	lrcFile: File | undefined
) {
	let audioSrc = ""
	let lyrics: { time: number; text: string }[] = []
	let meta: Metadata = {}

	if (audioFile) {
		audioSrc = URL.createObjectURL(audioFile)
	}
	if (lrcFile) {
		const lyrictext = await lrcFile.text()
		const parsed = parseLRC(lyrictext)
		lyrics = parsed.lyrics
		meta = parsed.meta
	}

	return { audioSrc, lyrics, meta }
}


