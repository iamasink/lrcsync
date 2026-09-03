<script lang="ts">
import { onDestroy, onMount } from "svelte"
import type { MouseEventHandler } from "svelte/elements"
import Tooltip, { type position } from "./Tooltip.svelte"

type shortcut = { key: string; ctrl?: boolean; meta?: boolean; shift?: boolean; alt?: boolean }

interface Props extends svelteHTML.HTMLAttributes<HTMLButtonElement> {
	disabled?: boolean
	/** tooltip message*/
	title?: string
	allownewline?: boolean
	onclick?: MouseEventHandler<HTMLButtonElement>
	tooltipPosition?: position
	children: any
	[key: string]: any
}

let { disabled = false, title = "", shortcut, onclick = $bindable(), ignoremods = false, tooltipPosition = "bottom", children, ...rest }: Props = $props()

let btn: HTMLButtonElement
</script>

<Tooltip message={title} position={tooltipPosition} allownewline>
	<button bind:this={btn} {disabled} {onclick} {...rest} class="button">
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:active, &.active {
    transform: scale(0.98);
    background-color: var(--primary);
    transition: background-color 0s, transform 0s;
  }
  transition: background-color 0.1s ease-in-out, transform 0.1s ease-in-out;
}
</style>
