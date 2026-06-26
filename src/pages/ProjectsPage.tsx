import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Star, FolderKanban, X } from 'lucide-react'
import { useStore } from '@/store/store'
import { useUI } from '@/store/ui'
import { useAllProjectTags } from '@/store/selectors'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tag } from '@/components/ui/Badge'
import { PRIORITY_META, PROJECT_STATUSES, STATUS_META } from '@/lib/constants'
import type { ProjectStatus } from '@/types'
import { cn, pluralize } from '@/lib/utils'

type SortKey = 'updated' | 'created' | 'name' | 'priority'

export function ProjectsPage() {
  const projects = useStore((s) => s.projects)
  const openNewProject = useUI((s) => s.openNewProject)
  const tags = useAllProjectTags()

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [sort, setSort] = useState<SortKey>('updated')
  const [favOnly, setFavOnly] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = projects.filter((p) => {
      if (status !== 'all' && p.status !== status) return false
      if (favOnly && !p.favorite) return false
      if (activeTag && !p.tags.includes(activeTag)) return false
      if (q) {
        const hay = `${p.name} ${p.description} ${p.key} ${p.tags.join(' ')}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
    return list.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return b.createdAt - a.createdAt
        case 'priority':
          return PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight
        default:
          return b.updatedAt - a.updatedAt
      }
    })
  }, [projects, query, status, sort, favOnly, activeTag])

  const hasFilters = query || status !== 'all' || favOnly || activeTag

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        subtitle={pluralize(projects.length, 'project')}
        actions={
          <Button variant="primary" onClick={openNewProject}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter projects…"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus | 'all')}
            className="w-auto min-w-[8.5rem]"
          >
            <option value="all">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="w-auto min-w-[8.5rem]"
          >
            <option value="updated">Last updated</option>
            <option value="created">Newest</option>
            <option value="name">Name</option>
            <option value="priority">Priority</option>
          </Select>
          <Button
            variant={favOnly ? 'primary' : 'secondary'}
            size="icon"
            onClick={() => setFavOnly((v) => !v)}
            aria-label="Show favorites only"
            title="Favorites only"
          >
            <Star className={cn('h-4 w-4', favOnly && 'fill-current')} />
          </Button>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.slice(0, 12).map(({ tag, count }) => (
              <button key={tag} onClick={() => setActiveTag((t) => (t === tag ? null : tag))}>
                <Tag
                  className={cn(
                    'cursor-pointer transition',
                    activeTag === tag && 'bg-accent/15 text-accent ring-accent/30',
                  )}
                >
                  {tag} <span className="ml-1 text-faint">{count}</span>
                </Tag>
              </button>
            ))}
            {hasFilters && (
              <button
                onClick={() => {
                  setQuery('')
                  setStatus('all')
                  setFavOnly(false)
                  setActiveTag(null)
                }}
                className="ml-1 inline-flex items-center gap-1 text-xs text-faint transition hover:text-fg"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="mt-6">
        {projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start organizing your work."
            action={
              <Button variant="primary" onClick={openNewProject}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matches"
            description="Try adjusting your filters or search query."
            compact
          />
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          >
            {filtered.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </motion.div>
        )}
      </div>
    </PageContainer>
  )
}
