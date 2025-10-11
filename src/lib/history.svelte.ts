import { persisted } from 'svelte-persisted-store'
import type { LyricLine } from '$lib/parseLRC'
import { s } from './state.svelte'
import { writable, get } from 'svelte/store'

export const persistedLyrics = persisted<LyricLine[]>('lyrics', [])

export interface HistoryState {
	index: number,
	name: string,
	time: number,
	lyrics: LyricLine[]
}

let index = 1
// let current = -1

export const historyManager = {
	undo() {
		console.log("undo()")
		if (s.historyCurrent - 1 < 0) s.historyCurrent = 0
		else s.historyCurrent--
		s.lyrics = s.history[s.historyCurrent].lyrics
	},

	redo() {
		console.log("redo()")
		if (s.historyCurrent + 1 >= s.history.length) s.historyCurrent = s.history.length - 1
		else s.historyCurrent++
		s.lyrics = s.history[s.historyCurrent].lyrics
	},



	clear() {
		s.history = []
	},


	push(name: string) {
		const lyrics = $state.snapshot(s.lyrics)

		if (!s.history[s.historyCurrent]) {
			console.log("! no historycurrent")
		} else {
			// dont do anything if they're identical
			if (JSON.stringify(s.history[s.historyCurrent].lyrics) == JSON.stringify(lyrics)) {
				console.log("! identical history")
				return
			}

			// clear history from history[current] to end
			s.history.splice(s.historyCurrent + 1)
		}


		s.history.push({ index: index++, time: Date.now(), lyrics: lyrics, name })
		s.historyCurrent = s.history.length - 1
		console.log("history push", s.history)
	},

	check() {
		console.log("history current", s.history[s.historyCurrent])
	},

	getHistory() {
		return s.history
	},
	getCurrent() {
		return s.historyCurrent
	},
}
