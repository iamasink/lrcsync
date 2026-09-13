import { parseLRC, type Metadata } from "$lib/parseLRC"
import type { FileWithHandle } from "$lib/files/dragDrop"
import { findCompanionFile, getMusicDir } from "$lib/files/fileSystem"
import { historyManager } from "$lib/history.svelte"
import { s } from "$lib/state.svelte"
import { AUDIO_EXTENSIONS, LYRIC_EXTENSIONS } from "./extensions"
import { detectAndUpdateLanguage } from "$lib/transliteration/transliteration"
import { showToast } from "$lib/toast.svelte"


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


async function loadCompanionFile(handle: FileSystemFileHandle, extensions: Set<string>): Promise<FileWithHandle | null> {
	const companionHandle = await findCompanionFile(handle, extensions)
	if (!companionHandle) return null
	const file: FileWithHandle = await companionHandle.getFile()
	file.handle = companionHandle
	return file
}

export async function loadFiles(lrcFile: FileWithHandle | null, audioFile: FileWithHandle | null) {
	console.log("hi")

	// TODO: a proper dialog to choose whether to load it
	if (await getMusicDir()) {
		console.log("music dir handle exists, checking for companion files")
		if (audioFile?.handle && !lrcFile) {
			const companion = await loadCompanionFile(audioFile.handle, LYRIC_EXTENSIONS)
			const isEmpty = s.lyrics.length <= 1
			if (companion && (isEmpty || confirm(`found a companion lrc file (${companion.name}), load it?`))) {
				lrcFile = companion
				showToast(`found a companion lrc file (${companion.name}), so that was also loaded!`)
			}
		} else if (lrcFile?.handle && !audioFile) {
			const companion = await loadCompanionFile(lrcFile.handle, AUDIO_EXTENSIONS)
			const noAudio = !s.filePaths.audio
			if (companion && (noAudio || confirm(`found a companion audio file (${companion.name}), load it?`))) {
				audioFile = companion
				showToast(`found a companion audio file (${companion.name}), so that was also loaded!`)
			}
		}


	} else {
		console.log("no music dir set")
	}
	// update file metadata
	if (lrcFile) {
		console.log("x lrcFile: ", lrcFile.name)
		s.filePaths.lyrics = lrcFile?.name
		s.fileHandles.lyrics = lrcFile?.handle
	}
	if (audioFile) {
		console.log("x audioFile: ", audioFile.name)
		s.filePaths.audio = audioFile?.name
		s.fileHandles.audio = audioFile?.handle
		// if we loaded audio (and not lrc) reset the lyrics,
		// if we have lrc then itll stay the same
		s.filePaths.lyrics = lrcFile?.name
		s.fileHandles.lyrics = lrcFile?.handle
	}

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
		historyManager.push(`Loaded LRC file: ${s.filePaths.lyrics?.toString() || s.filePaths.audio?.toString() || "unknown"}`)
	}
	if (audioFile) {
		console.log("loading audio")
		const { audioSrc: src } = await loadAudio(audioFile)
		audioSrc = src
		if (s.waveformRef) {
			s.waveformRef.loadFile(audioFile)
		}

		console.log("loaded audio")
		historyManager.push(`Loaded audio track ${s.filePaths.audio?.toString() || s.filePaths.lyrics?.toString() || "unknown"}`)
	}

	return { loadedLyrics, audioSrc, loadedAudio }
}