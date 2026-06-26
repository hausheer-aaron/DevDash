import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUI } from '@/store/ui'
import { isModKey, isTypingTarget } from '@/lib/utils'

/**
 * Registers all global keyboard shortcuts. Mounted once in the AppShell.
 *
 * Single-key shortcuts are suppressed while typing in a field. Chords (e.g.
 * "g" then "h") use a short timeout window after the leader key.
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const toggleCommand = useUI((s) => s.toggleCommand)
  const openCommand = useUI((s) => s.openCommand)
  const openNewProject = useUI((s) => s.openNewProject)
  const toggleShortcuts = useUI((s) => s.toggleShortcuts)
  const chord = useRef<{ key: string; at: number } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Command palette — works even while typing.
      if (isModKey(e) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleCommand()
        return
      }

      if (isTypingTarget(e.target)) return

      // Resolve a pending chord (leader key was pressed recently).
      const pending = chord.current
      if (pending && Date.now() - pending.at < 1200 && pending.key === 'g') {
        const dest: Record<string, string> = {
          h: '/',
          p: '/projects',
          s: '/snippets',
          c: '/commands',
          ',': '/settings',
        }
        const target = dest[e.key.toLowerCase()] ?? dest[e.key]
        if (target) {
          e.preventDefault()
          navigate(target)
        }
        chord.current = null
        return
      }

      // Ignore modified keys for single-key shortcuts.
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key) {
        case 'g':
          chord.current = { key: 'g', at: Date.now() }
          break
        case '/':
          e.preventDefault()
          openCommand()
          break
        case 'n':
          e.preventDefault()
          openNewProject()
          break
        case '?':
          e.preventDefault()
          toggleShortcuts()
          break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, toggleCommand, openCommand, openNewProject, toggleShortcuts])
}
