import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Star,
  Pencil,
  Trash2,
  MoreHorizontal,
  LayoutGrid,
  CheckSquare,
  FileText,
  Code2,
  TerminalSquare,
  Link2,
  BookMarked,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore } from '@/store/store'
import { useProject, useProjectStats } from '@/store/selectors'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/components/ui/Toast'
import { PageContainer } from '@/components/layout/PageHeader'
import { Badge, Tag } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProjectAvatar } from '@/components/projects/ProjectAvatar'
import { EditProjectModal } from '@/components/projects/EditProjectModal'
import { ProjectOverview } from '@/components/projects/ProjectOverview'
import { KanbanBoard } from '@/components/tasks/KanbanBoard'
import { NotesView } from '@/components/notes/NotesView'
import { SnippetsView } from '@/components/snippets/SnippetsView'
import { CommandsView } from '@/components/commands/CommandsView'
import { LinksView } from '@/components/links/LinksView'
import { ResourcesView } from '@/components/resources/ResourcesView'
import { PRIORITY_META, STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'

type TabKey = 'overview' | 'tasks' | 'notes' | 'snippets' | 'commands' | 'links' | 'resources'

const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutGrid },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'notes', label: 'Notes', icon: FileText },
  { key: 'snippets', label: 'Snippets', icon: Code2 },
  { key: 'commands', label: 'Commands', icon: TerminalSquare },
  { key: 'links', label: 'Links', icon: Link2 },
  { key: 'resources', label: 'Resources', icon: BookMarked },
]

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const project = useProject(projectId)
  const stats = useProjectStats(projectId ?? '')
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const deleteProject = useStore((s) => s.deleteProject)
  const confirm = useConfirm()
  const toast = useToast()
  const [editing, setEditing] = useState(false)

  if (!project) {
    return (
      <PageContainer>
        <EmptyState
          icon={LayoutGrid}
          title="Project not found"
          description="It may have been deleted or the link is incorrect."
          action={
            <Button variant="primary" onClick={() => navigate('/projects')}>
              Back to projects
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const rawTab = searchParams.get('tab') as TabKey | null
  const activeTab: TabKey = TABS.some((t) => t.key === rawTab) ? (rawTab as TabKey) : 'overview'
  const setTab = (tab: TabKey) =>
    setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })

  const counts: Record<TabKey, number | null> = {
    overview: null,
    tasks: stats.total,
    notes: stats.notes,
    snippets: stats.snippets,
    commands: stats.commands,
    links: stats.links,
    resources: stats.resources,
  }

  const status = STATUS_META[project.status]
  const priority = PRIORITY_META[project.priority]

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete “${project.name}”?`,
      description: 'This permanently removes the project and everything inside it.',
      confirmLabel: 'Delete project',
      destructive: true,
    })
    if (ok) {
      deleteProject(project.id)
      toast.success('Project deleted', project.name)
      navigate('/projects')
    }
  }

  return (
    <PageContainer>
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" /> Projects
      </Link>

      {/* Header */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <ProjectAvatar name={project.name} colorKey={project.color} label={project.key} size="xl" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">
                {project.name}
              </h1>
              <Badge tone={status.badge} dot={status.dot}>
                {status.label}
              </Badge>
              <Badge tone={priority.badge}>{priority.label}</Badge>
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>
            )}
            {project.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {project.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => toggleFavorite(project.id)}
            aria-label="Toggle favorite"
          >
            <Star className={cn('h-4 w-4', project.favorite && 'fill-warning text-warning')} />
          </Button>
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Menu
            trigger={
              <Button variant="secondary" size="icon" aria-label="Project actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          >
            <MenuItem icon={Pencil} onClick={() => setEditing(true)}>
              Edit project
            </MenuItem>
            <MenuItem
              icon={Star}
              onClick={() => toggleFavorite(project.id)}
            >
              {project.favorite ? 'Remove favorite' : 'Add favorite'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={Trash2} destructive onClick={onDelete}>
              Delete project
            </MenuItem>
          </Menu>
        </div>
      </div>

      {/* Tabs */}
      <div className="scrollbar-thin mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => {
          const active = t.key === activeTab
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition',
                active ? 'text-fg' : 'text-muted hover:text-fg',
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {counts[t.key] !== null && counts[t.key]! > 0 && (
                <span className="rounded-full bg-bg-subtle px-1.5 text-[0.6875rem] text-faint">
                  {counts[t.key]}
                </span>
              )}
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'overview' && <ProjectOverview project={project} />}
        {activeTab === 'tasks' && <KanbanBoard projectId={project.id} />}
        {activeTab === 'notes' && <NotesView projectId={project.id} />}
        {activeTab === 'snippets' && <SnippetsView projectId={project.id} />}
        {activeTab === 'commands' && <CommandsView projectId={project.id} />}
        {activeTab === 'links' && <LinksView projectId={project.id} />}
        {activeTab === 'resources' && <ResourcesView projectId={project.id} />}
      </div>

      <EditProjectModal project={editing ? project : null} open={editing} onClose={() => setEditing(false)} />
    </PageContainer>
  )
}
