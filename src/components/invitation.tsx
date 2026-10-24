import { cn } from '@/lib/utils'

type InvitationProps = {
  awake: boolean
}

export function Invitation({ awake }: InvitationProps) {
  return (
    <div
      aria-hidden={awake}
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
      </div>
    </div>
  )
}
