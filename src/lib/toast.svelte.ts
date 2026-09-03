export type Toast = {
	id: number
	message: string
}

export const toasts = $state<Toast[]>([])

let nextId = 0

export function showToast(message: string, durationMs = 5000) {
	const id = nextId++

	console.log(`[toast ${id}]: "${message}"`)
	toasts.push({ id, message: message })

	if (durationMs > 0) {
		setTimeout(() => dismissToast(id), durationMs)
	}
}

export function dismissToast(id: number) {
	const index = toasts.findIndex((toast) => toast.id === id)

	if (index !== -1) {
		toasts.splice(index, 1)
	} else {
		console.warn(`couldnt dismiss toast id ${id}, not found`)
	}
}