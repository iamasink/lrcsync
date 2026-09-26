<script lang="ts" module>
let lastTooltipTime = 0 // shared
</script>

<script lang="ts">
import { arrow, computePosition, flip, offset, shift } from "@floating-ui/dom"

export type position = "left" | "right" | "top" | "bottom"
interface Props {
	message: string
	children?: any
	position?: position
	showDelay?: number
	subseqtime?: number
	allownewline?: boolean
	[key: string]: any
}
let { message, children, position = "bottom", showDelay = 750, subseqtime = 250, allownewline = false, ...rest }: Props = $props()

let show = $state(false)
let timeout: number | null = null
// svelte-ignore non_reactive_update
let tooltipEl: HTMLDivElement
let arrowEl: HTMLDivElement
let referenceEl: HTMLElement

// const showDelay = 1000
// const reshowDelay = 100
// const subseqtime = 250

const clearTimeoutIfAny = () => {
	if (timeout) {
		clearTimeout(timeout)
		timeout = null
	}
}

function onmouseenter() {
	const now = Date.now()

	let delay = showDelay
	if (now - lastTooltipTime < subseqtime) {
		delay = 0
	}

	// ask others to hide immediately
	clearTimeoutIfAny()
	timeout = window.setTimeout(async () => {
		show = true
		timeout = null
		await updatePosition()
	}, delay)
}

function onmouseleave() {
	clearTimeoutIfAny()
	if (show) lastTooltipTime = Date.now()

	show = false
}

async function updatePosition() {
	if (referenceEl && tooltipEl) {
		const { x, y, placement } = await computePosition(referenceEl, tooltipEl, { placement: position, middleware: [offset(6), flip(), shift({ padding: 5 })] })

		Object.assign(tooltipEl.style, { left: `${x}px`, top: `${y}px` })
	}
}
</script>

<div bind:this={referenceEl} class="tooltip-wrapper {position}" {onmouseenter} {onmouseleave} {...rest}>
	{@render children()}
	<!--
		{#if message}
			<div bind:this={tooltipEl} class="tooltip-message" class:show={show} role="tooltip">{message}</div>
		{/if}
	-->
</div>

{#if message}
	<div bind:this={tooltipEl} class="tooltip-message" class:show role="tooltip">
		{#if allownewline}
			{@html message.split("\n").join("<br>")}
		{:else}
			{message}
		{/if}
	</div>
{/if}

<style>
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-message {
  position: fixed;
  /* left: 50%;
  top: 100%;
  transform: translateX(-50%); */
  background: var(--bg-light);
  color: white;
  padding: 4px 8px;
  font-size: 0.75rem;
  white-space: pre-line;
  border: var(--border) solid 1px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  /* margin-top: 4px; */
  z-index: 10;
}

.tooltip-message.show {
  opacity: 1;
}
</style>
