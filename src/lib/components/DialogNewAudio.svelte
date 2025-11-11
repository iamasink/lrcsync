<script lang="ts">
import Dialog from "$lib/components/Dialog.svelte"
import { s } from "$lib/state.svelte"

interface Props {
	open?: boolean
}

let { open = $bindable(false) }: Props = $props()

function clear() {
	s.lyrics = []
	s.filePaths.lyrics = undefined
	open = false
}
</script>

<Dialog bind:open onOutsideClick={false}>
	<h2>New Audio</h2>
	<p>Do you want to clear the current lyrics?</p>
	{#if s.unsavedChanges}
		<p class="warning">
			(TODO: actual check) You (may have) have unsaved changes!
		</p>
	{/if}
	<div class="actions">
		<button onclick={() => (open = false)}>
			Close
		</button>
		<button class="danger" onclick={() => clear()}>
			Clear Lyrics
		</button>
	</div>
</Dialog>
