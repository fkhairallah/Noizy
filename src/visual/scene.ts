import { mixHex, paletteFor, rgba, type Palette } from '../lib/color.ts'
import { clamp } from '../lib/number.ts'
import type { NoteKind } from '../audio/synth.ts'

type Timed = {
  born: number
  life: number
}

type Disc = Timed & {
  x: number
  y: number
  radius: number
  ink: string
  wash: string
}

type Ring = Timed & {
  x: number
  y: number
  delay: number
  maxRadius: number
  width: number
  color: string
  alpha: number
  dotted: boolean
}

type Flower = Timed & {
  x: number
  y: number
  size: number
  petals: number
  spin: number
  ink: string
  wash: string
  glow: string
}

type Spiral = Timed & {
  x: number
  y: number
  radius: number
  dots: number
  spin: number
  color: string
}

type Spark = Timed & {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
}

type Glyph = Timed & {
  x: number
  y: number
  char: string
  size: number
  color: string
}

type RibbonPoint = Timed & {
  x: number
  y: number
}

type Mote = {
  x: number
  y: number
  radius: number
  speed: number
  drift: number
  phase: number
}

export type SpawnInput = {
  x: number
  y: number
  kind: NoteKind
  glyph: string | null
  paletteIndex: number
}

function easeOut(amount: number): number {
  const t = clamp(amount, 0, 1)
  return 1 - (1 - t) ** 3
}

function compact<T extends Timed>(items: T[], clock: number) {
  let write = 0
  for (let read = 0; read < items.length; read += 1) {
    const item = items[read]
    if (!item) continue
    if (clock - item.born < item.life) {
      items[write] = item
      write += 1
    }
  }
  items.length = write
}

export class Scene {
  private readonly ctx: CanvasRenderingContext2D
  private width = 1
  private height = 1
  private dpr = 1
  private raf = 0
  private running = false
  private origin = 0
  private lastTime = 0
  private clock = 0
  private reduced = false
  private idle = true
  private mood = '#c4b5fd'
  private moodTarget = '#c4b5fd'
  private keyShapes = 0
  private motes: Mote[] = []
  private discs: Disc[] = []
  private rings: Ring[] = []
  private flowers: Flower[] = []
  private spirals: Spiral[] = []
  private sparks: Spark[] = []
  private glyphs: Glyph[] = []
  private ribbon: RibbonPoint[] = []
  private pointer: { x: number; y: number; at: number } | null = null
  private flash: { color: string; born: number; life: number } | null = null
  private readonly canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('Canvas 2D is unavailable')
    this.ctx = ctx
  }

  start() {
    this.running = true
    this.origin = performance.now()
    this.resize()
    this.seedMotes()
    window.addEventListener('resize', this.resize)
    this.raf = requestAnimationFrame(this.loop)
  }

  stop() {
    this.running = false
    window.removeEventListener('resize', this.resize)
    cancelAnimationFrame(this.raf)
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced
  }

  setIdle(idle: boolean) {
    this.idle = idle
  }

  follow(x: number, y: number) {
    this.pointer = { x, y, at: this.clock }
    const last = this.ribbon[this.ribbon.length - 1]
    if (last && Math.hypot(last.x - x, last.y - y) < 3) return
    this.ribbon.push({ x, y, born: this.clock, life: 0.55 })
    if (this.ribbon.length > 30) this.ribbon.shift()
  }

  spawn(input: SpawnInput) {
    const palette = paletteFor(input.paletteIndex)
    this.moodTarget = palette.glow
    const scale = clamp(Math.min(this.width, this.height) / 800, 0.72, 1.3)
    const motion = this.reduced ? 0.18 : 1

    if (input.kind === 'move') {
      this.addDisc(input.x, input.y, (26 + Math.random() * 18) * scale, palette, 0.85)
      this.addRings(input.x, input.y, 54 * scale, palette, 2)
      this.addSparks(input.x, input.y, 7, palette.glow, 46 * motion)
      return
    }

    const flowerSize = (input.kind === 'tap' ? 108 : 92) * scale * (0.9 + Math.random() * 0.25)
    this.addDisc(input.x, input.y, flowerSize * 0.85, palette, 1.15)
    this.addRings(input.x, input.y, (input.kind === 'tap' ? 150 : 120) * scale, palette, 4)
    this.addSparks(input.x, input.y, input.kind === 'tap' ? 18 : 12, palette.ink, 90 * motion)
    this.flash = { color: palette.wash, born: this.clock, life: 0.55 }

    const drawFlower = input.kind === 'tap' || this.keyShapes % 2 === 0
    if (drawFlower) {
      this.flowers.push({
        x: input.x,
        y: input.y,
        born: this.clock,
        life: 2.5,
        size: flowerSize,
        petals: Math.random() > 0.5 ? 8 : 6,
        spin: Math.random() * Math.PI,
        ink: palette.ink,
        wash: palette.wash,
        glow: palette.glow,
      })
      if (this.flowers.length > 24) this.flowers.shift()
    } else {
      this.spirals.push({
        x: input.x,
        y: input.y,
        born: this.clock,
        life: 2.2,
        radius: flowerSize * 0.95,
        dots: 18,
        spin: Math.random() * Math.PI,
        color: palette.ink,
      })
      if (this.spirals.length > 16) this.spirals.shift()
    }

    if (input.kind === 'key') this.keyShapes += 1
    if (!input.glyph) return

    this.glyphs.push({
      x: input.x,
      y: input.y,
      born: this.clock,
      life: 1.5,
      char: input.glyph,
      size: 64 * scale,
      color: palette.wash,
    })
    if (this.glyphs.length > 12) this.glyphs.shift()
  }

  private addDisc(x: number, y: number, radius: number, palette: Palette, life: number) {
    this.discs.push({
      x,
      y,
      born: this.clock,
      life,
      radius,
      ink: palette.ink,
      wash: palette.wash,
    })
    if (this.discs.length > 36) this.discs.shift()
  }

  private addRings(x: number, y: number, maxRadius: number, palette: Palette, count: number) {
    const colors = [palette.wash, palette.ink, palette.glow, palette.wash]
    for (let i = 0; i < count; i += 1) {
      this.rings.push({
        x,
        y,
        born: this.clock,
        delay: i * 0.08,
        life: 1.25 + i * 0.08,
        maxRadius: maxRadius * (0.55 + i * 0.18),
        width: i === 0 ? 7 : 3,
        color: colors[i] ?? palette.ink,
        alpha: 0.85,
        dotted: i === 2,
      })
    }
    if (this.rings.length > 48) this.rings.splice(0, this.rings.length - 48)
  }

  private addSparks(x: number, y: number, count: number, color: string, speed: number) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2
      const velocity = speed * (0.45 + Math.random())
      this.sparks.push({
        x,
        y,
        born: this.clock,
        life: 0.7 + Math.random() * 0.45,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        radius: 2 + Math.random() * 3.5,
        color,
      })
    }
    if (this.sparks.length > 180) this.sparks.splice(0, this.sparks.length - 180)
  }

  private seedMotes() {
    this.motes = Array.from({ length: 40 }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: 1 + Math.random() * 2.2,
      speed: 8 + Math.random() * 16,
      drift: (Math.random() - 0.5) * 12,
      phase: Math.random() * Math.PI * 2,
    }))
  }

  private readonly resize = () => {
    const rect = this.canvas.getBoundingClientRect()
    this.width = Math.max(1, rect.width)
    this.height = Math.max(1, rect.height)
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private readonly loop = (time: number) => {
    if (!this.running) return
    if (this.lastTime === 0) this.lastTime = time
    const dt = Math.min(0.05, (time - this.lastTime) / 1000)
    this.lastTime = time
    this.clock = (time - this.origin) / 1000
    this.render(dt)
    if (!this.running) return
    this.raf = requestAnimationFrame(this.loop)
  }

  private render(dt: number) {
    const rect = this.canvas.getBoundingClientRect()
    if (Math.abs(rect.width - this.width) > 1 || Math.abs(rect.height - this.height) > 1) {
      const grew = rect.width > this.width * 1.5 || rect.height > this.height * 1.5
      this.resize()
      if (grew) this.seedMotes()
    }
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const blend = 1 - Math.exp(-dt * 1.4)
    this.mood = mixHex(this.mood, this.moodTarget, blend)
    this.drawSky()
    this.drawMotes(dt)
    this.drawFlash()

    compact(this.discs, this.clock)
    compact(this.rings, this.clock)
    compact(this.flowers, this.clock)
    compact(this.spirals, this.clock)
    compact(this.glyphs, this.clock)
    compact(this.ribbon, this.clock)
    this.advanceSparks(dt)
    compact(this.sparks, this.clock)

    for (const disc of this.discs) this.drawDisc(disc)
    for (const ring of this.rings) this.drawRing(ring)
    for (const spiral of this.spirals) this.drawSpiral(spiral)
    for (const flower of this.flowers) this.drawFlower(flower)
    for (const spark of this.sparks) this.drawSpark(spark)
    this.drawRibbon()
    this.drawPointer()
    for (const glyph of this.glyphs) this.drawGlyph(glyph)
    if (this.idle) this.drawIdle()
    this.drawVignette()
  }

  private drawSky() {
    const ctx = this.ctx
    const sky = ctx.createLinearGradient(0, 0, 0, this.height)
    sky.addColorStop(0, mixHex('#2a1454', this.mood, 0.2))
    sky.addColorStop(0.55, mixHex('#1a1038', this.mood, 0.12))
    sky.addColorStop(1, mixHex('#102033', this.mood, 0.28))
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, this.width, this.height)

    const sway = this.reduced ? 0.015 : 1
    this.drawOrb(
      this.width * (0.28 + Math.sin(this.clock * 0.08 * sway) * 0.08),
      this.height * (0.32 + Math.cos(this.clock * 0.06 * sway) * 0.07),
      Math.min(this.width, this.height) * 0.48,
      this.mood,
      0.34,
    )
    this.drawOrb(
      this.width * (0.74 + Math.cos(this.clock * 0.05 * sway) * 0.07),
      this.height * (0.7 + Math.sin(this.clock * 0.07 * sway) * 0.06),
      Math.min(this.width, this.height) * 0.4,
      mixHex(this.mood, '#8EE3F5', 0.45),
      0.22,
    )
  }

  private drawOrb(x: number, y: number, radius: number, color: string, alpha: number) {
    const ctx = this.ctx
    const glow = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius)
    glow.addColorStop(0, rgba(color, alpha))
    glow.addColorStop(1, rgba(color, 0))
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawMotes(dt: number) {
    const ctx = this.ctx
    const motion = this.reduced ? 0.15 : 1
    for (const mote of this.motes) {
      mote.y -= mote.speed * dt * motion
      mote.x += mote.drift * dt * motion
      if (mote.y < -8) {
        mote.y = this.height + 8
        mote.x = Math.random() * this.width
      }
      if (mote.x < -8) mote.x = this.width + 8
      if (mote.x > this.width + 8) mote.x = -8
      const twinkle = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(this.clock * 1.4 + mote.phase))
      ctx.fillStyle = rgba('#fff8fb', 0.18 + twinkle * 0.35)
      ctx.beginPath()
      ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private drawFlash() {
    if (!this.flash) return
    const age = this.clock - this.flash.born
    if (age < 0 || age > this.flash.life) return
    this.ctx.fillStyle = rgba(this.flash.color, (1 - age / this.flash.life) * 0.13)
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  private advanceSparks(dt: number) {
    const rise = this.reduced ? 4 : 16
    for (const spark of this.sparks) {
      spark.x += spark.vx * dt
      spark.y += spark.vy * dt
      const drag = Math.exp(-1.5 * dt)
      spark.vx *= drag
      spark.vy *= drag
      spark.vy -= rise * dt
    }
  }

  private drawDisc(disc: Disc) {
    const age = this.clock - disc.born
    const progress = clamp(age / disc.life, 0, 1)
    const radius = disc.radius * (0.35 + 0.8 * easeOut(clamp(age / 0.32, 0, 1)))
    const alpha = (1 - progress) * 0.6
    const glow = this.ctx.createRadialGradient(disc.x, disc.y, radius * 0.08, disc.x, disc.y, radius)
    glow.addColorStop(0, rgba(disc.wash, alpha))
    glow.addColorStop(0.5, rgba(disc.ink, alpha * 0.5))
    glow.addColorStop(1, rgba(disc.ink, 0))
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(disc.x, disc.y, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawRing(ring: Ring) {
    const local = this.clock - ring.born - ring.delay
    if (local < 0) return
    const span = Math.max(0.2, ring.life - ring.delay)
    const progress = clamp(local / span, 0, 1)
    const radius = ring.maxRadius * easeOut(progress)
    if (radius < 1) return
    this.ctx.beginPath()
    this.ctx.arc(ring.x, ring.y, radius, 0, Math.PI * 2)
    this.ctx.strokeStyle = rgba(ring.color, (1 - progress) * ring.alpha)
    this.ctx.lineWidth = Math.max(0.6, ring.width * (1 - progress * 0.7))
    this.ctx.setLineDash(ring.dotted ? [1.5, ring.width + 9] : [])
    this.ctx.stroke()
    this.ctx.setLineDash([])
  }

  private drawFlower(flower: Flower) {
    const age = this.clock - flower.born
    const grow = easeOut(clamp(age / 0.42, 0, 1))
    const fade =
      age < flower.life * 0.6 ? 1 : 1 - (age - flower.life * 0.6) / (flower.life * 0.4)
    const alpha = clamp(fade, 0, 1)
    const radius = flower.size * grow
    const ctx = this.ctx
    ctx.save()
    ctx.translate(flower.x, flower.y)
    ctx.rotate(flower.spin + age * (this.reduced ? 0 : 0.1))
    for (let i = 0; i < flower.petals; i += 1) {
      const angle = (i / flower.petals) * Math.PI * 2
      ctx.beginPath()
      ctx.ellipse(
        Math.cos(angle) * radius * 0.4,
        Math.sin(angle) * radius * 0.4,
        radius * 0.32,
        radius * 0.18,
        angle,
        0,
        Math.PI * 2,
      )
      ctx.fillStyle = rgba(i % 2 === 0 ? flower.ink : flower.wash, 0.8 * alpha)
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(0, 0, radius * 0.18, 0, Math.PI * 2)
    ctx.fillStyle = rgba(flower.glow, 0.95 * alpha)
    ctx.fill()
    ctx.restore()
  }

  private drawSpiral(spiral: Spiral) {
    const age = this.clock - spiral.born
    const progress = clamp(age / spiral.life, 0, 1)
    const shown = Math.max(1, Math.floor(spiral.dots * Math.min(1, progress / 0.65)))
    const ctx = this.ctx
    for (let i = 0; i < shown; i += 1) {
      const unit = i / spiral.dots
      const angle = spiral.spin + unit * Math.PI * 6
      const radius = spiral.radius * unit * easeOut(Math.min(1, progress / 0.5))
      ctx.beginPath()
      ctx.arc(
        spiral.x + Math.cos(angle) * radius,
        spiral.y + Math.sin(angle) * radius,
        2.2 + unit * 5,
        0,
        Math.PI * 2,
      )
      ctx.fillStyle = rgba(spiral.color, (1 - progress) * (0.35 + unit * 0.65))
      ctx.fill()
    }
  }

  private drawSpark(spark: Spark) {
    const progress = clamp((this.clock - spark.born) / spark.life, 0, 1)
    this.ctx.fillStyle = rgba(spark.color, 1 - progress)
    this.ctx.beginPath()
    this.ctx.arc(spark.x, spark.y, spark.radius * (1 - progress * 0.4), 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawRibbon() {
    if (this.ribbon.length < 2) return
    const ctx = this.ctx
    for (let i = 1; i < this.ribbon.length; i += 1) {
      const previous = this.ribbon[i - 1]
      const point = this.ribbon[i]
      if (!previous || !point) continue
      const fade = clamp(1 - (this.clock - point.born) / point.life, 0, 1)
      ctx.beginPath()
      ctx.moveTo(previous.x, previous.y)
      ctx.lineTo(point.x, point.y)
      ctx.strokeStyle = rgba(this.mood, fade * 0.7)
      ctx.lineWidth = 3 + (i / this.ribbon.length) * 10
      ctx.stroke()
    }
  }

  private drawPointer() {
    if (!this.pointer) return
    const age = this.clock - this.pointer.at
    if (age > 1.1) return
    const alpha = 0.4 * (1 - age / 1.1)
    const radius = 42
    const glow = this.ctx.createRadialGradient(
      this.pointer.x,
      this.pointer.y,
      0,
      this.pointer.x,
      this.pointer.y,
      radius,
    )
    glow.addColorStop(0, rgba(this.mood, alpha))
    glow.addColorStop(1, rgba(this.mood, 0))
    this.ctx.fillStyle = glow
    this.ctx.beginPath()
    this.ctx.arc(this.pointer.x, this.pointer.y, radius, 0, Math.PI * 2)
    this.ctx.fill()
  }

  private drawGlyph(glyph: Glyph) {
    const age = this.clock - glyph.born
    const progress = clamp(age / glyph.life, 0, 1)
    const rise = this.reduced ? 8 : 36
    const alpha = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85
    this.ctx.font = `600 ${glyph.size}px Fredoka, sans-serif`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillStyle = rgba(glyph.color, clamp(alpha, 0, 1) * 0.9)
    this.ctx.fillText(glyph.char, glyph.x, glyph.y - progress * rise)
  }

  private drawIdle() {
    const pulse = 0.5 + 0.5 * Math.sin(this.clock * (this.reduced ? 0.6 : 1.7))
    const radius = Math.min(this.width, this.height) * (0.08 + pulse * 0.015)
    this.ctx.beginPath()
    this.ctx.arc(this.width / 2, this.height * 0.46, radius, 0, Math.PI * 2)
    this.ctx.strokeStyle = rgba('#ffe5f0', 0.22 + pulse * 0.28)
    this.ctx.lineWidth = 3
    this.ctx.stroke()
  }

  private drawVignette() {
    const radius = Math.max(this.width, this.height) * 0.72
    const shade = this.ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.25,
      this.width / 2,
      this.height / 2,
      radius,
    )
    shade.addColorStop(0, 'rgba(8, 4, 20, 0)')
    shade.addColorStop(1, 'rgba(8, 4, 20, 0.42)')
    this.ctx.fillStyle = shade
    this.ctx.fillRect(0, 0, this.width, this.height)
  }
}
