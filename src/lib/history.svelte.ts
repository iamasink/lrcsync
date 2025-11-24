import { persisted } from 'svelte-persisted-store'
import type { LyricLine, Metadata } from '$lib/parseLRC'
import { s } from './state.svelte'

export const persistedLyrics = persisted<LyricLine[]>('lyrics', [])

export interface HistoryState {
	index: number,
	name: string,
	time: number,
	lyrics: LyricLine[],
	metadata: Metadata
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
	restoreStateAt(entry: number) {
		if (entry < 0 || entry >= s.history.length) return
		const historyEntry = $state.snapshot(s.history[entry])

		s.lyrics = (historyEntry.lyrics)
		s.metadata = (historyEntry.metadata)
		s.historyCurrent = entry
	},

	undo() {
		this.flush()
		const targetIndex = Math.max(0, s.historyCurrent - 1)
		console.log("undo() to index", targetIndex)
		this.restoreStateAt(targetIndex)
	},

	redo() {
		this.flush()
		const targetIndex = Math.min(s.history.length - 1, s.historyCurrent + 1)
		console.log("redo() to index", targetIndex)
		this.restoreStateAt(targetIndex)
	},


	clear() {
		s.history = []
		s.historyCurrent = -1
		if (pending?.timeout) {
			clearTimeout(pending.timeout)
			pending = null
		}
		s.historyPending = null
	},

	clearNewer(from: number = s.historyCurrent + 1) {
		s.history.splice(from)
	},

	push(name: string) {
		if (pending) {
			this.flush()
			setTimeout(() => this.saveState(name), 0)
		} else {
			this.saveState(name)
		}
	},

	saveState(name: string) {
		if (s.historyCurrent < s.history.length - 1) {
			this.clearNewer()
		}

		const lyrics = $state.snapshot(s.lyrics)
		const metadata = $state.snapshot(s.metadata)

		if (s.history[s.historyCurrent] && JSON.stringify(s.history[s.historyCurrent].lyrics) === JSON.stringify(lyrics)) {
			console.log("! identical history, skipping")
			return
		}

		s.history.push({
			index: index++,
			time: Date.now(),
			lyrics,
			metadata,
			name
		})
		s.historyCurrent = s.history.length - 1
		console.log("history push", name, "current:", s.historyCurrent)
	},


	pushDebounced(name: string, data: { offset?: number; line?: number } = {}, delay = 2500) {
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
		}, delay)
	},


	flush() {
		s.unsavedChanges = true
		if (!pending) return

		const { name, data } = pending
		let desc = name
		if (name.startsWith("adjust")) {
			if (data.totalOffset === 0) {
				this.clearPending()
				return
			}
			desc = `${name} by ${data.totalOffset.toFixed(2)} (${data.count})`
			if (data.line !== undefined) desc += ` on line ${data.line}`
		}

		this.saveState(desc)
		this.clearPending()
	},

	clearPending() {
		if (pending?.timeout) {
			clearTimeout(pending.timeout)
		}
		pending = null
		s.historyPending = null
	},

	check() {
		console.log("history current", s.history[s.historyCurrent])
	},

	goto(index: number) {
		s.historyCurrent = index
		s.lyrics = $state.snapshot(s.history[s.historyCurrent].lyrics)
		s.metadata = $state.snapshot(s.history[s.historyCurrent].metadata)
	},

	getHistory() {
		return s.history
	},
	getCurrent() {
		return s.historyCurrent
	},
}
