<script lang="ts">
import ProgressBar from "$lib/components/ProgressBar.svelte"
import { addRuby } from "$lib/furigana"
import { getOffsetToNext, getOffsetToNextTimed } from "$lib/parseLRC"
import { s } from "$lib/state.svelte"

let currentText = $derived(s.lyrics[s.currentAudioLine]?.text ?? "")
let currentTextConverted = $derived(s.convertedLyrics[s.currentAudioLine] ?? "")
let flash = $state(false)
$effect(() => {
	// update whenever audioline changes too!
	s.lyrics[s.currentAudioLine]
	if (currentText) {
		flash = true
		const t = setTimeout(() => {
			flash = false
		}, 200)
	}
})

let breaktime = $derived(currentText == "")
let lyricPercentage = $derived(getLyricPercentageRemaining())
let raf = 0

// function update() {
// 	// console.log("meow")
// 	lyricPercentage = getLyricPercentageRemaining()
// 	// console.log("lp: ", lyricPercentage)

// 	raf = requestAnimationFrame(update)
// }

// onMount(() => {
// 	raf = requestAnimationFrame(update)
// 	return () => {
// 		cancelAnimationFrame(raf)
// 	}
// })

function getBreakTimeRemaining() {
	const max = 30
	const offset = getOffsetToNext(s.lyrics, s.currentAudioLine)

	const lyric = s.lyrics[s.currentAudioLine + offset]
	let time: number
	if (lyric) {
		time = lyric.time
	} else {
		time = 1
	}

	// if we want this to use bpm later, do we want the beats to match on beat (probably?) or be similar to how seconds worked
	// counting exact remaining time??? idk. for now ill just not touchj it
	// const timeinseconds = (getBeatAtTim

	const result = 1 + Math.floor(time / 1000 - s.audioTimeMs / 1000)

	return Math.min(max, result)
}

function getLyricPercentageRemaining() {
	const max = 30
	const offset = getOffsetToNextTimed(s.lyrics, s.currentAudioLine)

	const lyric = s.lyrics[s.currentAudioLine]
	const nextlyric = s.lyrics[s.currentAudioLine + offset]

	if (!lyric || !nextlyric) return 0

	let time: number
	if (nextlyric) {
		time = nextlyric.time
	} else {
		time = 1
	}

	// const result = 1 + Math.floor(time / 1000 - s.audioTime / 1000)
	// const timeLeft = Math.min(max, result)
	const start = lyric.time
	const end = nextlyric.time
	const current = s.audioTimeMs

	const maximum = end - start
	const value = (current - start) / maximum

	if (value < 0) return 0
	if (value > 100) return 100

	return value
}
</script>

<div class="currentlyric">
	<div class="left">
		<span>
			current lyric:
		</span>
		<ProgressBar value={getLyricPercentageRemaining()}></ProgressBar>
	</div>
	<div class="lyrictext">
		{#if !breaktime}
			{@const hasConvertedText = currentText.trim().toLowerCase() != currentTextConverted.trim().toLowerCase()}
			<span class:flash class:nonconverted={hasConvertedText}>{@html addRuby(currentText)}</span>
			{#if hasConvertedText}
				<span class="converted" class:flash>{currentTextConverted}</span>
			{/if}
		{:else}
			<span class:break={breaktime} class:animate={s.isAudioPlaying}>
				{#each { length: getBreakTimeRemaining() }, index}
					{#if index > 6 && Math.random() < (1 / 20)}
						<span class="emoji" style="--i: {index+1}">🎷🐈</span>
					{:else}
						{#if index % 2}
							<span class="emoji" style="--i: {index+1}">🎵</span>
						{:else}
							<span class="emoji" style="--i: {index+1}">🎶</span>
						{/if}
					{/if}
				{/each}
			</span>
		{/if}
	</div>
</div>

<style>
.currentlyric {
  max-height: 4rem;
  height: 4rem;
  font-size: large;
  display: flex;
  margin-bottom: 1rem;

  .left {
    color: var(--text-muted);
    align-self: center;
    /* move slightly up */
    transform: translateY(-0.5rem);
    text-wrap: nowrap;
  }

  .lyrictext {
    margin-left: 1rem;
    font-size: x-large;
    display: flex;
    flex-direction: column;
    max-width: 70vw;

    .converted,
    .nonconverted {
      /* only if there is a lyric with conversion shown */
      white-space: nowrap;
	  overflow: clip;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }
}

.flash {
  animation: flash-bg 0.5s;
}

@keyframes flash-bg {
  0% {
    background-color: rgb(76, 76, 206);
  }
  100% {
    background-color: transparent;
  }
}

.break {
  background-color: #ffffff;
  .emoji {
    display: inline-block;
  }
}
.break.animate {
  .emoji {
    /* margin: 0 0rem; */
    animation: bounce 0.6s infinite alternate ease-in-out;
    transition: opacity 0.3s ease;
    animation-delay: calc(-0.2s * var(--i));
  }

  /* .emoji:nth-child(2) {
    animation-delay: -0.2s;
  }
  .emoji:nth-child(3) {
    animation-delay: -0.4s;
  }
    .emoji:nth-child(4) {
    animation-delay: -0.6s;
  } */
}
@keyframes bounce {
  from {
    transform: translateY(5px);
  }
  to {
    transform: translateY(-7px);
  }
}
</style>
