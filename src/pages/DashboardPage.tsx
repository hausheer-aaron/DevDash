import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FolderKanban,
  CircleDot,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  Code2,
  Star,
  Calendar,
} from 'lucide-react'
import { useStore } from '@/store/store'
import { useUI } from '@/store/ui'
import { useDashboardStats } from '@/store/selectors'
import { PageContainer, PageHeader } from '@/components/layout/PageHeader'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectAvatar } from '@/components/projects/ProjectAvatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TASK_STATUS_META } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export function DashboardPage() {
  const projects = useStore((s) => s.projects)
  const tasks = useStore((s) => s.tasks)
  const openNewProject = useUI((s) => s.openNewProject)
  const stats = useDashboardStats()

  const highlighted = useMemo(() => {
    const favs = projects.filter((p) => p.favorite)
    const base = favs.length ? favs : projects
    return [...base].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3)
  }, [projects])

  const upcoming = useMemo(() => {
    return tasks
      .filter((t) => t.status !== 'done' && t.dueDate != null)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0))
      .slice(0, 6)
  }, [tasks])

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? 'Unknown'
  const projectColor = (id: string) => projects.find((p) => p.id === id)?.color

  const greeting = getGreeting()

  return (
    <PageContainer>
      <PageHeader
        title={`${greeting} 👋`}
        subtitle="Here's what's happening across your workspace."
        actions={
          <Button variant="primary" onClick={openNewProject}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Projects" value={stats.totalProjects} hint={`${stats.activeProjects} active`} />
        <StatCard icon={CircleDot} label="Open tasks" value={stats.openTasks} hint={`${stats.completedTasks} done`} tone="text-info" />
        <StatCard icon={Clock} label="Due soon" value={stats.dueSoon} hint="next 3 days" tone="text-warning" />
        <StatCard icon={Code2} label="Snippets" value={stats.totalSnippets} hint={`${stats.totalCommands} commands`} tone="text-accent" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Highlighted projects */}
        <div className="lg:col-span-2">
          <SectionHeading
            title={projects.some((p) => p.favorite) ? 'Favorites' : 'Recent projects'}
            icon={projects.some((p) => p.favorite) ? Star : FolderKanban}
            to="/projects"
          />
          {projects.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Create your first project to get started."
              compact
              action={
                <Button variant="primary" onClick={openNewProject}>
                  <Plus className="h-4 w-4" /> New project
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {highlighted.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming tasks */}
        <div>
          <SectionHeading title="Upcoming" icon={Calendar} />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All clear"
              description="No tasks with upcoming due dates."
              compact
            />
          ) : (
            <div className="space-y-2">
              {upcoming.map((t, i) => {
                const overdue = (t.dueDate ?? 0) < Date.now()
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      to={`/projects/${t.projectId}?tab=tasks`}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface/60 p-3 transition hover:border-border-strong hover:bg-surface"
                    >
                      <ProjectAvatar
                        name={projectName(t.projectId)}
                        colorKey={projectColor(t.projectId)}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{t.title}</p>
                        <p className="mt-0.5 truncate text-xs text-faint">
                          {projectName(t.projectId)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={cn(
                            'whitespace-nowrap text-xs font-medium',
                            overdue ? 'text-danger' : 'text-muted',
                          )}
                        >
                          {t.dueDate ? formatDate(t.dueDate) : ''}
                        </span>
                        <span className={cn('text-[0.6875rem]', TASK_STATUS_META[t.status].accent)}>
                          {TASK_STATUS_META[t.status].label}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'text-fg',
}: {
  icon: LucideIcon
  label: string
  value: number
  hint?: string
  tone?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-border-strong">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className={cn('h-[18px] w-[18px]', tone)} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-fg">{value}</span>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </div>
    </div>
  )
}

function SectionHeading({
  title,
  icon: Icon,
  to,
}: {
  title: string
  icon: LucideIcon
  to?: string
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
        <Icon className="h-4 w-4 text-muted" />
        {title}
      </h2>
      {to && (
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-xs text-muted transition hover:text-fg"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
