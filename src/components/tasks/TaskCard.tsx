import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical, Pencil, Trash2 } from 'lucide-react'
import type { Task } from '@/types'
import { Badge, Tag } from '@/components/ui/Badge'
import { PRIORITY_META } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  overlay?: boolean
}

export function TaskCard({ task, onEdit, onDelete, overlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', status: task.status },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const priority = PRIORITY_META[task.priority]
  const overdue = task.status !== 'done' && task.dueDate != null && task.dueDate < Date.now()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group/card rounded-xl border border-border bg-surface p-3 shadow-soft transition',
        'hover:border-border-strong',
        isDragging && 'opacity-40',
        overlay && 'rotate-2 cursor-grabbing border-border-strong shadow-elevated',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none text-faint opacity-0 transition hover:text-muted group-hover/card:opacity-100 active:cursor-grabbing"
          aria-label="Drag task"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug text-fg">{task.title}</p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">{task.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover/card:opacity-100">
          <button
            onClick={() => onEdit(task)}
            className="rounded-md p-1 text-faint transition hover:bg-surface-hover hover:text-fg"
            aria-label="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task)}
            className="rounded-md p-1 text-faint transition hover:bg-danger/10 hover:text-danger"
            aria-label="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {(task.priority !== 'medium' || task.dueDate || task.tags.length > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-6">
          {task.priority !== 'medium' && (
            <Badge tone={priority.badge} className="px-1.5 py-0">
              {priority.label}
            </Badge>
          )}
          {task.dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[0.6875rem]',
                overdue ? 'text-danger' : 'text-faint',
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}
    </div>
  )
}
