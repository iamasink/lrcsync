<script lang="ts">
import type { LyricLine } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"

// let history: HistoryState[] = $state([])

$effect(() => {
	// s.lyrics
	s.history
	s.historyCurrent
	console.log("lyrics changed")
})
</script>

<div class="history">
	<p>hi</p>
	{s.historyCurrent}
	{#each [...s.history].reverse() as h, revIndex}
		{#if s.history.length - 1 - revIndex === s.historyCurrent}
			<p>→</p>
		{/if}
		<p>
			<span class="index">{s.history.length - 1 - revIndex}</span>
			<span class="time">{new Date(h.time).toISOString().split("T")[1].replace("Z", "").slice(0, 8)}</span>
			<span class="name">"{h.name}"</span>
			<!-- <span>{JSON.stringify(h.lyrics)}</span> -->
		</p>
	{/each}
</div>

<style>
.history {
  overflow-y: auto;
  max-height: 10rem;

  .time {
    color: var(--text-muted);
  }
}
</style>
