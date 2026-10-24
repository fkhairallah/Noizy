import { clamp } from '../lib/number.ts'

export type NoteKind = 'move' | 'tap' | 'key'

type NoteInput = {
  frequency: number
  harmony?: number
  kind: NoteKind
  pan: number
}

type Voice = {
  stopAt: number
  bus: GainNode
  oscs: OscillatorNode[]
}

export class SoftSynth {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private voices: Voice[] = []
  private volume = 0.6
  private failed = false
  private disposed = false
  onUnavailable: (() => void) | null = null

  setVolume(volume: number) {
    this.volume = clamp(volume, 0, 1)
    if (!this.context || !this.master) return
    this.master.gain.setTargetAtTime(this.volume * 0.85, this.context.currentTime, 0.03)
  }

  dispose() {
    this.disposed = true
    this.voices = []
    const context = this.context
    this.context = null
    this.master = null
    if (context && context.state !== 'closed') void context.close()
  }

  play(input: NoteInput) {
    if (this.disposed || this.failed || this.volume <= 0.001) return
    const context = this.ensure()
    if (!context || !this.master) return
    if (context.state === 'suspended') void context.resume()

    const now = context.currentTime
    this.prune(now)
    if (this.voices.length >= 14) this.releaseOldest(context)

    const duration = input.kind === 'move' ? 0.46 : input.kind === 'key' ? 0.9 : 1.05
    const peak = input.kind === 'move' ? 0.15 : input.kind === 'key' ? 0.19 : 0.21
    const type: OscillatorType = input.kind === 'move' ? 'triangle' : 'sine'

    const panner = context.createStereoPanner()
    panner.pan.setValueAtTime(clamp(input.pan, -0.7, 0.7), now)
    const bus = context.createGain()
    bus.gain.setValueAtTime(1, now)
    bus.connect(panner)
    panner.connect(this.master)

    const oscs = [
      this.attachTone(context, bus, input.frequency, now, duration, peak, type),
    ]

    if (input.kind !== 'move') {
      oscs.push(
        this.attachTone(context, bus, input.frequency * 2, now, duration * 0.62, peak * 0.1, 'sine'),
      )
      const sub = input.frequency / 2
      if (sub >= 130) {
        oscs.push(this.attachTone(context, bus, sub, now, duration * 0.8, peak * 0.14, 'sine'))
      }
      if (input.harmony) {
        oscs.push(
          this.attachTone(
            context,
            bus,
            input.harmony,
            now + 0.12,
            duration * 0.7,
            peak * 0.32,
            'sine',
          ),
        )
      }
    }

    this.voices.push({ stopAt: now + duration + 0.2, bus, oscs })
  }

  private ensure(): AudioContext | null {
    if (this.context) return this.context
    try {
      const context = new AudioContext()
      const master = context.createGain()
      master.gain.value = this.volume * 0.85
      const warmth = context.createBiquadFilter()
      warmth.type = 'lowpass'
      warmth.frequency.value = 2800
      warmth.Q.value = 0.45
      const compressor = context.createDynamicsCompressor()
      compressor.threshold.value = -20
      compressor.knee.value = 18
      compressor.ratio.value = 5
      compressor.attack.value = 0.004
      compressor.release.value = 0.22
      master.connect(warmth)
      warmth.connect(compressor)
      compressor.connect(context.destination)
      this.context = context
      this.master = master
      return context
    } catch {
      this.fail()
      return null
    }
  }

  private attachTone(
    context: AudioContext,
    destination: AudioNode,
    frequency: number,
    when: number,
    duration: number,
    peak: number,
    type: OscillatorType,
  ): OscillatorNode {
    const osc = context.createOscillator()
    const gain = context.createGain()
    const span = Math.max(duration, 0.08)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, when)
    // Exponential ramps must stay above zero or the note clicks.
    gain.gain.setValueAtTime(0.0001, when)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + 0.028)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + span)
    osc.connect(gain)
    gain.connect(destination)
    osc.start(when)
    osc.stop(when + span + 0.03)
    return osc
  }

  private prune(now: number) {
    this.voices = this.voices.filter((voice) => voice.stopAt > now)
  }

  private releaseOldest(context: AudioContext) {
    const oldest = this.voices.shift()
    if (!oldest) return
    const now = context.currentTime
    oldest.bus.gain.cancelScheduledValues(now)
    oldest.bus.gain.setValueAtTime(Math.max(oldest.bus.gain.value, 0.0001), now)
    oldest.bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.05)
    for (const osc of oldest.oscs) {
      try {
        osc.stop(now + 0.06)
      } catch {
        // Already stopped.
      }
    }
  }

  private fail() {
    if (this.failed) return
    this.failed = true
    this.onUnavailable?.()
  }
}
