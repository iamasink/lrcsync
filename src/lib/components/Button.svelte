<script lang="ts">
import { onDestroy, onMount } from "svelte"
import type { MouseEventHandler } from "svelte/elements"
import Tooltip, { type position } from "./Tooltip.svelte"

type shortcut = { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }

interface Props extends svelteHTML.HTMLAttributes<HTMLButtonElement> {
	disabled?: boolean
	title?: string
	onclick: MouseEventHandler<HTMLButtonElement>
	tooltipPosition?: position
	children: any
	[key: string]: any
}

let { disabled = false, title = "", shortcut, onclick = $bindable(), ignoremods = false, tooltipPosition = "bottom", children, ...rest }: Props = $props()

let btn: HTMLButtonElement
</script>

<Tooltip message={title} position={tooltipPosition}>
	<button bind:this={btn} disabled={disabled} {onclick} {...rest} class="button">
		<span class="label">{@render children?.()}</span>
	</button>
</Tooltip>

<style>
.button {
  display: block;
  padding: revert;

  .label {
    font-weight: bold;
  }
}
</style>
