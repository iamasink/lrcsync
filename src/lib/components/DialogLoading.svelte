<script lang="ts">
import Dialog from "$lib/components/Dialog.svelte"
import LoadingDots from "./LoadingDots.svelte"

interface Props {
	open?: boolean
}

let { open = $bindable(false) }: Props = $props()
// let animationFrame = $state(0)

// $effect(() => {
// 	if (!open) return
// 	const interval = setInterval(() => {
// 		animationFrame = (animationFrame + 1) % 10
// 	}, 250)
// 	return () => clearInterval(interval)
// })

// let dots = $derived(".".repeat(3 + animationFrame))
</script>

<Dialog bind:open onOutsideClick={false}>
	<h2>Loading</h2>
	<LoadingDots />
	<div class="actions"></div>
</Dialog>
