<script lang="ts">
import { guessTempo } from "$lib/bpm"
import Button from "$lib/components/Button.svelte"
import Dialog from "$lib/components/Dialog.svelte"
import LoadingDots from "$lib/components/LoadingDots.svelte"
import { s } from "$lib/state.svelte"

let bpmLoading = $state(false)
let bpmMin = $state(100)
let bpmMax = $state(200)

let asdjhklasd = $state(false)

interface Props {
	open?: boolean
}

let { open = $bindable(false) }: Props = $props()

function guess(min: number, max: number) {
	bpmLoading = true
	guessTempo(min, max).then(() => {
		bpmLoading = false
		s.useBPM = true
	})
}

export function guessTempoHigher() {
	bpmMin = s.audioBPM ?? 100
	bpmMax += 20
	guess(bpmMin + 0.1, bpmMax)
}
export function guessTempoLower() {
	bpmMax = s.audioBPM ?? 200
	bpmMin -= 20
	guess(bpmMin, bpmMax - 0.5)
}
export function handleGuessButton(e: MouseEvent) {
	// bpmMin = 100
	// bpmMax = 200
	guess(bpmMin, bpmMax)
}

function onblur() {
	s.waveformRef?.updateBpmMarkers
	asdjhklasd = false
}
</script>

<Dialog bind:open onOutsideClick={true}>
	<h2>BPM: {s.audioBPM}</h2>
	<label>use bpm <input type="checkbox" bind:value={s.useBPM} /></label>
	<label>BPM Guess Range
		<label>Min
			<input type="number" bind:value={bpmMin} min="10" max="500" />
		</label>
		<label>Max
			<input type="number" bind:value={bpmMax} min="10" max="500" />
		</label>
	</label>
	<br />
	<button disabled={asdjhklasd} onclick={handleGuessButton}>{bpmLoading ? "Guessing..." : "Guess"}</button>
	{#if bpmLoading}
		<LoadingDots></LoadingDots>
	{/if}
	<br />
	{#if s.audioBPM}
		<button onclick={guessTempoHigher}>Guess Higher</button>
		<button onclick={guessTempoLower}>Guess Lower</button>
	{/if}
	<label>
		BPM:
		<input type="number" bind:value={s.audioBPM} min="1" max="300" {onblur} />
	</label>
	<label>
		Offset:
		<input type="number" bind:value={s.audioBPMOffsetMs} step="10" {onblur} />
	</label>
	<div class="actions"></div>
</Dialog>
