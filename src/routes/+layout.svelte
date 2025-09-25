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
	<meta property="og:title" content="LRCSync - Advanced LRC File Editor tool" />
	<meta name="description" content="Edit, sync, and preview LRC lyric files." />
	<meta property="og:description" content="Edit, sync, and preview LRC lyric files." />
	<!-- <meta property="og:image" content="/static/preview.png" /> -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://lrcsync.vercel.app" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="LRCSync - Advanced LRC File Editor tool" />
	<meta name="twitter:description" content="Edit, sync, and preview LRC lyric files." />
	<meta name="twitter:image" content="" />
</svelte:head>

{@render children?.()}
