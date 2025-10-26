import { persisted } from 'svelte-persisted-store'
import type { LyricLine } from '$lib/parseLRC'
import { s } from './state.svelte'

export const persistedLyrics = persisted<LyricLine[]>('lyrics', [])

export interface HistoryState {
	index: number,
	name: string,
	time: number,
	lyrics: LyricLine[]
}

let index = 1
// let current = -1

interface DebouncedAction {
	timeout: number | null
	name: string
	data: {
		totalOffset: number
		count: number
		line?: number
	}
}

let pending: DebouncedAction | null = null


export const historyManager = {
	undo() {
		console.log("undo()")
		if (s.historyCurrent - 1 < 0) s.historyCurrent = 0
		else s.historyCurrent--
		console.log("undo()", s.historyCurrent)
		s.lyrics = $state.snapshot(s.history[s.historyCurrent].lyrics)
	},

	redo() {
		console.log("redo()")
		if (s.historyCurrent + 1 >= s.history.length) s.historyCurrent = s.history.length - 1
		else s.historyCurrent++
		console.log("redo()", s.historyCurrent)
		s.lyrics = $state.snapshot(s.history[s.historyCurrent].lyrics)
	},



	clear() {
		s.history = []
		s.historyCurrent = -1
	},


	clearNewer(from: number = s.historyCurrent + 1) {
		// clear history from history[current] to end
		s.history.splice(from)
	},


	push(name: string, lyrics?: LyricLine[]) {
		if (!lyrics) {
			lyrics = $state.snapshot(s.lyrics)
		}
		if (!lyrics) return

		if (s.historyCurrent < s.history.length - 1) {
			this.clearNewer()
		}

		if (s.history[s.historyCurrent] && JSON.stringify(s.history[s.historyCurrent].lyrics) === JSON.stringify(lyrics)) {
			console.log("! identical history, skipping")
			return
		}

		s.history.push({
			index: index++,
			time: Date.now(),
			lyrics: JSON.parse(JSON.stringify(lyrics)),
			name
		})
		s.historyCurrent = s.history.length - 1
		console.log("history push", name, s.historyCurrent, s.history)
	},
	pushDebounced(name: string, data: { offset?: number; line?: number } = {}) {
		// flush if type changes
		if (pending && pending.name !== name) {
			this.flush()
		}

		if (!pending) {
			pending = {
				timeout: null,
				name,
				data: { totalOffset: 0, count: 0, line: data.line }
			}
			s.historyPending = { name: pending.name, time: Date.now() }
		}
		if (s.historyPending) s.historyPending.time = Date.now()

		if (data.offset) pending.data.totalOffset += data.offset
		pending.data.count++

		if (pending.timeout) clearTimeout(pending.timeout)
		pending.timeout = window.setTimeout(() => {
			this.flush()
		}, 2500)
	},
	flush() {
		if (!pending) return
		const { name, data } = pending

		let desc = name
		if (name.startsWith("adjust")) {
			if (data.totalOffset === 0) return
			desc = `${name} by ${data.totalOffset.toFixed(2)} (${data.count})`
			if (data.line !== undefined) desc += ` on line ${data.line}`
		}

		this.push(desc)
		pending = null
		s.historyPending = null
	},

	check() {
		console.log("history current", s.history[s.historyCurrent])
	},

	goto(index: number) {
		s.historyCurrent = index
		s.lyrics = $state.snapshot(s.history[s.historyCurrent].lyrics)
	},

	getHistory() {
		return s.history
	},
	getCurrent() {
		return s.historyCurrent
	},
}
