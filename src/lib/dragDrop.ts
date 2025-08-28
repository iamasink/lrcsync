import { listen } from "@tauri-apps/api/event"
import { getCurrentWebview } from "@tauri-apps/api/webview"
import { readFile } from '@tauri-apps/plugin-fs'

export function initDragDrop(
	onFiles: (files: FileList | File[]) => void,
	setOverlay: (show: boolean) => void,
	onAfterDrop: () => void,
) {
	//@ts-ignore
	const isTauri = !!(window.__TAURI_INTERNALS__)
	let cleanupFns: (() => void)[] = []


	console.log("initdragdrop", isTauri)

	if (isTauri) {
		// listen<{ path: string[] }>("tauri://file-drop", (event) => {
		// 	const files = event.payload.path.map(p => new File([], p))
		// 	setOverlay(false)
		// 	onFiles(files)
		// 	onAfterDrop?.()
		// 	console.log("file-drop")
		// }).then(unlisten => cleanupFns.push(unlisten))

		// listen("tauri://file-drop-hovered", () => {
		// 	setOverlay(true)
		// 	console.log("file-drop-hovered")
		// })
		// 	.then(unlisten => cleanupFns.push(unlisten))

		// listen("tauri://file-drop-cancelled", () => {
		// 	setOverlay(false)
		// 	console.log("file-drop-cancelled")
		// })
		// 	.then(unlisten => cleanupFns.push(unlisten))
		const unlisten = getCurrentWebview().onDragDropEvent(async (e) => {
			if (e.payload.type === 'over') {
				console.log('User hovering', e.payload.position)
				setOverlay(true)
			} else if (e.payload.type === 'drop') {
				console.log('User dropped', e.payload.paths)
				setOverlay(false)

				// read files and give to onFiles
				if (e.payload.paths.length) {
					const files = []
					for (const path of e.payload.paths) {
						const contents = await readFile(path) // returns Uint8Array
						const name = path.split("/").pop() || "file"
						files.push(new File([contents], name))
					}
					onFiles(files)
					if (onAfterDrop) onAfterDrop()

				}

			} else {
				console.log('File drop cancelled')
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

		function onDrop(e: DragEvent) {
			e.preventDefault()
			setOverlay(false)
			if (e.dataTransfer?.files) onFiles(e.dataTransfer.files)
			if (onAfterDrop) onAfterDrop()
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
