<script lang="ts">
import { exportLRC, formatLine, formatTime, parseLRC } from "$lib/parseLRC"
import type { LyricLine } from "$lib/parseLRC"

interface Props {
	lyrics: LyricLine[]
	currentCaretLine?: number
	textAreaElement?: HTMLTextAreaElement
}

let { lyrics = $bindable(), currentCaretLine = $bindable(0), textAreaElement = $bindable() }: Props = $props()

let lyricsText = exportLRC(lyrics)
let lyricsBoxElement: HTMLDivElement

// Scroll synchronization variables
let isScrolling = false

function handleInput() {
	if (textAreaElement) {
		// Store current scroll position before updating
		const currentScrollTop = textAreaElement.scrollTop

		currentCaretLine = textAreaElement.value.substring(0, textAreaElement.selectionStart).split("\n").length - 1
		try {
			const updatedLyrics = parseLRC(lyricsText)
			lyrics = updatedLyrics

			// Restore scroll position after DOM updates
			requestAnimationFrame(() => {
				if (textAreaElement && lyricsBoxElement) {
					textAreaElement.scrollTop = currentScrollTop
					// Sync the lyrics box with the restored textarea position
					syncScroll(textAreaElement, lyricsBoxElement)
					syncScroll(textAreaElement, lyricsBoxElement)
				}
			})
		} catch (error) {
			console.warn("Failed to parse LRC text:", error)
		}
	}
}

function syncScroll(source: HTMLElement, target: HTMLElement) {
	if (isScrolling) return

	isScrolling = true

	const scrollPercentage = source.scrollTop / (source.scrollHeight - source.clientHeight)
	const targetScrollTop = scrollPercentage * (target.scrollHeight - target.clientHeight)

	target.scrollTop = targetScrollTop

	// Reset the flag after a short delay to prevent infinite loops
	setTimeout(() => {
		isScrolling = false
	}, 16) // ~1 frame at 60fps
}

function handleTextAreaScroll() {
	if (textAreaElement && lyricsBoxElement) {
		syncScroll(textAreaElement, lyricsBoxElement)
	}
}

function handleLyricsBoxScroll() {
	if (textAreaElement && lyricsBoxElement) {
		syncScroll(lyricsBoxElement, textAreaElement)
	}
}
</script>

<div class="textareadiv">
	<div class="container">
		<textarea bind:this={textAreaElement} bind:value={lyricsText} oninput={handleInput} onscroll={handleTextAreaScroll}></textarea>
		<div class="lyricsbox" bind:this={lyricsBoxElement} onscroll={handleLyricsBoxScroll}>
			{#each lyrics as line, i}
				<div class="lyric-line">
					<div class="timestamp">
						[{formatTime(line.time)}]
					</div>
					<div class="text">
						{line.text}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
.textareadiv {
  height: 60vh;
  width: 100%;
  display: flex;
  overflow: hidden;

  .container {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;

    textarea {
      flex: 1;
      height: 100%;
      resize: none;
      background-color: #554258;
      color: #ffffff;
      overflow-y: auto;
      overflow-x: hidden;
      border: none;
      outline: none;
      padding: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;
      line-height: 1.6;
      font-size: 14px;
      box-sizing: border-box;
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    .lyricsbox {
      flex: 1;
      height: 100%;
      background-color: #453549;
      border-radius: 4px;
      padding: 8px;
      overflow-y: auto;
      overflow-x: hidden;
      font-size: 14px;
      box-sizing: border-box;

      .lyric-line {
        display: flex;
        gap: 0.5rem;
        height: 22.4px; /* 14px * 1.6 line-height = 22.4px */
        padding: 0 4px;
        border-radius: 2px;
        align-items: center;
        box-sizing: border-box;
        overflow: hidden;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .timestamp {
          color: #a0a0a0;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace;
          font-size: 0.85em;
          min-width: 70px;
          width: 70px;
          flex-shrink: 0;
          text-align: right;
          line-height: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .text {
          color: #ffffff;
          flex: 1;
          line-height: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
      }
    }
  }
}
</style>
