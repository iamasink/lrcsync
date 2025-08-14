<script lang="ts">
	interface Props {
		lyricsText: string;
		currentCaretLine?: number;
		textAreaElement?: HTMLTextAreaElement;
	}

	let {
		lyricsText = $bindable(),
		currentCaretLine = $bindable(0),
		textAreaElement = $bindable(),
	}: Props = $props();

	function handleInput() {
		if (textAreaElement) {
			currentCaretLine =
				textAreaElement.value
					.substring(0, textAreaElement.selectionStart)
					.split("\n").length - 1;
		}
	}
</script>

<div class="textareadiv">
	<textarea
		bind:this={textAreaElement}
		bind:value={lyricsText}
		oninput={handleInput}
	></textarea>
</div>

<style>
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
</style>
