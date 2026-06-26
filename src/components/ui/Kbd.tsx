import { cn } from '@/lib/utils'

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

const SYMBOLS: Record<string, string> = {
  mod: isMac ? '⌘' : 'Ctrl',
  cmd: '⌘',
  ctrl: isMac ? '⌃' : 'Ctrl',
  shift: isMac ? '⇧' : 'Shift',
  alt: isMac ? '⌥' : 'Alt',
  enter: '↵',
  esc: 'Esc',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

/** Render a keyboard shortcut. Pass keys like `["mod", "k"]`. */
export function Kbd({ keys, className }: { keys: string[]; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-border bg-bg-subtle px-1 font-sans text-[0.6875rem] font-medium text-muted shadow-soft"
        >
          {SYMBOLS[k.toLowerCase()] ?? k.toUpperCase()}
        </kbd>
      ))}
    </span>
  )
}
