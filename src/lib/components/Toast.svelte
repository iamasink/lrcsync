<script>
import { dismissToast, showToast, toasts } from "$lib/toast.svelte.ts"
import { fly } from "svelte/transition"
import { flip } from "svelte/animate"
import { bounceIn, bounceInOut, bounceOut } from "svelte/easing"
import { s } from "$lib/state.svelte"

$effect(() => {
	$inspect(s.filePaths)
	$inspect(s.fileHandles)
})
</script>

<div class="toast-container">
	{#each toasts as toast (toast.id)}
		<button
			animate:flip={{ duration: 100 }}
			in:fly={{ x: 300, duration: 250 }}
			out:fly={{ x: 300, duration: 200 }}
			type="button"
			onclick={() => dismissToast(toast.id)}
			class="toast-message"
		>
			<!-- {toast.message} -->
			{#if typeof toast.message === "string"}
				{toast.message}
			{:else}
				{@render toast.message()}
			{/if}
		</button>
	{/each}
</div>

<style>
.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.toast-message {
  background: var(--bg-light, #222);
  color: var(--text, #fff);
  padding: 14px;
  border-radius: 8px;
  max-width: 300px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border, #444);
  /* dont expand to fill container */
  align-self: flex-end;
}
</style>
