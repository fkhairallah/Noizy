type ExitFullscreenProps = {
  onExit: () => void
}

export function ExitFullscreen({ onExit }: ExitFullscreenProps) {
  return (
    <div
      data-garden-control
      className="absolute top-5 right-5 z-30 flex flex-col items-end gap-1 sm:top-8 sm:right-8"
    >
      <button
        type="button"
        aria-describedby="exit-fullscreen-hint"
        className="rounded-full border border-white/25 bg-[#120a22]/75 px-4 py-2 text-sm font-medium text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl hover:bg-white/10"
        onDoubleClick={onExit}
      >
        Exit
      </button>
      <p id="exit-fullscreen-hint" className="pointer-events-none pr-1 text-xs tracking-wide text-white/70">
        Double-click
      </p>
    </div>
  )
}
