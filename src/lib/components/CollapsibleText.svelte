<script lang="ts">
let { title = "Details", children } = $props()
</script>

<style>
details {
  border: none;
  padding: 0;
  margin: 0;
}

summary {
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
  max-height: 200px;
}
</style>

<details>
	<summary>{title}</summary>
	<div class="content">
		{@render children()}
	</div>
</details>
