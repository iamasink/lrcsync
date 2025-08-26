import type { LyricLine } from "$lib/parseLRC"
import type Waveform from "./components/Waveform.svelte"

type Tab = "sync" | "edit"


interface State {
	lyrics: LyricLine[]
	currentAudioLine: number
	currentCaretLine: number
	audioTime: number
	activeTab: Tab
	shiftHeld: boolean
	syncCaretWithAudio: boolean
	waveformRef: Waveform | undefined
	lineElements: HTMLDivElement[]
}

export const s: State = $state({
	lyrics: [{ text: 'default line 1', time: -1 }],
	currentAudioLine: -1,
	currentCaretLine: -1,
	audioTime: 0,
	activeTab: "sync",
	shiftHeld: true,
	syncCaretWithAudio: true,
	waveformRef: undefined,
	lineElements: []
})


// export let lyrics = $state<LyricLine[]>([{ text: 'default line 1', time: -1 }])
// export let currentAudioLine = $state<number>(-1)
// export let currentCaretLine = $state<number>(-1)
// export let audioTime = $state(0)
// export let activeTab = $state<"edit" | "sync">("sync")
// export let shiftHeld = $state(true)
// export let syncCaretWithAudio = $state(true)

