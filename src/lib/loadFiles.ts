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
		const text = await lrcFile.text()
		lyrics = parseLRC(text).map((l) => {
			if (!l) {
				l = { time: 0, text: "errro" }
			}

			return {
				time: +l.time.toFixed(2),
				text: l.text,
			}
		})
	}

	return { audioSrc, lyrics }
}


