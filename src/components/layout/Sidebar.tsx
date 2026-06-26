import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Code2,
  TerminalSquare,
  Settings,
  Search,
  Star,
  Plus,
  Keyboard,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { useUI } from '@/store/ui'
import { Kbd } from '@/components/ui/Kbd'
import { ProjectAvatar } from '@/components/projects/ProjectAvatar'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/snippets', label: 'Snippets', icon: Code2, end: false },
  { to: '/commands', label: 'Commands', icon: TerminalSquare, end: false },
]

export function Sidebar() {
  const navigate = useNavigate()
  const favorites = useStore((s) => s.projects.filter((p) => p.favorite))
  const openCommand = useUI((s) => s.openCommand)
  const openNewProject = useUI((s) => s.openNewProject)
  const toggleShortcuts = useUI((s) => s.toggleShortcuts)
  const setMobileNav = useUI((s) => s.setMobileNav)

  return (
    <div className="flex h-full flex-col gap-1 px-3 py-4">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pb-3">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-muted text-accent-fg shadow-glow">
          <Code2 className="h-[18px] w-[18px]" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-fg">DevDash</div>
          <div className="text-[0.6875rem] text-faint">Developer workspace</div>
        </div>
      </div>

      {/* Search */}
      <button
        onClick={openCommand}
        className="group mb-1 flex items-center gap-2.5 rounded-lg border border-border bg-bg-subtle px-2.5 py-2 text-sm text-faint transition hover:border-border-strong hover:text-muted"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search…</span>
        <Kbd keys={['mod', 'k']} />
      </button>

      {/* Primary nav */}
      <nav className="space-y-0.5">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileNav(false)}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-surface text-fg shadow-soft ring-1 ring-inset ring-border'
                  : 'text-muted hover:bg-surface-hover hover:text-fg',
              )
            }
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Favorites */}
      <div className="mt-4 flex items-center justify-between px-2.5 pb-1">
        <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-faint">
          Favorites
        </span>
        <button
          onClick={openNewProject}
          className="rounded p-0.5 text-faint transition hover:bg-surface-hover hover:text-fg"
          aria-label="New project"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto">
        {favorites.length === 0 ? (
          <p className="px-2.5 py-2 text-xs leading-relaxed text-faint">
            Star a project to pin it here.
          </p>
        ) : (
          favorites.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                navigate(`/projects/${p.id}`)
                setMobileNav(false)
              }}
              className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-muted transition hover:bg-surface-hover hover:text-fg"
            >
              <ProjectAvatar name={p.name} colorKey={p.color} label={p.key} size="sm" />
              <span className="flex-1 truncate">{p.name}</span>
              <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
            </button>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 space-y-0.5 border-t border-border pt-2">
        <NavLink
          to="/settings"
          onClick={() => setMobileNav(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition',
              isActive
                ? 'bg-surface text-fg ring-1 ring-inset ring-border'
                : 'text-muted hover:bg-surface-hover hover:text-fg',
            )
          }
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </NavLink>
        <button
          onClick={toggleShortcuts}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition hover:bg-surface-hover hover:text-fg"
        >
          <Keyboard className="h-[18px] w-[18px]" />
          <span className="flex-1 text-left">Shortcuts</span>
          <Kbd keys={['?']} />
        </button>
      </div>
    </div>
  )
}
