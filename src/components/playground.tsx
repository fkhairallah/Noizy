import { useEffect, useRef, useState } from 'react'
import { SoftSynth } from '@/audio/synth'
import { Invitation } from '@/components/invitation'
import { ParentDock } from '@/components/parent-dock'
import { harmonyIndex, keyPosition, noteIndexForKey, noteIndexForPoint, printableKey, SCALE } from '@/lib/music'
import { clamp } from '@/lib/number'
import { readVolume, writeVolume } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { Scene } from '@/visual/scene'

function inParentDock(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest('[data-parent-dock]'))
}

export function Playground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const synthRef = useRef<SoftSynth | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const [awake, setAwake] = useState(false)
  const [volume, setVolume] = useState(readVolume)
  const [fullscreen, setFullscreen] = useState(false)
  const [surfaceError, setSurfaceError] = useState(false)
  const [audioMessage, setAudioMessage] = useState<string | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let scene: Scene
    try {
      scene = new Scene(canvas)
    } catch {
      queueMicrotask(() => setSurfaceError(true))
      return
    }

    const synth = new SoftSynth()
    synth.setVolume(readVolume())
    synth.onUnavailable = () => {
      setAudioMessage('Sound is unavailable in this browser. The colors will still answer.')
    }
    sceneRef.current = scene
    synthRef.current = synth
    scene.start()

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotion = () => scene.setReducedMotion(motion.matches)
    applyMotion()
    motion.addEventListener('change', applyMotion)

    const pointers = new Map<number, { x: number; y: number; distance: number; lastSound: number }>()
    let keyCursor = 0
    let woke = false

    const wake = () => {
      if (woke) return
      woke = true
      scene.setIdle(false)
      setAwake(true)
    }

    const playAt = (x: number, y: number, index: number, kind: 'move' | 'tap' | 'key', glyph: string | null) => {
      wake()
      scene.spawn({ x, y, kind, glyph, paletteIndex: index })
      const width = Math.max(window.innerWidth, 1)
      synth.play({
        frequency: SCALE[index] ?? SCALE[0],
        harmony: kind === 'move' ? undefined : SCALE[harmonyIndex(index)],
        kind,
        pan: clamp(x / width, 0, 1) * 2 - 1,
      })
    }

    const onPointerDown = (event: PointerEvent) => {
      if (inParentDock(event.target)) return
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        distance: 0,
        lastSound: performance.now(),
      })
      const index = noteIndexForPoint(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
      playAt(event.clientX, event.clientY, index, 'tap', null)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (inParentDock(event.target)) return
      scene.follow(event.clientX, event.clientY)
      const previous = pointers.get(event.pointerId)
      if (!previous) {
        pointers.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
          distance: 0,
          lastSound: 0,
        })
        return
      }
      const distance = previous.distance + Math.hypot(event.clientX - previous.x, event.clientY - previous.y)
      const now = performance.now()
      const waited = now - previous.lastSound
      if ((distance >= 18 && waited >= 100) || (distance >= 2 && waited >= 260)) {
        const index = noteIndexForPoint(event.clientX, event.clientY, window.innerWidth, window.innerHeight)
        playAt(event.clientX, event.clientY, index, 'move', null)
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, distance: 0, lastSound: now })
        return
      }
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        distance,
        lastSound: previous.lastSound,
      })
    }

    const onPointerDone = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || inParentDock(event.target)) return
      const point = keyPosition(keyCursor, window.innerWidth, window.innerHeight)
      keyCursor += 1
      playAt(point.x, point.y, noteIndexForKey(event.code), 'key', printableKey(event.key))
      if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault()
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerDone)
    window.addEventListener('pointercancel', onPointerDone)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      motion.removeEventListener('change', applyMotion)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerDone)
      window.removeEventListener('pointercancel', onPointerDone)
      window.removeEventListener('keydown', onKeyDown)
      scene.stop()
      synth.dispose()
      sceneRef.current = null
      synthRef.current = null
    }
  }, [])

  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  const commitVolume = (next: number) => {
    const safe = clamp(next, 0, 1)
    setVolume(safe)
    synthRef.current?.setVolume(safe)
    writeVolume(safe)
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
      return
    }
    void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  if (surfaceError) {
    return (
      <main className="flex h-dvh items-center justify-center bg-[#140c28] px-6 text-center text-white">
        <div className="max-w-md">
          <h1 className="font-display text-5xl">Noizy</h1>
          <p className="mt-4 text-lg text-white/80">
            The drawing canvas could not start in this browser. Try the latest Chrome, Edge, or
            Firefox.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#140c28] text-white">
      <h1 className="sr-only">Noizy, a sound and color garden for Luka</h1>
      <p className="sr-only">
        Move the mouse, touch the screen, or press any key. Each one plays a soft musical note and
        paints a colorful pattern. Volume and full screen controls sit along the bottom.
      </p>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" aria-hidden="true" />
      <Invitation awake={awake} />
      <div
        className={cn(
          'pointer-events-none absolute top-5 left-5 z-20 transition-opacity duration-700 sm:top-8 sm:left-8',
          awake ? 'opacity-100' : 'opacity-0',
        )}
      >
        <p className="font-display text-3xl text-white sm:text-4xl">Noizy</p>
        <p className="text-sm tracking-wide text-white/70">for Luka</p>
        {audioMessage !== null ? (
          <p role="status" className="mt-2 max-w-xs text-sm text-[#ffd6e4]">
            {audioMessage}
          </p>
        ) : null}
      </div>
      <ParentDock
        volume={volume}
        fullscreen={fullscreen}
        onVolumeChange={commitVolume}
        onToggleFullscreen={toggleFullscreen}
      />
    </main>
  )
}
