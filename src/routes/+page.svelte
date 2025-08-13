<script lang="ts">
	import { onMount } from "svelte";
	import { loadFiles } from "$lib/loadFiles";
	import { initDragDrop } from "$lib/dragDrop";
	import { formatLine, parseLRC } from "$lib/parseLRC";
	import type { LyricLine } from "$lib/parseLRC";
	import CollapsibleText from "./components/CollapsibleText.svelte";

	let audioFile = $state<File | null>(null);
	let lrcFile = $state<File | null>(null);
	let audioSrc = $state("");
	let lyricsText = $state("");
	let lyrics: LyricLine[] = $derived(parseLRC(lyricsText));

	let audioRef: HTMLAudioElement;
	let lineElements: HTMLDivElement[] = $state([]);
	let textAreaElement: HTMLTextAreaElement;
	let overlayElement: HTMLDivElement;
	let audioTime = $state(0);

	let activeTab = $state<"edit" | "sync">("sync");

	let showFileoverlay = $state(false);

	let currentAudioLine = $state(-1);
	let currentCaretLine = $state(-1);

	function updateCurrentLine() {
		const time = (audioRef?.currentTime ?? 0) * 1000;
		audioTime = time;

		let newIndex = lyrics.findIndex(
			(line, i) =>
				time >= line.time &&
				(i === lyrics.length - 1 || time < lyrics[i + 1].time),
		);

		if (newIndex !== currentAudioLine) {
			console.log(`new line: ${newIndex}`);
			if (activeTab == "edit") {
				if (newIndex >= 0 && textAreaElement) {
					const lineHeight =
						parseFloat(getComputedStyle(textAreaElement).lineHeight) || 20;
					const target = Math.max(
						0,
						lineHeight * newIndex - textAreaElement.clientHeight / 2,
					);
					textAreaElement.scrollTo({ top: target, behavior: "smooth" });
				}
			} else {
				if (newIndex < 0) newIndex = 0;
				if (newIndex > lineElements.length) newIndex = lineElements.length - 1;
				lineElements[newIndex].scrollIntoView({
					block: "center",
					behavior: "smooth",
				});
			}
			currentAudioLine = newIndex;
		}
	}

	function update() {
		audioTime = audioRef?.currentTime ?? 0;
		updateCurrentLine();
		requestAnimationFrame(update);
	}

	async function doLoad() {
		if (!audioFile || !lrcFile) {
			console.error("couldn't load! files are null");
			return;
		}

		const { audioSrc: src, lyricstext: l } = await loadFiles(
			audioFile,
			lrcFile,
		);
		audioSrc = src;

		lyricsText = l;
	}

	onMount(() => {
		const cleanup = initDragDrop(
			(files) => {
				Array.from(files).forEach((file) => {
					if (file.name.endsWith(".lrc") || file.name.endsWith(".txt")) {
						lrcFile = file;
					} else {
						audioFile = file;
					}
				});
			},
			(show) => (showFileoverlay = show),
			doLoad,
		);

		requestAnimationFrame(update);

		return () => {
			cleanup;
		};
	});
</script>

<link
	href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap"
	rel="stylesheet"
/>

<div class="container">
	{#if showFileoverlay}
		<div class="drag-overlay">Drop files anywhere</div>
	{/if}

	<div class="controls">
		<p>Audio</p>
		{#if !audioFile}
			<input
				id="fileinputaudio"
				type="file"
				accept="audio/*"
				onchange={(e: Event) => {
					const t = e.target as HTMLInputElement;
					if (t?.files?.[0]) audioFile = t.files[0];
				}}
			/>
		{/if}
		{#if !lrcFile}
			<p>.lrc</p>
			<input
				id="fileinputlyric"
				type="file"
				accept=".lrc,.txt"
				onchange={(e: Event) => {
					const t = e.target as HTMLInputElement;
					if (t?.files?.[0]) lrcFile = t.files[0];
				}}
			/>
		{/if}
		<button onclick={doLoad}>Load</button>
		<!-- <button onclick={exportFile}>Export</button> -->
		<!-- <button onclick={() => adjustSelectedLine(-0.01)}>−0.01s</button> -->
		<!-- <button onclick={() => adjustSelectedLine(+0.01)}>+0.01s</button> -->
		<!-- <button onclick={addLine}>Add line</button> -->
	</div>

	<div class="audio-row">
		<audio bind:this={audioRef} src={audioSrc} controls></audio>
	</div>

	<div class="info">
		<p>audio line: {currentAudioLine}</p>
		<p>caret line: {currentCaretLine}</p>
		<p>current time: {(audioTime / 1000).toFixed(2)}</p>
		<p>
			{String(Math.floor(audioTime / 1000 / 60)).padStart(2, "0")}:{String(Math.floor((audioTime / 1000) % 60)).padStart(2, "0")}.{String(Math.floor(audioTime % 1000)).padStart(3, "0")}
		</p>
	</div>

	<CollapsibleText>
		<p>asdjasd: {JSON.stringify(lineElements)}</p>
		<p>lyric data: {JSON.stringify(lyrics, null, 2)}</p>
	</CollapsibleText>
	<p>current lyric: {lyrics[currentAudioLine]?.text ?? ""}</p>

	<div class="tabs">
		<button
			onclick={() => (activeTab = "sync")}
			class:active={activeTab === "sync"}>Sync</button
		>
		<button
			onclick={() => (activeTab = "edit")}
			class:active={activeTab === "edit"}>Edit</button
		>
	</div>

	{#if activeTab === "sync"}
		<div class="sync-view">
			{#each lyrics as line, i}
				<div bind:this={lineElements[i]} class:current={i === currentAudioLine}>
					{formatLine(line)}
				</div>
			{/each}
		</div>
	{:else}
		<div class="textareadiv">
			<textarea
				bind:this={textAreaElement}
				bind:value={lyricsText}
				oninput={() =>
					(currentCaretLine =
						textAreaElement.value
							.substring(0, textAreaElement.selectionStart)
							.split("\n").length - 1)}
			></textarea>
		</div>
	{/if}
</div>

<style>
	:global(body) {
		font-family:
			"Inter",
			system-ui,
			-apple-system,
			"Segoe UI",
			Roboto,
			"Helvetica Neue",
			Arial;
		margin: 0;
		background: #211b22;
		color: #ffffff;
	}

	.textareadiv {
		height: 60vh;
		width: 60vw;
		textarea {
			height: 100%;
			width: 100%;
			overflow-y: auto;
			resize: none;
			background-color: #554258;
			color: #ffffff;
		}
	}

	.sync-view {
		.current {
			background-color: #ffffff;
			color: #555555;
		}
		div {
			  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;
		}
		height: 60vh;
		overflow: auto;
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100vh;
	}
	.controls {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}
	button {
		padding: 0.35rem 0.6rem;
		border-radius: 6px;
		border: 1px solid #e6e9ef;
		background: white;
		cursor: pointer;
		font-weight: 600;
	}
	button:hover {
		filter: brightness(0.98);
	}
	input[type="file"] {
		font-size: 0.9rem;
	}

	.audio-row {
		margin-top: 0.25rem;
	}

	.drag-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		color: white;
		font-size: 2rem;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 9999;
		pointer-events: all;
	}
</style>
