export function initDragDrop(
	onFiles: (files: FileList) => void,
	setOverlay: (show: boolean) => void,
	onAfterDrop: () => void,
) {
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

	return () => {
		window.removeEventListener("dragenter", onDragEnter)
		window.removeEventListener("dragleave", onDragLeave)
		window.removeEventListener("drop", onDrop)
		window.removeEventListener("dragover", e => e.preventDefault())
	}
}
