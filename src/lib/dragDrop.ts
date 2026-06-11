import { getCurrentWebview } from "@tauri-apps/api/webview"
import { readFile } from '@tauri-apps/plugin-fs'
import { s } from "./state.svelte"

export type FileWithHandle = File & { handle?: FileSystemFileHandle }

export function initDragDrop(
	onFiles: (files: FileWithHandle[]) => void,
	setOverlay: (show: boolean) => void,
	onAfterDrop: () => void,
) {
	let cleanupFns: (() => void)[] = []


	if (s.isTauri) {
		const unlisten = getCurrentWebview().onDragDropEvent(async (e) => {
			if (e.payload.type === 'over') {
				setOverlay(true)
			} else if (e.payload.type === 'drop') {
				setOverlay(false)

				// read files and give to onFiles
				if (e.payload.paths.length) {
					const files = []
					for (const path of e.payload.paths) {
						const contents = await readFile(path)
						const name = path.split("/").pop() || "file"
						files.push(new File([contents], name))
					}
					onFiles(files)
					if (onAfterDrop) onAfterDrop()

				}

			} else {
				// console.log('File drop cancelled')
				setOverlay(false)
			}
		});
		(async () => {
			cleanupFns.push(await unlisten)
		})()

	} else {
		function onDragEnter(e: DragEvent) {
			if (e.dataTransfer?.types?.includes("Files")) setOverlay(true)
		}

		function onDragLeave(e: DragEvent) {
			if (!e.relatedTarget) setOverlay(false)
		}

		async function onDrop(e: DragEvent) {
			e.preventDefault()
			e.stopPropagation()
			setOverlay(false)
			console.log("dropped", e.dataTransfer)
			if (!e.dataTransfer) {
				console.warn("No dataTransfer in drop event")
				return
			}

			// try with new api first
			// if function exists
			// @ts-ignore
			if (DataTransferItem.prototype.getAsFileSystemHandle) {
				console.log("we have getAsFileSystemHandle, trying to use it")
				const handlesPromises = [...e.dataTransfer.items]
					// only "file", alternative is "string" for dragged text
					.filter((x) => x.kind === "file")
					// @ts-ignore
					.map((x) => x.getAsFileSystemHandle())
				const handles: FileSystemFileHandle[] = await Promise.all(handlesPromises)
				console.log("dropped handles", handles)
				const files: FileWithHandle[] = []
				for (const handle of handles) {
					if (handle.kind === "file") {
						const file: FileWithHandle = await handle.getFile()
						file.handle = handle
						files.push(file)
					} else if (handle.kind === "directory") {
						console.error("dropping directories isnt supported")
						alert("dropping folders isnt supported")
						return
					}
				}
				if (!files.length) {
					console.warn("file system access api didnt give us anything")
				} else {
					onFiles(files)
					onAfterDrop()
					return
				}
			}


			console.log("getAsFileSystemHandle not available, falling back to files list")
			const files = [...e.dataTransfer.files]
			if (files.length) {
				onFiles(files)
			} else {
				console.warn("No files in dataTransfer.files either")
			}
			onAfterDrop()
		}

		window.addEventListener("dragenter", onDragEnter)
		window.addEventListener("dragleave", onDragLeave)
		window.addEventListener("drop", onDrop)
		window.addEventListener("dragover", e => e.preventDefault())

		cleanupFns.push(() => {
			window.removeEventListener("dragenter", onDragEnter)
			window.removeEventListener("dragleave", onDragLeave)
			window.removeEventListener("drop", onDrop)
			window.removeEventListener("dragover", e => e.preventDefault())
		})

	}


	return () => cleanupFns.forEach(fn => fn())

}
