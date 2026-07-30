<script lang="ts">
import { onDestroy, onMount } from "svelte"
import type { MouseEventHandler } from "svelte/elements"
import Tooltip, { type position } from "./Tooltip.svelte"
import Button from "./Button.svelte"

interface Props extends svelteHTML.HTMLAttributes<HTMLButtonElement> {
	disabled?: boolean
	/** tooltip message */
	title?: string
	allownewline?: boolean
	onconfirm: () => void
	tooltipPosition?: position
	/** button message */
	message?: string
	confirmMessage?: string
	[key: string]: any
}

let { disabled = false, title = "", shortcut, onconfirm = $bindable(), ignoremods = false, tooltipPosition = "bottom", confirmMessage, ...rest }: Props =
	$props()

let btn: HTMLButtonElement

let confirmState = $state(false)

async function onclick() {
	// const result = await saveFile()
	// if (result) {
	// 	showToast("saved as " + result)
	// 	s.lyrics = []
	// 	s.filePaths.lyrics = undefined
	// 	s.fileHandles.lyrics = undefined
	// 	s.fileHandles.audio = undefined
	// 	s.filePaths.audio = undefined
	// }
	if (!confirmState) {
		confirmState = true
		setTimeout(() => {
			confirmState = false
		}, 5000)
	} else {
		confirmState = false
		onconfirm()
	}
}
</script>

<!--
	<Tooltip message={title} position={tooltipPosition} allownewline>
		<button bind:this={btn} {disabled} {onclick} {...rest} class="button">
			<span class="label">{@render children?.()}</span>
		</button>
	</Tooltip>
-->
<Button {disabled} {onclick} {...rest} class="button">
	<span class="label">
		{#if confirmState}
			{@html confirmMessage ?? "Are you sure?"}
		{:else}
			{@html title}
		{/if}
	</span>
</Button>

<style>
</style>
