import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Code2,
  TerminalSquare,
  Settings,
  Plus,
  Star,
  FileText,
  CheckSquare,
  Link2,
  BookMarked,
  Sun,
  Moon,
  Search as SearchIcon,
  CornerDownLeft,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { useUI } from '@/store/ui'
import { searchAll } from '@/lib/search'
import type { SearchEntity } from '@/types'
import { ProjectAvatar } from '@/components/projects/ProjectAvatar'
import { Kbd } from '@/components/ui/Kbd'
import { cn, truncate } from '@/lib/utils'

const ENTITY_ICON = {
  project: FolderKanban,
  task: CheckSquare,
  note: FileText,
  snippet: Code2,
  command: TerminalSquare,
  link: Link2,
  resource: BookMarked,
} as const

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen)
  const close = useUI((s) => s.closeCommand)
  const openNewProject = useUI((s) => s.openNewProject)
  const navigate = useNavigate()

  const data = useStore((s) => ({
    projects: s.projects,
    tasks: s.tasks,
    notes: s.notes,
    snippets: s.snippets,
    commands: s.commands,
    links: s.links,
    resources: s.resources,
  }))
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)

  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchAll(data, query, 24)
  }, [data, query])

  const recentProjects = useMemo(
    () => [...data.projects].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5),
    [data.projects],
  )

  const run = (fn: () => void) => {
    close()
    // Defer navigation so the palette can unmount cleanly first.
    requestAnimationFrame(fn)
  }

  const gotoEntity = (entity: SearchEntity) => {
    switch (entity.type) {
      case 'project':
        return run(() => navigate(`/projects/${entity.item.id}`))
      case 'task':
        return run(() => navigate(`/projects/${entity.item.projectId}?tab=tasks`))
      case 'note':
        return run(() => navigate(`/projects/${entity.item.projectId}?tab=notes`))
      case 'link':
        return run(() => navigate(`/projects/${entity.item.projectId}?tab=links`))
      case 'resource':
        return run(() => navigate(`/projects/${entity.item.projectId}?tab=resources`))
      case 'snippet':
        return run(() =>
          navigate(
            entity.item.projectId
              ? `/projects/${entity.item.projectId}?tab=snippets`
              : '/snippets',
          ),
        )
      case 'command':
        return run(() =>
          navigate(
            entity.item.projectId
              ? `/projects/${entity.item.projectId}?tab=commands`
              : '/commands',
          ),
        )
    }
  }

  const projectName = (id: string | null) =>
    id ? data.projects.find((p) => p.id === id)?.name : undefined

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh] sm:pt-[16vh]">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={close}
          />
          <motion.div
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-elevated shadow-elevated"
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <Command shouldFilter={false} loop className="flex flex-col">
              <div className="flex items-center gap-2.5 border-b border-border px-4">
                <SearchIcon className="h-[18px] w-[18px] shrink-0 text-faint" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search projects, tasks, notes, snippets…"
                  className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
                />
                <button
                  onClick={close}
                  className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.6875rem] text-faint sm:block"
                >
                  Esc
                </button>
              </div>

              <Command.List className="scrollbar-thin max-h-[60vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-faint">
                  No results for “{truncate(query, 40)}”.
                </Command.Empty>

                {query.trim() && results.length > 0 && (
                  <Command.Group
                    heading="Results"
                    className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint"
                  >
                    {results.map(({ entity }) => {
                      const Icon = ENTITY_ICON[entity.type]
                      const title =
                        'name' in entity.item
                          ? entity.item.name
                          : 'title' in entity.item
                            ? entity.item.title
                            : 'label' in entity.item
                              ? entity.item.label
                              : 'Untitled'
                      const owner =
                        entity.type !== 'project'
                          ? projectName(
                              'projectId' in entity.item ? entity.item.projectId : null,
                            )
                          : undefined
                      return (
                        <Item
                          key={`${entity.type}-${entity.item.id}`}
                          value={`${entity.type}-${entity.item.id}-${title}`}
                          onSelect={() => gotoEntity(entity)}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-faint" />
                          <span className="flex-1 truncate text-fg">{truncate(title, 60)}</span>
                          <span className="shrink-0 text-[0.6875rem] capitalize text-faint">
                            {owner ? `${owner} · ` : ''}
                            {entity.type}
                          </span>
                        </Item>
                      )
                    })}
                  </Command.Group>
                )}

                {!query.trim() && (
                  <>
                    <Command.Group
                      heading="Actions"
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint"
                    >
                      <Item value="new project" onSelect={() => run(openNewProject)}>
                        <Plus className="h-4 w-4 text-faint" />
                        <span className="flex-1 text-fg">Create new project</span>
                        <Kbd keys={['n']} />
                      </Item>
                      <Item
                        value="toggle theme"
                        onSelect={() =>
                          updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })
                        }
                      >
                        {theme === 'dark' ? (
                          <Sun className="h-4 w-4 text-faint" />
                        ) : (
                          <Moon className="h-4 w-4 text-faint" />
                        )}
                        <span className="flex-1 text-fg">
                          Switch to {theme === 'dark' ? 'light' : 'dark'} theme
                        </span>
                      </Item>
                    </Command.Group>

                    <Command.Group
                      heading="Navigate"
                      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint"
                    >
                      <NavItem icon={LayoutDashboard} label="Dashboard" onSelect={() => run(() => navigate('/'))} />
                      <NavItem icon={FolderKanban} label="Projects" onSelect={() => run(() => navigate('/projects'))} />
                      <NavItem icon={Code2} label="Snippets" onSelect={() => run(() => navigate('/snippets'))} />
                      <NavItem icon={TerminalSquare} label="Commands" onSelect={() => run(() => navigate('/commands'))} />
                      <NavItem icon={Settings} label="Settings" onSelect={() => run(() => navigate('/settings'))} />
                    </Command.Group>

                    {recentProjects.length > 0 && (
                      <Command.Group
                        heading="Recent projects"
                        className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[0.6875rem] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-faint"
                      >
                        {recentProjects.map((p) => (
                          <Item
                            key={p.id}
                            value={`recent-${p.id}-${p.name}`}
                            onSelect={() => run(() => navigate(`/projects/${p.id}`))}
                          >
                            <ProjectAvatar name={p.name} colorKey={p.color} label={p.key} size="sm" />
                            <span className="flex-1 truncate text-fg">{p.name}</span>
                            {p.favorite && <Star className="h-3.5 w-3.5 fill-warning text-warning" />}
                          </Item>
                        ))}
                      </Command.Group>
                    )}
                  </>
                )}
              </Command.List>

              <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[0.6875rem] text-faint">
                <span className="flex items-center gap-1.5">
                  <CornerDownLeft className="h-3 w-3" /> to select
                </span>
                <span className="flex items-center gap-1.5">
                  <Kbd keys={['up']} />
                  <Kbd keys={['down']} /> to navigate
                </span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function Item({
  value,
  onSelect,
  children,
}: {
  value: string
  onSelect: () => void
  children: React.ReactNode
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm',
        'data-[selected=true]:bg-surface-hover data-[selected=true]:text-fg',
      )}
    >
      {children}
    </Command.Item>
  )
}

function NavItem({
  icon: Icon,
  label,
  onSelect,
}: {
  icon: typeof LayoutDashboard
  label: string
  onSelect: () => void
}) {
  return (
    <Item value={`nav-${label}`} onSelect={onSelect}>
      <Icon className="h-4 w-4 text-faint" />
      <span className="flex-1 text-fg">{label}</span>
    </Item>
  )
}
