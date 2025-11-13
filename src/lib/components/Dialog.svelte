<script lang="ts">
import { onMount } from "svelte"

interface Props {
	open?: boolean
	onOutsideClick?: boolean
	title?: string
	children?: any
}

let { open = $bindable(false), onOutsideClick = true, title, children }: Props = $props()
// svelte-ignore non_reactive_update
let backdropElement: HTMLDivElement

function handleBackdropClick(e: MouseEvent) {
	if (onOutsideClick && e.target === backdropElement) {
		open = false
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape" && open) {
		open = false
	}
}

onMount(() => {
	window.addEventListener("keydown", handleKeydown)
	return () => window.removeEventListener("keydown", handleKeydown)
})
</script>

{#if open}
	<div class="dialog-backdrop" role="dialog" aria-modal="true" tabindex="0" bind:this={backdropElement} onclick={handleBackdropClick} onkeydown={handleKeydown}>
		<div class="dialog-box">
			{#if title}
				<h2 class="dialog-title">{title}</h2>
			{/if}
			<div class="dialog-content">
				{@render children?.()}
			</div>
		</div>
	</div>
{/if}

<style>
:global {
  .dialog-content {
    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;

      background: var(--bg-light);
      color: white;

      .primary {
        background: purple;
        color: white;
      }
      .danger {
        background: var(--danger);
        color: white;
      }
    }
  }
}
</style>
