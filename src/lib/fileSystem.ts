import { save } from "@tauri-apps/plugin-dialog"
import { writeTextFile } from "@tauri-apps/plugin-fs"
import { deleteHandle, getHandle, putHandle } from "./indexeddb"
import { s } from "./state.svelte"
import { exportWithMetadata } from "./parseLRC"

export async function setMusicDir(): Promise<FileSystemDirectoryHandle | null> {
	if (s.isTauri) {
		throw new Error("not implemented yet")
	}

	// @ts-ignore
	if (!window.showDirectoryPicker) {
		alert("your browser does not support the file system access api, so you cant use this. sorry")
		return null
	}

	try {
		// @ts-ignore
		const handle = await window.showDirectoryPicker()
		console.log("Selected music directory:", handle)
		verifyPermission(handle, true)
		// s.musicDirHandle = handle
		await putHandle("musicDir", handle)
		console.log("Music directory handle saved to IndexedDB")
		return handle
	} catch (err) {
		console.error("Error selecting music directory", err)
		return null
	}
}

export async function getMusicDir(): Promise<FileSystemDirectoryHandle | null> {
	console.log("Getting music directory handle from IndexedDB")
	const handle = await getHandle("musicDir") as FileSystemDirectoryHandle | null
	if (!handle) return null
	const isPermissionGranted = await verifyPermission(handle, true)
	if (!isPermissionGranted) {
		console.warn("no permission")
		return null
	}
	console.log("Retrieved music directory handle from IndexedDB:", handle)
	return handle
}

export async function forgetMusicDir() {
	console.log("forgetting music dir handle from indexeddb")
	deleteHandle("musicDir")
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/queryPermission
export async function verifyPermission(fileHandle: FileSystemHandle, withWrite: boolean) {
	const opts: any = {}
	if (withWrite) {
		opts.mode = "readwrite"
	}

	// Check if we already have permission, if so, return true.
	// @ts-ignore
	if ((await fileHandle.queryPermission(opts)) === "granted") {
		console.log("permission already granted")
		return true
	}

	// Request permission to the file, if the user grants permission, return true.
	// @ts-ignore
	if ((await fileHandle.requestPermission(opts)) === "granted") {
		console.log("permission now granted")
		return true
	}

	// The user did not grant permission, return false.
	console.log("permission was denied")
	return false
}



export async function saveFile(): Promise<string | void> {
	console.log("saving lyrics")
	const text = exportWithMetadata(s.lyrics)

	if (s.isTauri) {
		try {
			// save dialog, default to original path
			const filePath = await save({
				defaultPath: s.filePaths.lyrics || "unknown.lrc",
				filters: [{ name: "LRC Files", extensions: ["lrc", "txt"] }],
			})

			if (!filePath) return // cancelled?

			await writeTextFile(filePath, text)
			console.log("File saved to", filePath)
			s.unsavedChanges = false
		} catch (err) {
			console.error("error saving file", err)
		}
		return
	}

	// try with file access api first (chrome etc only cuz mozilla stinky)
	if (s.fileHandles.lyrics) {
		const lrcHandle = s.fileHandles.lyrics
		try {
			// we dont need to verify permission because itll ask anyway when we try
			const permission = await verifyPermission(lrcHandle, true)
			if (!permission) {
				console.warn("No permission granted :(")
				throw new Error("No permission granted for existing file handle")
			}
			console.log("permission granted for existing file handle")
			const writable = await lrcHandle.createWritable()
			await writable.write(text)
			await writable.close()
			s.unsavedChanges = false
			return lrcHandle.name
		} catch (err) {
			console.warn("Error writing to existing file handle", err)
		}
	}

	// we dont have a handle, lets try get the parent directory
	if (s.fileHandles.audio) {
		const result = await saveUsingMusicDirectory(s.fileHandles.audio, text)
		if (result) {
			s.unsavedChanges = false
			return result
		}
	}

	// this is also only on chrome https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
	// @ts-ignore
	if (window.showSaveFilePicker) {
		console.log(s.filePaths)
		console.log("suggested name", getLrcName())
		try {
			// @ts-ignore
			const handle = await window.showSaveFilePicker({
				suggestedName: getLrcName(),
				types: [{ description: "LRC Files", accept: { "text/plain": [".lrc", ".txt"] } }],
			})
			const writable = await handle.createWritable()
			await writable.write(text)
			await writable.close()
			console.log("File saved with File System Access API")
			s.unsavedChanges = false
			return
		} catch (err) {
			console.error("Error saving file with File System Access API", err)
		}
	}

	// finally we just give up and download the file to Downloads.
	const blob = new Blob([text], { type: "text/plain" })
	const url = URL.createObjectURL(blob)
	try {
		const a = document.createElement("a")
		a.href = url
		a.download = getLrcName() || "unknown.lrc"
		a.click()
	} finally {
		URL.revokeObjectURL(url)
	}
	s.unsavedChanges = false
}

export async function getParentFolderForFileUsingMusicDirectory(fileHandle: FileSystemFileHandle): Promise<FileSystemDirectoryHandle | undefined> {
	const musicDirHandle = await getMusicDir()
	if (!musicDirHandle) {
		console.warn("No music directory handle")
		return
	}

	const descendantPath = await musicDirHandle.resolve(fileHandle)

	console.log("possibleDescendant", descendantPath)

	if (!descendantPath) {
		throw new Error("file handle is not a descendant of the music directory handle")
	}

	const dirPath = descendantPath.slice(0, -1)

	let currentDirHandle: FileSystemDirectoryHandle = musicDirHandle
	for (const segment of dirPath) {
		currentDirHandle = await currentDirHandle.getDirectoryHandle(segment, { create: false })
	}

	return currentDirHandle
}

export async function findCompanionFile(handle: FileSystemFileHandle, targetExtensions: Set<string>): Promise<FileSystemFileHandle | undefined> {
	const parentHandle = await getParentFolderForFileUsingMusicDirectory(handle)
	if (!parentHandle) return

	const stem = handle.name.replace(/\.[^.]+$/, "")

	for await (const [name, entry] of parentHandle.entries()) {
		if (entry.kind !== "file") continue
		const entryExt = name.slice(name.lastIndexOf(".")).toLowerCase()
		const entryStem = name.replace(/\.[^.]+$/, "")
		if (entryStem === stem && targetExtensions.has(entryExt)) {
			return entry
		}
	}
	return
}

async function saveUsingMusicDirectory(audioHandle: FileSystemHandle, lrcText: string): Promise<string | undefined> {
	const musicDirHandle = await getMusicDir()
	if (!musicDirHandle) {
		console.warn("No music directory handle, cannot save with file system access api")
		return
	}

	try {
		const descendantPath = await musicDirHandle.resolve(audioHandle)

		console.log("possibleDescendant", descendantPath)

		if (!descendantPath) {
			throw new Error("Audio file handle is not a descendant of the music directory handle")
		}

		const lrcFileName = getLrcName()
		const dirPath = descendantPath.slice(0, -1)

		let currentDirHandle: FileSystemDirectoryHandle = musicDirHandle
		for (const segment of dirPath) {
			currentDirHandle = await currentDirHandle.getDirectoryHandle(segment, { create: false })
		}

		const lrcHandle = await currentDirHandle.getFileHandle(lrcFileName, { create: true })
		const lrcPath = [...dirPath, lrcFileName].join("/")

		console.log("got lrc handle", lrcHandle)

		s.fileHandles.lyrics = lrcHandle

		const writable = await lrcHandle.createWritable()
		await writable.write(lrcText)
		await writable.close()

		console.log("File saved as " + lrcHandle.name + " next to audio file " + getBaseName(s.filePaths.audio || ""))
		return lrcPath
	} catch (err) {
		console.warn("Error writing to music directory handle", err)
	}
}

export function getDescendantPath(
	musicDirHandle: FileSystemDirectoryHandle,
	fileHandle: FileSystemFileHandle,
): Promise<string[] | null> {
	return musicDirHandle.resolve(fileHandle)
}

export function getLrcDescendantPath(
	musicDirHandle: FileSystemDirectoryHandle,
	audioHandle: FileSystemFileHandle,
): Promise<string[] | null> {
	return musicDirHandle.resolve(audioHandle).then(descendantPath => {
		if (!descendantPath) return null
		const lrcFileName = getLrcName()
		return [...descendantPath.slice(0, -1), lrcFileName]
	})
}

export function getLrcName() {
	let filename

	if (s.filePaths.lyrics) {
		// because we might've imported a .txt or something
		const base = getBaseName(s.filePaths.lyrics)
		const index = base.lastIndexOf(".")
		if (index > 0) filename = base.slice(0, index) + ".lrc"
	} else if (s.filePaths.audio) {
		const base = getBaseName(s.filePaths.audio)
		const index = base.lastIndexOf(".")
		if (index > 0) filename = base.slice(0, index) + ".lrc"
	}

	return filename ?? ""
}

export function getParentDir(filePath: string): string {
	if (!filePath) return ""
	const parts = filePath.split(/[\\/]/)
	parts.pop()
	return parts.join("/") || ""
}

export function getBaseName(filePath: string): string {
	if (!filePath) return ""
	const parts = filePath.split(/[\\/]/)
	return parts.pop() || ""
}