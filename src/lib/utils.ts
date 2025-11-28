/**
 * Clamp a value between two others
 * @param value
 * @param min The lowest possible return value
 * @param max The highest possible return value
 * @returns
 */

export function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value))
}
