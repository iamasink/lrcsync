<script lang="ts">
import "../app.css"
import favicon from "$lib/assets/favicon.svg"

let { children } = $props()
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- <title>{"LRCSync"}</title> -->
	<link rel="icon" href="/favicon.svg" type="image/svg+xml">
	<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">

	<title>LRCSync</title>
	<meta name="description" content="Edit, sync, and preview LRC lyric files easily." />
	<meta property="og:title" content="LRCSync - LRC Editor & Sync Tool" />
	<meta property="og:description" content="Edit, sync, and preview LRC lyric files easily." />
	<!-- <meta property="og:image" content="/static/preview.png" /> -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://lrcsync.vercel.app" />
	<!-- <meta name="twitter:card" content="summary_large_image" /> -->
</svelte:head>

{@render children?.()}
