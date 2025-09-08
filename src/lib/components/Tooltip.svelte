<script lang="ts" module>
let lastTooltipTime = 0 // shared
</script>
<script lang="ts">
interface Props {
	message: string
	children?: any
	[key: string]: any
}
let { message, children, ...rest }: Props = $props()

let show = $state(false)
let timeout: number | null = null

const showDelay = 1000
// const reshowDelay = 100
const subseqtime = 100

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
	timeout = window.setTimeout(() => {
		show = true
		timeout = null
	}, delay)
}

function onmouseleave() {
	clearTimeoutIfAny()
	if (show) lastTooltipTime = Date.now()

	show = false
}
</script>

<style>
.tooltip-wrapper {
  position: relative;
}

.tooltip-message {
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%) scale(1);
  background: var(--bg-light);
  color: white;
  padding: 4px 8px;
  font-size: 0.75rem;
  border: var(--border) solid 1px;
  border-radius: 4px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.2s ease, opacity 0.2s ease;
  margin-top: 4px;
  z-index: 10;
}

.tooltip-message.show {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}
</style>

<div class="tooltip-wrapper" {onmouseenter} {onmouseleave} {...rest}>
	{@render children()}
	{#if message}
		<div class="tooltip-message" class:show={show} role="tooltip">{message}</div>
	{/if}
</div>
