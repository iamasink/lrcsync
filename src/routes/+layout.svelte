<script lang="ts">
import "../app.css"
import favicon from "$lib/assets/favicon.svg"

let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">

	<title>LRCSync</title>

</svelte:head>

{@render children?.()}
