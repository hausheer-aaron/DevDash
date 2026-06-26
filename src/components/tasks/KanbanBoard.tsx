import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '@/types'
import { useStore } from '@/store/store'
import { useProjectTasks } from '@/store/selectors'
import { useConfirm } from '@/components/ui/Confirm'
import { TASK_STATUSES } from '@/lib/constants'
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
  const confirm = useConfirm()

  const [columns, setColumns] = useState<Columns>(() => groupByStatus(tasks))
  const [activeId, setActiveId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo')

  // Keep local columns synced with the store except while actively dragging.
  useEffect(() => {
    if (!activeId) setColumns(groupByStatus(tasks))
  }, [tasks, activeId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const activeTask = useMemo(
    () => (activeId ? tasks.find((t) => t.id === activeId) ?? null : null),
    [activeId, tasks],
  )

  const findColumn = (id: string): TaskStatus | undefined => {
    if (TASK_STATUSES.includes(id as TaskStatus)) return id as TaskStatus
    return (Object.keys(columns) as TaskStatus[]).find((s) =>
      columns[s].some((t) => t.id === id),
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

    setColumns((prev) => {
      const fromItems = [...prev[from]]
      const toItems = [...prev[to]]
      const movingIdx = fromItems.findIndex((t) => t.id === activeIdStr)
      if (movingIdx === -1) return prev
      const [moving] = fromItems.splice(movingIdx, 1)
      const overIdx = toItems.findIndex((t) => t.id === overIdStr)
      const insertAt = overIdx === -1 ? toItems.length : overIdx
      toItems.splice(insertAt, 0, { ...moving, status: to })
      return { ...prev, [from]: fromItems, [to]: toItems }
    })
  }

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    if (!over) return
    const activeIdStr = String(active.id)
    const overIdStr = String(over.id)
    const from = findColumn(activeIdStr)
    const to = findColumn(overIdStr)
    if (!from || !to) return

    let next = columns
    if (from === to) {
      const items = columns[from]
      const oldIdx = items.findIndex((t) => t.id === activeIdStr)
      const newIdx = items.findIndex((t) => t.id === overIdStr)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        next = { ...columns, [from]: arrayMove(items, oldIdx, newIdx) }
        setColumns(next)
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
          {TASK_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columns[status]}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
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
