<script lang="ts">
export let title: string = "Details"
let open = false
</script>

<style>
.header {
  cursor: pointer;
  font-weight: bold;
  user-select: none;
  background: #333;
  color: #fff;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
}

.content {
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: #444;
  color: #eee;
  border-radius: 4px;
  overflow: auto;
  max-height: 200px; /* optional scroll limit */
}
</style>

<div class="collapsible-text">
	<div class="header" on:click={() => (open = !open)}>
		{open ? "▼" : "▶"} {title}
	</div>

	{#if open}
		<div class="content">
			<slot />
		</div>
	{/if}
</div>
