<script>
import { dismissToast, showToast, toasts } from "$lib/toast.svelte.ts"
import { fly } from "svelte/transition"
import { flip } from "svelte/animate"
import { bounceIn, bounceInOut, bounceOut } from "svelte/easing"
import { s } from "$lib/state.svelte"
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
			{toast.message}
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
  background: var(--bg-light);
  color: var(--text);
  padding: 10px;
  max-width: 300px;
  align-self: flex-end;
}
</style>
