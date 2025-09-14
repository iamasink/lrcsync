import type { LyricLine, Metadata } from "$lib/parseLRC"
import type Waveform from "./components/Waveform.svelte"



interface State {
	lyrics: LyricLine[]
	convertedLyrics: string[]
	convertedLyricsLang: "ja" | "en" | "none" | null
	currentAudioLine: number
	currentCaretLine: number
	audioTime: number
	isAudioPlaying: boolean
	activeTab: "edit" | "metadata"
	modkeysHeld: { shift: boolean, ctrl: boolean, alt: boolean }
	syncCaretWithAudio: boolean
	waveformRef: Waveform | undefined
	lineElements: HTMLDivElement[]
	lineElements2: HTMLDivElement[]
	metadata: Metadata,
	isTauri: boolean,
	filePaths: { lyrics?: string, audio?: string }
}

export const s: State = $state({
	lyrics: [{ text: 'default line 1', time: -1 }],
	convertedLyrics: [],
	convertedLyricsLang: "ja",
	currentAudioLine: -1,
	currentCaretLine: -1,
	audioTime: 0,
	isAudioPlaying: false,
	activeTab: "edit",
	modkeysHeld: { shift: false, ctrl: false, alt: false },
	syncCaretWithAudio: true,
	waveformRef: undefined,
	lineElements: [],
	lineElements2: [],
	metadata: { re: "iamasink/lrcsync", ve: "1" },
	isTauri: false,
	filePaths: {}
})



// export let lyrics = $state<LyricLine[]>([{ text: 'default line 1', time: -1 }])
// export let currentAudioLine = $state<number>(-1)
// export let currentCaretLine = $state<number>(-1)
// export let audioTime = $state(0)
// export let activeTab = $state<"edit" | "sync">("sync")
// export let shiftHeld = $state(true)
// export let syncCaretWithAudio = $state(true)

