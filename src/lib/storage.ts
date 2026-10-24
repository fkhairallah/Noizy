import { clamp } from './number.ts'

const VOLUME_KEY = 'noizy.volume.v1'

export function readVolume(fallback = 0.6): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY)
    if (raw === null) return fallback
    const value = Number(raw)
    if (!Number.isFinite(value)) return fallback
    return clamp(value, 0, 1)
  } catch {
    return fallback
  }
}

export function writeVolume(volume: number): void {
  try {
    localStorage.setItem(VOLUME_KEY, String(clamp(volume, 0, 1)))
  } catch {
    // Private browsing can reject storage. The slider still works for this visit.
  }
}
