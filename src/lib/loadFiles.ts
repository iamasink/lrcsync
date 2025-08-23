import { parseLRC } from "$lib/parseLRC"

export async function loadFiles(
	audioFile: File | undefined,
	lrcFile: File | undefined
) {
	let audioSrc = ""
	let lyrics: { time: number; text: string }[] = []

	if (audioFile) {
		audioSrc = URL.createObjectURL(audioFile)
	}
	if (lrcFile) {
		const lyrictext = await lrcFile.text()
		lyrics = parseLRC(lyrictext)
	}

	return { audioSrc, lyrics }
}


