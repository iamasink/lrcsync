<script lang="ts">
interface Props {
	min?: number
	max?: number
	delay?: number
}

let { min = 3, max = 10, delay = 250 }: Props = $props()

let animationFrame = $state(0)

$effect(() => {
	const range = max - min + 1
	const interval = setInterval(() => {
		animationFrame = (animationFrame + 1) % range
	}, delay)
	return () => clearInterval(interval)
})

let dots = $derived(".".repeat(min + animationFrame))
</script>

<span class="loading-dots">{dots}</span>

<style>
.loading-dots {
  font-family: monospace;
  min-width: 3em;
  display: inline-block;
}
</style>
