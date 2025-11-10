<script lang="ts">
import { perceptualToAmplitude } from "$lib/perceptual"

interface Props {
	perceptualVolume: number
	isMuted: boolean
	children?: any
	[key: string]: any
}
let { perceptualVolume = $bindable(), isMuted = $bindable(true), children, ...rest }: Props = $props()

let soundVolume = $state(50)

$effect(() => {
	perceptualVolume = perceptualToAmplitude(soundVolume / 100)
})

function onvolumewheel(e: WheelEvent) {
	let delta = e.deltaY || -e.deltaX || e.deltaZ
	let newvolume = soundVolume
	if (delta > 0) {
		newvolume -= 1
	} else if (delta < 0) {
		newvolume += 1
	} else return
	if (newvolume < 0) newvolume = 0
	if (newvolume > 100) newvolume = 100
	soundVolume = newvolume
	e.preventDefault()
	// updateVolume()
}

function getWaveOpacity(start: number, end: number, volume = soundVolume): number {
	if (isMuted) return 0
	return Math.max(0, Math.min(1, (volume - start) / (end - start)))
}
function getMuteOpacity() {
	if (!isMuted) return 0
	return 1
}
</script>

<div class="volume" onwheel={onvolumewheel}>
	<button
		class="mute-button"
		onclick={() => {
			isMuted = !isMuted
		}}
		aria-label={isMuted ? "unmute" : "mute"}
	>
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" stroke-linejoin="round" stroke-linecap="round">
			<polygon points="
			5,8
			10,4
			10,19
			5,15
      		3,15
      		3,8
			"></polygon>
			<line x1="20" y1="9" x2="14" y2="15" opacity={getMuteOpacity()}></line>
			<line x1="14" y1="9" x2="20" y2="15" opacity={getMuteOpacity()}></line>

			<path d="M18,4    a15,15    0 0 1   0,16" opacity={getWaveOpacity(66, 100)}></path>
			<path d="M15,6    a9,9      0 0 1   0,11" opacity={getWaveOpacity(33, 66)}></path>
			<path d="M13,9    a5,5      0 0 1   0,5" opacity={getWaveOpacity(5, 33)}></path>
		</svg>
	</button>
	<input class="volume-slider" onpointerdown={() => isMuted = false} bind:value={soundVolume} type="range" min="0" max="100" step="1" />
</div>

<style>
.volume {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

svg {
  path {
    transition: opacity 0.2s ease;
  }
  line {
    transition: opacity 0.2s ease;
  }
}

.mute-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.7rem;
  height: 1.7rem;
  padding: 0;
  border: none;
  border-bottom-left-radius: 0.5rem;
  /* border-radius: 0.375rem; */
  transition: background 0.2s ease;
  flex-shrink: 0;
  background: var(--text);

  &:hover {
    background: var(--highlight);
  }
  &:active {
    background: var(--text);
  }
}

.volume-slider {
  width: 150px;
  height: 6px;
  cursor: pointer;
  accent-color: var(--primary);
  border-radius: 3px;
  appearance: none;
  -webkit-appearance: none;
  background: var(--text);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;

  &::-webkit-slider-thumb,
  &::-moz-range-thumb {
    -webkit-appearance: none;
    appearance: none;
    background: var(--primary);
    transition: background 0.2s ease;

    &:hover {
      background: var(--primary);
    }
  }
}

.volume:hover .volume-slider {
  opacity: 1;
  pointer-events: auto;
}
</style>
