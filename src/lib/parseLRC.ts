export interface LyricLine {
	text: string
	time: number
}

export function parseLRC(content: string): LyricLine[] {
	return content.split("\n").map(line => {
		const match = line.match(/\[(\d+):(\d+\.\d+)\](.*)/)
		if (!match) return null
		const [, m, s, text] = match
		return {
			time: parseInt(m) * 60 + parseFloat(s),
			text: text.trim()
		}
	}).filter(line => line != null)
}

export function exportLRC(lines: { time: number; text: string }[]) {
	return lines.map(({ time, text }) => {
		const m = Math.floor(time / 60).toString().padStart(2, "0")
		const s = (time % 60).toFixed(2).padStart(5, "0")
		return `[${m}:${s}]${text}`
	}).join("\n")
}


export function formatTime(t: number) {
	if (!Number.isFinite(t) || t < 0) t = 0
	const m = Math.floor(t / 60).toString().padStart(2, "0")
	const s = (t % 60).toFixed(2).padStart(5, "0")
	return `${m}:${s}`
}

export function formatLine(l: { time: number; text: string }) {
	return `[${formatTime(l.time)}] ${l.text}`
}