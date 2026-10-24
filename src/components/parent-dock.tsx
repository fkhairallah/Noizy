import { Maximize2, Volume2, VolumeX } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

type ParentDockProps = {
  volume: number
  fullscreen: boolean
  onVolumeChange: (volume: number) => void
  onEnterFullscreen: () => void
}

export function ParentDock({
  volume,
  fullscreen,
  onVolumeChange,
  onEnterFullscreen,
}: ParentDockProps) {
  const remembered = useRef(volume > 0 ? volume : 0.6)
  const muted = volume <= 0.001

  const toggleMute = () => {
    if (!muted) {
      remembered.current = volume
      onVolumeChange(0)
      return
    }
    onVolumeChange(remembered.current > 0 ? remembered.current : 0.6)
  }

  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div
        data-garden-control
        className="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-full border border-white/20 bg-[#120a22]/65 py-2 pr-2 pl-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:max-w-md"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-pressed={muted}
          aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
          onClick={toggleMute}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
        <Slider
          aria-label="Volume"
          min={0}
          max={100}
          step={1}
          value={[Math.round(volume * 100)]}
          onValueChange={(values) => {
            const next = values[0]
            if (next === undefined) return
            onVolumeChange(next / 100)
          }}
          className="mx-1"
        />
        <span className="w-9 text-right text-sm text-white/80 tabular-nums">
          {Math.round(volume * 100)}
        </span>
        {fullscreen ? null : (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Fill the screen and hold the keys"
            onClick={onEnterFullscreen}
          >
            <Maximize2 />
          </Button>
        )}
      </div>
    </footer>
  )
}
