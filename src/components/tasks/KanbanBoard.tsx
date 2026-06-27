import { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { CheckCircle2 } from 'lucide-react'
import type { Task, TaskStatus } from '@/types'
import { useStore } from '@/store/store'
import { useProjectTasks } from '@/store/selectors'
import { useConfirm } from '@/components/ui/Confirm'
import { TASK_STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'

type Columns = Record<TaskStatus, Task[]>

function groupByStatus(tasks: Task[]): Columns {
  const cols = { backlog: [], todo: [], in_progress: [], done: [] } as Columns
  for (const t of tasks) cols[t.status].push(t)
  for (const s of TASK_STATUSES) cols[s].sort((a, b) => a.order - b.order)
  return cols
}

export function KanbanBoard({ projectId }: { projectId: string }) {
  const tasks = useProjectTasks(projectId)
  const reorderTasks = useStore((s) => s.reorderTasks)
  const deleteTask = useStore((s) => s.deleteTask)
  const showCompleted = useStore((s) => s.settings.showCompletedTasks)
  const confirm = useConfirm()

  // The Done column is hidden when "show completed tasks" is off. Hidden tasks
  // stay in state (and keep their order) — they reappear when re-enabled.
  const visibleStatuses = showCompleted
    ? TASK_STATUSES
    : TASK_STATUSES.filter((s) => s !== 'done')

  const [columns, setColumns] = useState<Columns>(() => groupByStatus(tasks))
  const columnsRef = useRef(columns)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  // Keep local columns synced with the store except while actively dragging.
  useEffect(() => {
    if (!activeId) {
      const next = groupByStatus(tasks)
      columnsRef.current = next
      setColumns(next)
    }
  }, [tasks, activeId])

  const commitColumns = (next: Columns) => {
    columnsRef.current = next
    setColumns(next)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeTask = useMemo(
    () => (activeId ? tasks.find((t) => t.id === activeId) ?? null : null),
    [activeId, tasks],
  )

  const findColumn = (id: string, source = columnsRef.current): TaskStatus | undefined => {
    if (TASK_STATUSES.includes(id as TaskStatus)) return id as TaskStatus
    return (Object.keys(source) as TaskStatus[]).find((s) =>
      source[s].some((t) => t.id === id),
    )
  }

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id))

  const onDragOver = (e: DragOverEvent) => {
    const { active, over } = e
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const from = findColumn(activeIdStr)
    const to = findColumn(overIdStr)
    if (!from || !to || from === to) return

    const next = moveAcrossColumns(columnsRef.current, activeIdStr, overIdStr, from, to)
    if (next) commitColumns(next)
  }

  const moveAcrossColumns = (
    prev: Columns,
    activeIdStr: string,
    overIdStr: string,
    from: TaskStatus,
    to: TaskStatus,
  ): Columns | null => {
    const fromItems = [...prev[from]]
    const toItems = [...prev[to]]
    const movingIdx = fromItems.findIndex((t) => t.id === activeIdStr)
    if (movingIdx === -1) return null
    const [moving] = fromItems.splice(movingIdx, 1)
    const overIdx = toItems.findIndex((t) => t.id === overIdStr)
    const insertAt = overIdx === -1 ? toItems.length : overIdx
    toItems.splice(insertAt, 0, { ...moving, status: to })
    return { ...prev, [from]: fromItems, [to]: toItems }
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const latest = columnsRef.current
    const from = findColumn(activeIdStr, latest)
    const to = findColumn(overIdStr, latest)
    if (!from || !to) return

    let next = latest
    if (from === to) {
      const items = latest[from]
      const oldIdx = items.findIndex((t) => t.id === activeIdStr)
      const newIdx = items.findIndex((t) => t.id === overIdStr)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        next = { ...latest, [from]: arrayMove(items, oldIdx, newIdx) }
        commitColumns(next)
      }
    } else {
      const moved = moveAcrossColumns(latest, activeIdStr, overIdStr, from, to)
      if (moved) {
        next = moved
        commitColumns(next)
      }
    }

    // Persist normalized orders + statuses for every column.
    const updates: { id: string; status: TaskStatus; order: number }[] = []
    for (const status of TASK_STATUSES) {
      next[status].forEach((t, i) => updates.push({ id: t.id, status, order: i }))
    }
    reorderTasks(updates)
  }

  const handleAdd = (status: TaskStatus) => {
    setEditingTask(null)
    setDefaultStatus(status)
    setFormOpen(true)
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleDelete = async (task: Task) => {
    const ok = await confirm({
      title: 'Delete task?',
      description: `“${task.title}” will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteTask(task.id)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-2">
          {visibleStatuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
          {!showCompleted && <CompleteDropZone count={columns.done.length} />}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskForm
        projectId={projectId}
        task={editingTask}
        defaultStatus={defaultStatus}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </>
  )
}

function CompleteDropZone({ count }: { count: number }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'done', data: { type: 'column', status: 'done' } })

  return (
    <div className="flex h-full min-w-[11rem] flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="h-2 w-2 rounded-full bg-success" />
        <h3 className="text-sm font-semibold text-fg">Complete</h3>
        {count > 0 && <span className="rounded-full bg-bg-subtle px-1.5 text-xs text-faint">{count}</span>}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-[8rem] flex-1 items-center justify-center rounded-xl border border-dashed p-3 text-center text-xs transition-colors',
          isOver ? 'border-success/60 bg-success/[0.04] text-success' : 'border-border/70 bg-bg-subtle/20 text-faint',
        )}
      >
        <span className="flex flex-col items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          Drop here to mark done
        </span>
      </div>
    </div>
  )
}
