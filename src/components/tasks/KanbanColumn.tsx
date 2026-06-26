import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Task, TaskStatus } from '@/types'
import { TaskCard } from './TaskCard'
import { TASK_STATUS_META } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  onAdd: (status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function KanbanColumn({ status, tasks, onAdd, onEdit, onDelete }: KanbanColumnProps) {
  const meta = TASK_STATUS_META[status]
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column', status } })

  return (
    <div className="flex h-full min-w-[17rem] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
          <h3 className="text-sm font-semibold text-fg">{meta.label}</h3>
          <span className="rounded-full bg-bg-subtle px-1.5 text-xs text-faint">{tasks.length}</span>
        </div>
        <button
          onClick={() => onAdd(status)}
          className="rounded-md p-1 text-faint transition hover:bg-surface-hover hover:text-fg"
          aria-label={`Add task to ${meta.label}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'scrollbar-thin flex min-h-[8rem] flex-1 flex-col gap-2 overflow-y-auto rounded-xl border border-dashed p-2 transition-colors',
          isOver ? 'border-accent/50 bg-accent/[0.03]' : 'border-border/70 bg-bg-subtle/30',
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <button
            onClick={() => onAdd(status)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-6 text-xs text-faint transition hover:text-muted"
          >
            <Plus className="h-3.5 w-3.5" /> Add task
          </button>
        )}
      </div>
    </div>
  )
}
