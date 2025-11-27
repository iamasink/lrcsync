import { s } from "./state.svelte"

let currentScrollAnimation: number | null = null

export function scrollLineIntoView(index: number, element?: HTMLElement) {
	let targetElement = element || s.lineElements2[index]

	if (!targetElement || !targetElement.parentElement) {
		// console.log("no")
		return
	}

	const scrollContainer = targetElement.parentElement.parentElement
	if (!scrollContainer) {
		// console.log("no container")
		return
	}

	if (currentScrollAnimation !== null) {
		cancelAnimationFrame(currentScrollAnimation)
		currentScrollAnimation = null
	}

	const containerRect = scrollContainer.getBoundingClientRect()
	const elementRect = targetElement.getBoundingClientRect()

	const targetScrollTop =
		scrollContainer.scrollTop +
		elementRect.top -
		containerRect.top -
		scrollContainer.clientHeight / 2 +
		elementRect.height / 2

	const startScrollTop = scrollContainer.scrollTop
	const distance = targetScrollTop - startScrollTop
	if (Math.abs(distance) < 1) return

	const duration = Math.min(300, Math.max(100, Math.abs(distance)))

	let startTime: number | null = null

	function animate(time: number) {
		if (!startTime) startTime = time
		const elapsed = time - startTime
		const progress = Math.min(1, elapsed / duration)

		scrollContainer!.scrollTop = startScrollTop + distance * progress

		if (progress < 1) {
			currentScrollAnimation = requestAnimationFrame(animate)
		} else {
			currentScrollAnimation = null
		}
	}

	currentScrollAnimation = requestAnimationFrame(animate)
}