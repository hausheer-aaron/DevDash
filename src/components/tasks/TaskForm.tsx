import { useState } from 'react'
import type { Priority, Task, TaskStatus } from '@/types'
import { useStore } from '@/store/store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { PRIORITIES, PRIORITY_META, TASK_STATUSES, TASK_STATUS_META } from '@/lib/constants'
import { fromDateInput, parseTags, toDateInput } from '@/lib/utils'

interface TaskFormProps {
  projectId: string
  task?: Task | null
  defaultStatus?: TaskStatus
  open: boolean
  onClose: () => void
}

export function TaskForm({ projectId, task, defaultStatus = 'todo', open, onClose }: TaskFormProps) {
  const addTask = useStore((s) => s.addTask)
  const updateTask = useStore((s) => s.updateTask)
  const editing = Boolean(task)

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? defaultStatus)
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium')
  const [due, setDue] = useState(toDateInput(task?.dueDate ?? null))
  const [tags, setTags] = useState((task?.tags ?? []).join(', '))
  const [error, setError] = useState('')

  // Re-seed local state when the target task changes (modal reused across rows).
  const key = task?.id ?? 'new'
  const [seededKey, setSeededKey] = useState(key)
  if (seededKey !== key) {
    setSeededKey(key)
    setTitle(task?.title ?? '')
    setDescription(task?.description ?? '')
    setStatus(task?.status ?? defaultStatus)
    setPriority(task?.priority ?? 'medium')
    setDue(toDateInput(task?.dueDate ?? null))
    setTags((task?.tags ?? []).join(', '))
    setError('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('A task title is required.')
      return
    }
    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: fromDateInput(due),
      tags: parseTags(tags),
    }
    if (editing && task) updateTask(task.id, payload)
    else addTask({ projectId, ...payload })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit task' : 'New task'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="t-title" required>
          <Input
            id="t-title"
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            placeholder="What needs to be done?"
          />
        </Field>
        <Field label="Description" htmlFor="t-desc">
          <Textarea
            id="t-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more detail…"
            rows={3}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Status" htmlFor="t-status">
            <Select id="t-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="t-priority">
            <Select id="t-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date" htmlFor="t-due">
            <Input id="t-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <Field label="Tags" htmlFor="t-tags" hint="Comma separated">
            <Input id="t-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="bug, ui" />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editing ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
