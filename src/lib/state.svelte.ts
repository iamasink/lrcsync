import type { LyricLine, Metadata } from "$lib/parseLRC"
import { persisted, type Persisted } from "svelte-persisted-store"
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

interface Preferences {
	syncDelayMs: number
	username: string
}

export const preferences: Persisted<Preferences> = persisted('preferences', {
	syncDelayMs: 200,
	username: "",
})


interface Saved {
	lyrics: LyricLine[]
	audioName: string
	lrcName: string
}

export const saved: Persisted<Saved> = persisted('saved', {
	lyrics: [],
	audioName: "",
	lrcName: ""
})