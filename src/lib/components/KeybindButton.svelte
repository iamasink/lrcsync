<script lang="ts">
import { onDestroy, onMount } from "svelte"

// export let disabled: boolean = false
// export let shortcut: { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }
type shortcut = { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }

interface Props {
	disabled?: boolean
	shortcut: shortcut
	onclick: any
	children: any
}

let { disabled = false, shortcut, onclick = $bindable(), children }: Props = $props()

let btn: HTMLButtonElement

function matchesShortcut(e: KeyboardEvent) {
	return (e.key.toLowerCase() === shortcut.key.toLowerCase()
		&& (!!shortcut.ctrl === e.ctrlKey)
		&& (!!shortcut.meta === e.metaKey)
		&& (!!shortcut.shift === e.shiftKey)
		&& (!!shortcut.alt === e.altKey))
}

function handleKey(e: KeyboardEvent) {
	if (disabled) return
	if (matchesShortcut(e)) {
		e.preventDefault()
		btn.click()
	}
}

onMount(() => {
	window.addEventListener("keydown", handleKey)
})

onDestroy(() => {
	window.removeEventListener("keydown", handleKey)
})

function getShortcutText(shortcut: shortcut) {
	let text = ""
	let mod = []
	if (shortcut.ctrl) mod.push("ctrl")
	if (shortcut.shift) mod.push("shift")
	if (shortcut.alt) mod.push("alt")
	mod.push(shortcut.key)
	return mod.join(" + ")
}
</script>

<button bind:this={btn} disabled={disabled} {onclick}>
	{@render children?.()}
	({getShortcutText(shortcut)})
</button>
