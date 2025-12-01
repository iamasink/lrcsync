import { s } from "./state.svelte"

const scrollAnimations = new Map<HTMLElement, number>()

export async function scrollLineIntoView(index: number, element?: HTMLElement) {
	const targetElement = element || s.lineElements2[index]
	if (!targetElement) {
		console.log(`scrollLineIntoView: no element`)
		return
	}

	const scrollContainer = targetElement.parentElement?.parentElement as HTMLElement
	if (!scrollContainer) {
		console.log("scrollLineIntoView: no container")
		return
	}

	// cancel existing animation for this container
	const existingAnimation = scrollAnimations.get(scrollContainer)
	if (existingAnimation !== undefined) {
		cancelAnimationFrame(existingAnimation)
	}

	const containerRect = scrollContainer.getBoundingClientRect()
	const elementRect = targetElement.getBoundingClientRect()

	const targetScrollTop = scrollContainer.scrollTop
		+ elementRect.top
		- containerRect.top
		- scrollContainer.clientHeight / 2
		+ elementRect.height / 2

	const startScrollTop = scrollContainer.scrollTop
	const distance = targetScrollTop - startScrollTop

	if (Math.abs(distance) < 1) return

	const duration = Math.min(300, Math.max(100, Math.abs(distance)))

	let startTime: number | null = null

	function animate(time: number) {
		if (!startTime) startTime = time
		const elapsed = time - startTime
		const progress = Math.min(1, elapsed / duration)

		scrollContainer.scrollTop = startScrollTop + distance * progress

		if (progress < 1) {
			const frameId = requestAnimationFrame(animate)
			scrollAnimations.set(scrollContainer, frameId)
		} else {
			scrollAnimations.delete(scrollContainer)
		}
	}

	const frameId = requestAnimationFrame(animate)
	scrollAnimations.set(scrollContainer, frameId)
}
