<script lang="ts">
let max = 1
let height = "1rem"
interface Props {
	value: number
}
const { value = $bindable() }: Props = $props()
const percentage = $derived(Math.max(0, Math.min(100, (value / max) * 100)))
const barWidth = $derived((percentage / 100) * 90 + 10)
</script>
<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax={max} style={`height: ${height};`}>
	<div class="bar" style={`width: ${barWidth}%`}></div>
</div>
<style>
.progress {
  background: var(--text);
  border-radius: 0.5rem;
  border: var(--text) 1px solid;
  overflow: clip;
  width: 100%;
}
.bar {
  height: 100%;
  display: flex;
  transition: width 50ms ease;
  background: #444;
  border-radius: 0.5rem;
}
</style>
