import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type InvitationProps = {
  awake: boolean
  notice: string | null
  onFullScreen: () => void
  onCancel: () => void
}

export function Invitation({ awake, notice, onFullScreen, onCancel }: InvitationProps) {
  return (
    <div
      aria-hidden={awake}
      inert={awake}
      className={cn(
        'pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-6 pb-28 transition-opacity duration-700',
        awake ? 'opacity-0' : 'opacity-100',
      )}
    >
      <div className="max-w-lg text-center drop-shadow-[0_10px_28px_rgba(12,6,28,0.9)]">
        <p className="font-display text-6xl tracking-tight text-white sm:text-8xl">Noizy</p>
        <p className="font-display mt-3 text-2xl text-[#ffd6e4] sm:text-3xl">for Luka</p>
        <p className="mx-auto mt-6 max-w-sm text-base leading-relaxed text-white/75 sm:text-lg">
          Wiggle the mouse, tap anywhere, or press any key. Luka can mash the keyboard — every
          touch grows a sound and a little burst of color.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            data-garden-control
            className="pointer-events-auto h-12 px-6 font-display text-base"
            aria-describedby="fullscreen-hold"
            onClick={onFullScreen}
          >
            Full screen
          </Button>
          <Button
            variant="outline"
            data-garden-control
            className="pointer-events-auto h-12 px-6 text-base text-white"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
        <p id="fullscreen-hold" className="mx-auto mt-3 max-w-xs text-sm text-white/60">
          Full screen holds Alt and the other keys. Cancel plays in this window.
        </p>
        {notice !== null ? (
          <p role="status" className="mx-auto mt-3 max-w-sm text-sm text-[#ffd6e4]">
            {notice}
          </p>
        ) : null}
      </div>
    </div>
  )
}
