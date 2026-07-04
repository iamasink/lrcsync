<script lang="ts">
import { onDestroy, onMount } from "svelte"
import type { MouseEventHandler } from "svelte/elements"
import Tooltip, { type position } from "./Tooltip.svelte"

type shortcut = { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }

interface Props extends svelteHTML.HTMLAttributes<HTMLButtonElement> {
	disabled?: boolean
	title?: string
	shortcut: shortcut
	onclick: MouseEventHandler<HTMLButtonElement>
	ignoremods?: boolean
	tooltipPosition?: position
	children: any
	[key: string]: any
}

let { disabled = false, title = "", shortcut, onclick = $bindable(), ignoremods = false, tooltipPosition = "bottom", children, ...rest }: Props = $props()

let btn: HTMLButtonElement

const keyAliases: Record<string, string> = {
	left: "ArrowLeft",
	"←": "ArrowLeft",

	right: "ArrowRight",
	"→": "ArrowRight",

	up: "ArrowUp",
	"↑": "ArrowUp",

	down: "ArrowDown",
	"↓": "ArrowDown",

	return: "Enter",
	esc: "Escape",

	space: " ",
}
const keyToCode: Record<string, string> = {
	// digits
	"0": "Digit0", "1": "Digit1", "2": "Digit2", "3": "Digit3", "4": "Digit4",
	"5": "Digit5", "6": "Digit6", "7": "Digit7", "8": "Digit8", "9": "Digit9",
	// letters
	...Object.fromEntries(
		"abcdefghijklmnopqrstuvwxyz".split("").map(c => [c, `Key${c.toUpperCase()}`])
	),
	// common named keys
	"up": "ArrowUp", "down": "ArrowDown", "left": "ArrowLeft", "right": "ArrowRight",
	",": "Comma",
	".": "Period",
	"Space": "Space",
	"Enter": "Enter",
}
const shortcutKeycode = keyToCode[shortcut.key]
if (!shortcutKeycode) {
	console.warn(`Unknown shortcut key: ${shortcut.key}`)
}

function matchesShortcut(e: KeyboardEvent) {
	console.log(e.code)
	const keyMatches = e.code === shortcutKeycode

	if (ignoremods) return (keyMatches)

	return (keyMatches
		&& (!!shortcut.ctrl === e.ctrlKey)
		&& (!!shortcut.meta === e.metaKey)
		&& (!!shortcut.shift === e.shiftKey)
		&& (!!shortcut.alt === e.altKey))
}

function handleKey(e: KeyboardEvent) {
	if (disabled) return
	// skip if in input etc
	const target = e.target as HTMLElement
	if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
		return
	}
	if (matchesShortcut(e)) {
		e.preventDefault()
		btn.click()
	}
}

onMount(() => {
	window.addEventListener("keydown", handleKey)

	return () => {
		window.removeEventListener("keydown", handleKey)
	}
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

<Tooltip message={title} position={tooltipPosition}>
	<button bind:this={btn} disabled={disabled} {onclick} {...rest} class="button">
		<span class="label">{@render children?.()}</span>
		<span class="shortcut">{getShortcutText(shortcut)}</span>
	</button>
</Tooltip>

<style>
.button {
  display: block;
  padding: revert;

  .label {
    font-weight: bold;
  }

  .shortcut {
    border: gray solid 1px;
    border-radius: 5px;
    padding-left: 2px;
    padding-right: 2px;
    font-size: 0.8em;
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>
