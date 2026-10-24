import { clamp } from './number.ts'

/** C major pentatonic from C4 to G5. Random mashing stays consonant. */
export const SCALE = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99,
] as const

const GOLDEN_ANGLE = 2.399963229728653

export function noteIndexForPoint(
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const columns = 3
  const rows = 3
  const col = clamp(Math.floor((x / Math.max(width, 1)) * columns), 0, columns - 1)
  const row = clamp(Math.floor((1 - y / Math.max(height, 1)) * rows), 0, rows - 1)
  return row * columns + col
}

export function noteIndexForKey(code: string): number {
  let hash = 2166136261
  for (let i = 0; i < code.length; i += 1) {
    hash ^= code.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % SCALE.length
}

/** A nearby pentatonic step, kept inside the scale so the pair stays sweet. */
export function harmonyIndex(index: number): number {
  const up = index + 2
  if (up < SCALE.length) return up
  return Math.max(0, index - 2)
}

export function keyPosition(
  index: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const angle = index * GOLDEN_ANGLE
  const turn = index % 7
  const reach = Math.min(width, height) * (0.12 + turn * 0.055)
  const margin = Math.min(48, width * 0.12, height * 0.12)
  return {
    x: clamp(width / 2 + Math.cos(angle) * reach, margin, width - margin),
    y: clamp(height / 2 + Math.sin(angle) * reach * 0.78, margin, height - margin),
  }
}

export function printableKey(key: string): string | null {
  if (key.length !== 1 || key === ' ') return null
  const code = key.charCodeAt(0)
  if (code < 32 || code === 127) return null
  return key.toLocaleUpperCase()
}
