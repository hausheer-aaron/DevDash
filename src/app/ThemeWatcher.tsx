import { useEffect } from 'react'
import { useStore } from '@/store/store'
import { ACCENT_SWATCHES } from '@/lib/constants'

/**
 * Side-effect-only component that keeps the <html> element in sync with the
 * user's theme + accent settings. Listens to OS theme changes when in
 * "system" mode. Renders nothing.
 */
export function ThemeWatcher() {
  const theme = useStore((s) => s.settings.theme)
  const accent = useStore((s) => s.settings.accent)
  const reduceMotion = useStore((s) => s.settings.reduceMotion)

  // Theme (dark / light / system)
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const dark =
        theme === 'dark'
          ? true
          : theme === 'light'
            ? false
            : window.matchMedia('(prefers-color-scheme: dark)').matches
      root.classList.toggle('dark', dark)
      root.classList.toggle('light', !dark)
    }
    apply()
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])

  // Accent color → CSS variables
  useEffect(() => {
    const swatch = ACCENT_SWATCHES[accent] ?? ACCENT_SWATCHES.indigo
    const rgb = hexToRgb(swatch.from)
    const rgbMuted = hexToRgb(swatch.to)
    const root = document.documentElement
    if (rgb) root.style.setProperty('--accent', rgb)
    if (rgbMuted) root.style.setProperty('--accent-muted', rgbMuted)
  }, [accent])

  // Respect the in-app reduce-motion preference globally.
  useEffect(() => {
    document.documentElement.classList.toggle('motion-reduce', reduceMotion)
  }, [reduceMotion])

  return null
}

function hexToRgb(hex: string): string | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return `${parseInt(m[1], 16)} ${parseInt(m[2], 16)} ${parseInt(m[3], 16)}`
}
