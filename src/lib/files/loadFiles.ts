import { parseLRC, type Metadata } from "$lib/parseLRC"
import type { FileWithHandle } from "$lib/files/dragDrop"
import { findCompanionFile } from "$lib/files/fileSystem"
import { historyManager } from "$lib/history.svelte"
import { s } from "$lib/state.svelte"
import { AUDIO_EXTENSIONS, LYRIC_EXTENSIONS } from "./extensions"
import { detectAndUpdateLanguage } from "$lib/transliteration/transliteration"


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
	s.convertedLyrics = []

	if (lrcFile) {
		const lyrictext = await lrcFile.text()
		const parsed = parseLRC(lyrictext)
		lyrics = parsed.lyrics
		meta = parsed.meta
	}

	return { lyrics, meta }
}


export async function loadFiles(lrcFile: FileWithHandle | null, audioFile: FileWithHandle | null) {
	// discover companion files before loading
	if (audioFile?.handle && !lrcFile) {
		const companion = await findCompanionFile(audioFile.handle, LYRIC_EXTENSIONS)
		if (companion) {
			const file: FileWithHandle = await companion.getFile()
			file.handle = companion
			lrcFile = file
			alert(`found a companion lrc file (${lrcFile.name}), so that was also loaded!`)
		}
	} else if (lrcFile?.handle && !audioFile) {
		const companion = await findCompanionFile(lrcFile.handle, AUDIO_EXTENSIONS)
		if (companion) {
			const file: FileWithHandle = await companion.getFile()
			file.handle = companion
			audioFile = file
			alert(`found a companion audio file (${audioFile.name}), so that was also loaded!`)
		}
	}

	// update file metadata after companion discovery
	s.filePaths.lyrics = lrcFile?.name
	s.fileHandles.lyrics = lrcFile?.handle

	s.filePaths.audio = audioFile?.name
	s.fileHandles.audio = audioFile?.handle

	const loadedLyrics = !!lrcFile
	const loadedAudio = !!audioFile

	let audioSrc

	if (lrcFile) {
		console.log("loading lrc")
		const { lyrics: l, meta } = await loadLRC(lrcFile)
		s.lyrics = l
		s.metadata = meta

		// reset history
		historyManager.clear()
		detectAndUpdateLanguage()
		// tostring to avoid state?
		historyManager.push(`Loaded LRC file: ${s.filePaths.lyrics || s.filePaths.audio || "unknown"}`)
	}
	if (audioFile) {
		console.log("loading audio")
		const { audioSrc: src } = await loadAudio(audioFile)
		audioSrc = src
		if (s.waveformRef) {
			s.waveformRef.loadFile(audioFile)
		}

		console.log("loaded audio")
		historyManager.push(`Loaded audio track ${s.filePaths.audio || s.filePaths.lyrics || "unknown"}`)
	}

	return { loadedLyrics, audioSrc, loadedAudio }
}