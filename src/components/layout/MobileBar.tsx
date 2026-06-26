import { Menu, Search, Code2 } from 'lucide-react'
import { useUI } from '@/store/ui'

/** Compact top bar shown only on small screens (desktop uses the sidebar). */
export function MobileBar() {
  const setMobileNav = useUI((s) => s.setMobileNav)
  const openCommand = useUI((s) => s.openCommand)

  return (
    <header className="glass sticky top-0 z-30 flex items-center gap-2 border-b border-border px-3 py-2.5 lg:hidden">
      <button
        onClick={() => setMobileNav(true)}
        className="rounded-lg p-2 text-muted transition hover:bg-surface-hover hover:text-fg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-muted text-accent-fg">
          <Code2 className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">DevDash</span>
      </div>
      <button
        onClick={openCommand}
        className="rounded-lg p-2 text-muted transition hover:bg-surface-hover hover:text-fg"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
    </header>
  )
}
