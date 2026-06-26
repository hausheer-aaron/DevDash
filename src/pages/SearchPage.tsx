import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search as SearchIcon,
  FolderKanban,
  CheckSquare,
  FileText,
  Code2,
  TerminalSquare,
  Link2,
  BookMarked,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '@/store/store'
import { searchAll } from '@/lib/search'
import type { SearchEntity } from '@/types'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { truncate } from '@/lib/utils'

const ENTITY_ICON: Record<SearchEntity['type'], LucideIcon> = {
  project: FolderKanban,
  task: CheckSquare,
  note: FileText,
  snippet: Code2,
  command: TerminalSquare,
  link: Link2,
  resource: BookMarked,
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const data = useStore((s) => ({
    projects: s.projects,
    tasks: s.tasks,
    notes: s.notes,
    snippets: s.snippets,
    commands: s.commands,
    links: s.links,
    resources: s.resources,
  }))

  const results = useMemo(() => (query.trim() ? searchAll(data, query, 80) : []), [data, query])
  const projectName = (id: string | null) =>
    id ? data.projects.find((p) => p.id === id)?.name : undefined

  const linkFor = (e: SearchEntity): string => {
    switch (e.type) {
      case 'project':
        return `/projects/${e.item.id}`
      case 'task':
        return `/projects/${e.item.projectId}?tab=tasks`
      case 'note':
        return `/projects/${e.item.projectId}?tab=notes`
      case 'link':
        return `/projects/${e.item.projectId}?tab=links`
      case 'resource':
        return `/projects/${e.item.projectId}?tab=resources`
      case 'snippet':
        return e.item.projectId ? `/projects/${e.item.projectId}?tab=snippets` : '/snippets'
      case 'command':
        return e.item.projectId ? `/projects/${e.item.projectId}?tab=commands` : '/commands'
    }
  }

  const titleOf = (e: SearchEntity) =>
    'name' in e.item
      ? e.item.name
      : 'title' in e.item
        ? e.item.title
        : 'label' in e.item
          ? e.item.label
          : 'Untitled'

  return (
    <PageContainer>
      <PageHeader title="Search" subtitle="Find anything across your workspace." />

      <div className="relative mt-6 max-w-xl">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="Search projects, tasks, notes, snippets, commands…"
          className="h-11 pl-11 text-base"
        />
      </div>

      <div className="mt-6">
        {!query.trim() ? (
          <EmptyState
            icon={SearchIcon}
            title="Start typing to search"
            description="Results update as you type and span every project."
          />
        ) : results.length === 0 ? (
          <EmptyState icon={SearchIcon} title={`No results for “${truncate(query, 40)}”`} compact />
        ) : (
          <>
            <p className="mb-3 text-sm text-faint">
              {results.length} result{results.length === 1 ? '' : 's'}
            </p>
            <div className="space-y-1.5">
              {results.map(({ entity }) => {
                const Icon = ENTITY_ICON[entity.type]
                const owner =
                  entity.type !== 'project'
                    ? projectName('projectId' in entity.item ? entity.item.projectId : null)
                    : undefined
                return (
                  <Link
                    key={`${entity.type}-${entity.item.id}`}
                    to={linkFor(entity)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface/50 px-3.5 py-3 transition hover:border-border-strong hover:bg-surface"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-bg-subtle text-faint">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {truncate(titleOf(entity), 80)}
                      </p>
                      {owner && <p className="truncate text-xs text-faint">{owner}</p>}
                    </div>
                    <span className="shrink-0 text-xs capitalize text-faint">{entity.type}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </PageContainer>
  )
}
