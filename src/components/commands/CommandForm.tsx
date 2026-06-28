import { useState } from 'react'
import type { Command } from '@/types'
import { useStore } from '@/store/store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { parseTags } from '@/lib/utils'

interface CommandFormProps {
  command?: Command | null
  defaultProjectId?: string | null
  open: boolean
  onClose: () => void
}

export function CommandForm({ command, defaultProjectId = null, open, onClose }: CommandFormProps) {
  const addCommand = useStore((s) => s.addCommand)
  const updateCommand = useStore((s) => s.updateCommand)
  const projects = useStore((s) => s.projects)
  const editing = Boolean(command)

  const [title, setTitle] = useState(command?.title ?? '')
  const [description, setDescription] = useState(command?.description ?? '')
  const [cmd, setCmd] = useState(command?.command ?? '')
  const [tags, setTags] = useState((command?.tags ?? []).join(', '))
  const [projectId, setProjectId] = useState<string | null>(command?.projectId ?? defaultProjectId)
  const [error, setError] = useState('')

  const key = command?.id ?? `new-${defaultProjectId}`
  const [seededKey, setSeededKey] = useState(key)
  if (seededKey !== key) {
    setSeededKey(key)
    setTitle(command?.title ?? '')
    setDescription(command?.description ?? '')
    setCmd(command?.command ?? '')
    setTags((command?.tags ?? []).join(', '))
    setProjectId(command?.projectId ?? defaultProjectId)
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('A title is required.')
    if (!cmd.trim()) return setError('The command is empty.')
    const payload = {
      title: title.trim(),
      description: description.trim(),
      command: cmd,
      tags: parseTags(tags),
      projectId,
    }
    if (editing && command) await updateCommand(command.id, payload)
    else await addCommand(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit command' : 'New command'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="c-title" required>
          <Input
            id="c-title"
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. Tail production logs"
          />
        </Field>
        <Field label="Command" htmlFor="c-cmd" required>
          <Textarea
            id="c-cmd"
            value={cmd}
            onChange={(e) => {
              setCmd(e.target.value)
              if (error) setError('')
            }}
            placeholder="kubectl logs -f -l app=api"
            rows={3}
            spellCheck={false}
            className="font-mono text-[0.8125rem]"
          />
        </Field>
        <Field label="Description" htmlFor="c-desc">
          <Input
            id="c-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="When to use it"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Project" htmlFor="c-project">
            <Select
              id="c-project"
              value={projectId ?? ''}
              onChange={(e) => setProjectId(e.target.value || null)}
            >
              <option value="">No project (global)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tags" htmlFor="c-tags" hint="Comma separated">
            <Input id="c-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="git, ops" />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editing ? 'Save changes' : 'Save command'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
