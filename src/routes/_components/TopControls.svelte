<script lang="ts">
import Button from "$lib/components/Button.svelte"

interface Props {
	audioFile?: File | null
	lrcFile?: File | null
}

let { audioFile = $bindable(), lrcFile = $bindable() }: Props = $props()
</script>

<p>Audio</p>
<!-- {#if !audioFile} -->
<input
	id="fileinputaudio"
	type="file"
	accept="audio/*"
	onchange={(e: Event) => {
		const t = e.target as HTMLInputElement
		if (t?.files?.[0]) audioFile = t.files[0]
	}}
/>
<!-- {/if} -->
<!-- {#if !lrcFile} -->
<p>.lrc</p>
<input
	id="fileinputlyric"
	type="file"
	accept=".lrc,.txt"
	onchange={(e: Event) => {
		const t = e.target as HTMLInputElement
		if (t?.files?.[0]) lrcFile = t.files[0]
	}}
/>
<!-- {/if} -->

<style>
input[type="file"] {
  font-size: 0.9rem;
}
</style>
