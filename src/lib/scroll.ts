import { s } from "./state.svelte"

export function scrollLineIntoView(index: number, edittab = true) {
	let targetElement
	if (edittab) {
		targetElement = s.lineElements2[index]
	} else {
		index = Math.max(0, Math.min(index, s.lineElements.length - 1))
		targetElement = s.lineElements[index]
	}

	if (!targetElement || !targetElement.parentElement) return

	const scrollContainer = targetElement.parentElement.parentElement
	if (!scrollContainer) return
	const containerRect = scrollContainer.getBoundingClientRect()
	const elementRect = targetElement.getBoundingClientRect()

	const scrollOffset = elementRect.top - containerRect.top - scrollContainer.clientHeight / 2 + elementRect.height / 2

	scrollContainer.scrollBy({ top: scrollOffset, behavior: "smooth" })
}