<script lang="ts">
import { historyManager } from "$lib/history.svelte"
import type { LyricLine } from "$lib/parseLRC"
import { scrollLineIntoView } from "$lib/scroll"
import { s } from "$lib/state.svelte"
import Tooltip from "./Tooltip.svelte"

// let history: HistoryState[] = $state([])

$effect(() => {
	// s.lyrics
	s.history
	s.historyCurrent

	// scroll currently selected item into view
	const current = document.querySelector(".history-list .current") as HTMLDivElement
	scrollLineIntoView(s.historyCurrent, current)
})

function handleClickLine(index: number, e: any) {
	console.log("click!", index)

	historyManager.goto(index)
}

function timeToString(time: number) {
	return new Date(time).toISOString().split("T")[1].replace("Z", "").slice(0, 8)
}
</script>

<div class="history">
	<p class="header">History:</p>
	<div class="history-list">
		{s.historyCurrent}
		{#if s.historyPending}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="history-line">
				<Tooltip message={""}>
					<span class="index">p</span>
					<span class="time">{timeToString(s.historyPending.time)}</span>
					<span class="name">"{s.historyPending.name}"</span>
					<!-- <span>{JSON.stringify(h.lyrics)}</span> -->
				</Tooltip>
			</div>
		{/if}
		{#each [...s.history].reverse() as h, revIndex}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="history-line"
				onclick={(e) => {
					handleClickLine(s.history.length - 1 - revIndex, e)
				}}
				class:current={s.history.length - 1 - revIndex === s.historyCurrent}
			>
				<Tooltip message={JSON.stringify(h.lyrics)} allownewline>
					{#if s.history.length - 1 - revIndex === s.historyCurrent}
						<span>→</span>
					{:else}
						<span>　</span>
					{/if}
					<span class="index">{s.history.length - 1 - revIndex}</span>
					<span class="time">{timeToString(h.time)}</span>
					<span class="name">"{h.name}"</span>
					<!-- <span>{JSON.stringify(h.lyrics)}</span> -->
				</Tooltip>
			</div>
		{/each}
	</div>
</div>

<style>
.history {
  overflow-y: auto;
  max-height: 10rem;

  .history-list {
    list-style: none;
    margin: 0;
    padding: 0;

    .history-line {
      display: flex;
      column-gap: 0.5rem;
      height: 22.4px; /* 14px * 1.6 line-height = 22.4px */
      /* padding: 0 4px; */
      align-items: center;
      user-select: none;

      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }

  .header {
    text-decoration: underline;
  }

  .time {
    color: var(--text-muted);
  }
}
</style>
