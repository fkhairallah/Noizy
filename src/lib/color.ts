export type Palette = {
  ink: string
  wash: string
  glow: string
}

/** One palette per pentatonic note, warm in the low notes and cool up high. */
export const PALETTES: readonly Palette[] = [
  { ink: '#FF8BA7', wash: '#FFD0DC', glow: '#FF5D8F' },
  { ink: '#FF9B71', wash: '#FFD0BE', glow: '#FF7A45' },
  { ink: '#FFD166', wash: '#FFF0C2', glow: '#FFB703' },
  { ink: '#B6F27A', wash: '#E4FFC8', glow: '#8BE04A' },
  { ink: '#72EFDD', wash: '#C8FFF4', glow: '#2EC4B6' },
  { ink: '#8EE3F5', wash: '#D7F7FF', glow: '#3DCFE8' },
  { ink: '#90DBF4', wash: '#D9F4FF', glow: '#48BFE3' },
  { ink: '#B8C0FF', wash: '#E4E7FF', glow: '#8E9AFF' },
  { ink: '#E0AAFF', wash: '#F6E4FF', glow: '#C77DFF' },
]

export function paletteFor(index: number): Palette {
  const safe = ((index % PALETTES.length) + PALETTES.length) % PALETTES.length
  return PALETTES[safe] ?? PALETTES[0]
}

export function hexToRgb(hex: string): [number, number, number] {
  const value = hex.slice(1)
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ]
}

export function rgba(hex: string, alpha: number): string {
  const [red, green, blue] = hexToRgb(hex)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

export function mixHex(from: string, to: string, amount: number): string {
  const [ar, ag, ab] = hexToRgb(from)
  const [br, bg, bb] = hexToRgb(to)
  const mix = (start: number, end: number) => Math.round(start + (end - start) * amount)
  const channel = (channelValue: number) => channelValue.toString(16).padStart(2, '0')
  return `#${channel(mix(ar, br))}${channel(mix(ag, bg))}${channel(mix(ab, bb))}`
}
