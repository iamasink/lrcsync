<script lang="ts">
import "../app.css"
import favicon from "$lib/assets/favicon.svg"
import { base } from "$app/paths"
import { onMount } from "svelte"

let { children } = $props()

onMount(() => {
	if ("__TAURI__" in window) return
	if (import.meta.env.PROD && "serviceWorker" in navigator) {
		navigator.serviceWorker.register(`${base}/service-worker.js`)
	}
})
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">

	<title>LRCSync</title>

</svelte:head>

{@render children?.()}
