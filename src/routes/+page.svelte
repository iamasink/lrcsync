<script lang="ts">
	import { onMount } from "svelte";
	import { loadFiles } from "$lib/loadFiles";
	import { initDragDrop } from "$lib/dragDrop";
	import { formatLine } from "$lib/parseLRC";

	interface LyricLine {
		text: string;
		time: number; 
	}

	let audioFile: File, lrcFile: File;
	let audioSrc = "";
	let lyrics: LyricLine[] = [];
	let audioRef: HTMLAudioElement;
	let lineElements: HTMLDivElement[] = [];
	let showFileoverlay = false;

	let currentAudioLine = -1;
	let currentCaretLine = -1;

	function updateCurrentLine() {
		const time = audioRef?.currentTime ?? 0;

		let newIndex = lyrics.findIndex(
			(line, i) =>
				time >= line.time &&
				(i === lyrics.length - 1 || time < lyrics[i + 1].time),
		);

		if (newIndex !== currentAudioLine) {
			if (newIndex >= 0) {
				lineElements[newIndex]?.scrollIntoView({
					block: "center",
					behavior: "smooth",
				});
			}
			currentAudioLine = newIndex;
		}
	}

	async function doLoad() {
		const { audioSrc: src, lyrics: l } = await loadFiles(audioFile, lrcFile);
		audioSrc = src;
		lyrics = l;
	}

	onMount(() => {
		audioRef?.addEventListener("timeupdate", updateCurrentLine);

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

		return () => {
			cleanup;
			audioRef?.removeEventListener("timeupdate", updateCurrentLine);
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
	</div>

	<div id="lines-wrapper" class="lines">
		{#each lyrics as line, i (i)}
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="line"
				class:current={i === currentAudioLine}
				data-index={i}
				bind:this={lineElements[i]}
				contenteditable="true"
				onblur={() => {
					// normalize display on blur
					const el = lineElements[i];
					if (el) el.innerText = formatLine(lyrics[i]);
				}}
				onfocus={() => {
					currentCaretLine = i
					console.log(`select! ${i}` )
				}}
				onkeydown={(e) => {
					console.log(`key ${e.key}`)
					switch (e.key) {
						case ('ArrowDown'): {
							
						}
						default: {
							// do nothing
						}
					}
				}}
			>
				{formatLine(line)}
			</div>
		{/each}
	</div>
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
		padding: 1rem;
		background: #fbfbfd;
		color: #0f172a;
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1rem;
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

	.lines {
		border: 1px solid #e6e9ef;
		border-radius: 8px;
		padding: 0.5rem;
		max-height: 60vh;
		overflow: auto;
		background: linear-gradient(180deg, #fff, #fbfbff);
	}

	.line {
		font-family:
			"Inter",
			ui-sans-serif,
			system-ui,
			-apple-system,
			"Segoe UI",
			Roboto,
			"Helvetica Neue",
			Arial;
		font-size: 14px;
		padding: 0.35rem 0.5rem;
		margin: 0.15rem 0;
		border-radius: 6px;
		white-space: pre;
		overflow: hidden;
		text-overflow: ellipsis;
		outline: none;
		cursor: text;
	}

	.line.current {
		background-color: #f9beca;
	}

	.line:focus {
		box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
		background: #ffffff;
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
