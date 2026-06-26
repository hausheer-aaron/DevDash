import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, MoreHorizontal, Pencil, Trash2, CheckSquare, FileText } from 'lucide-react'
import type { Project } from '@/types'
import { useStore } from '@/store/store'
import { useProjectStats } from '@/store/selectors'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/components/ui/Toast'
import { Badge, Tag } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { ProjectAvatar } from './ProjectAvatar'
import { EditProjectModal } from './EditProjectModal'
import { PRIORITY_META, STATUS_META } from '@/lib/constants'
import { cn, timeAgo } from '@/lib/utils'

export function ProjectCard({ project }: { project: Project }) {
  const stats = useProjectStats(project.id)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const deleteProject = useStore((s) => s.deleteProject)
  const confirm = useConfirm()
  const toast = useToast()
  const [editing, setEditing] = useState(false)

  const status = STATUS_META[project.status]
  const priority = PRIORITY_META[project.priority]

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete “${project.name}”?`,
      description:
        'This permanently removes the project and all of its tasks, notes, links and resources.',
      confirmLabel: 'Delete project',
      destructive: true,
    })
    if (ok) {
      deleteProject(project.id)
      toast.success('Project deleted', project.name)
    }
  }

  return (
    <>
      <motion.div
        layout
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="group relative"
      >
        <Link
          to={`/projects/${project.id}`}
          className="block h-full rounded-2xl border border-border bg-surface/60 p-4 shadow-soft transition hover:border-border-strong hover:bg-surface hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <div className="flex items-start gap-3">
            <ProjectAvatar name={project.name} colorKey={project.color} label={project.key} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-semibold text-fg">{project.name}</h3>
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted">
                {project.description || 'No description yet.'}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={status.badge} dot={status.dot}>
              {status.label}
            </Badge>
            <Badge tone={priority.badge}>{priority.label}</Badge>
            {project.tags.slice(0, 2).map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
            {project.tags.length > 2 && <Tag>+{project.tags.length - 2}</Tag>}
          </div>

          {stats.total > 0 && (
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-faint">
                <span>
                  {stats.done}/{stats.total} tasks
                </span>
                <span>{stats.progress}%</span>
              </div>
              <Progress value={stats.progress} />
            </div>
          )}

          <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-faint">
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5" /> {stats.total}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" /> {stats.notes}
            </span>
            <span className="ml-auto">{timeAgo(project.updatedAt)}</span>
          </div>
        </Link>

        {/* Hover actions */}
        <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite(project.id)
            }}
            className={cn(
              'rounded-lg p-1.5 transition hover:bg-surface-hover',
              project.favorite ? 'text-warning' : 'text-faint hover:text-fg',
            )}
            aria-label={project.favorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={cn('h-4 w-4', project.favorite && 'fill-warning')} />
          </button>
          <Menu
            trigger={
              <button
                onClick={(e) => e.preventDefault()}
                className="rounded-lg p-1.5 text-faint transition hover:bg-surface-hover hover:text-fg"
                aria-label="Project actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
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
              Delete
            </MenuItem>
          </Menu>
        </div>

        {project.favorite && (
          <span className="pointer-events-none absolute right-3 top-3 opacity-100 transition group-hover:opacity-0">
            <Star className="h-4 w-4 fill-warning text-warning" />
          </span>
        )}
      </motion.div>

      <EditProjectModal project={editing ? project : null} open={editing} onClose={() => setEditing(false)} />
    </>
  )
}
