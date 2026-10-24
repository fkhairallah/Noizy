type LockableKeyboard = {
  lock: () => Promise<void>
  unlock: () => void
}

export function lockableKeyboard(): LockableKeyboard | null {
  const keyboard = (navigator as Navigator & { keyboard?: Partial<LockableKeyboard> }).keyboard
  if (!keyboard || typeof keyboard.lock !== 'function' || typeof keyboard.unlock !== 'function') {
    return null
  }
  return keyboard as LockableKeyboard
}

/** Full screen first, then hold every key the browser will give up. */
export async function enterFullscreenCapture(): Promise<'locked' | 'unlocked' | 'blocked'> {
  try {
    if (document.fullscreenElement === null) {
      await document.documentElement.requestFullscreen()
    }
  } catch {
    return 'blocked'
  }

  const keyboard = lockableKeyboard()
  if (!keyboard) return 'unlocked'
  try {
    await keyboard.lock()
    return 'locked'
  } catch {
    return 'unlocked'
  }
}

export function leaveFullscreenCapture(): void {
  lockableKeyboard()?.unlock()
  if (document.fullscreenElement === null) return
  void document.exitFullscreen().catch(() => undefined)
}
