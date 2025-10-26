<script lang="ts">
import { onMount } from "svelte"
import { persisted } from "svelte-persisted-store"

const ignoreMobileWarning = persisted("ignoreMobileWarning", false)

let showMobileWarning = $state(false)

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
		showMobileWarning = true
	} else {
		showMobileWarning = false
	}
}

onMount(() => {
	checkAndShow()
	// update on resize
	window.addEventListener("resize", checkAndShow)

	return (() => {
		window.removeEventListener("resize", checkAndShow)
	})
})

function hide() {
	showMobileWarning = false
}

function dontShowAgain() {
	ignoreMobileWarning.set(true)
	showMobileWarning = false
}
</script>

{#if showMobileWarning}
	<div class="dialog-backdrop" role="dialog" aria-modal="true">
		<div class="dialog-box">
			<h2>Your screen is small!</h2>
			<p>Expand the window or use a larger device. Currently this app does not work on small screens.</p>

			<div class="actions">
				<button onclick={hide}>dont car</button>
				<button onclick={dontShowAgain}>hide forever</button>
			</div>
		</div>
	</div>
{/if}

<style>
</style>
