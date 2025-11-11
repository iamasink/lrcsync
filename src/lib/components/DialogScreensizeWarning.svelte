<script lang="ts">
import Dialog from "$lib/components/Dialog.svelte"
import { onMount } from "svelte"
import { persisted } from "svelte-persisted-store"

const ignoreMobileWarning = persisted("ignoreMobileWarning", false)
let open = $state(false)

function isSmallScreen(): boolean {
	if (typeof window === "undefined") return false
	const w = window.innerWidth
	const h = window.innerHeight

	if (w < 600) return true
	if (h < 950) return true
	return false
}

function checkAndShow() {
	if (!$ignoreMobileWarning && isSmallScreen()) {
		open = true
	} else {
		open = false
	}
}

function dontShowAgain() {
	ignoreMobileWarning.set(true)
	open = false
}

onMount(() => {
	checkAndShow()
	// update on resize
	window.addEventListener("resize", checkAndShow)
	return (() => {
		window.removeEventListener("resize", checkAndShow)
	})
})
</script>

<Dialog bind:open onOutsideClick={false}>
	<h2>Your screen is small!</h2>
	<p>Expand the window or use a larger device. Currently this app does not work on small screens.</p>
	<div class="actions">
		<button onclick={() => (open = false)}>
			Dismiss
		</button>
		<button class="primary" onclick={dontShowAgain}>
			Hide Forever
		</button>
	</div>
</Dialog>

<style>
</style>
