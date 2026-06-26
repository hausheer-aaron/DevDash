/** Declarative shortcut catalogue — also rendered in the help dialog. */
export interface ShortcutDef {
  keys: string[]
  label: string
  /** For chord shortcuts like "g h", the leading key. */
  chord?: boolean
}

export const SHORTCUT_GROUPS: { title: string; items: ShortcutDef[] }[] = [
  {
    title: 'General',
    items: [
      { keys: ['mod', 'k'], label: 'Open command palette' },
      { keys: ['/'], label: 'Search everything' },
      { keys: ['n'], label: 'New project' },
      { keys: ['?'], label: 'Show keyboard shortcuts' },
      { keys: ['esc'], label: 'Close dialog / palette' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['g', 'h'], label: 'Go to dashboard', chord: true },
      { keys: ['g', 'p'], label: 'Go to projects', chord: true },
      { keys: ['g', 's'], label: 'Go to snippets', chord: true },
      { keys: ['g', 'c'], label: 'Go to commands', chord: true },
      { keys: ['g', ','], label: 'Go to settings', chord: true },
    ],
  },
]
