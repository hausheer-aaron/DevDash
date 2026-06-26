import { useState } from 'react'
import { Star } from 'lucide-react'
import type { Priority, Project, ProjectStatus } from '@/types'
import {
  ACCENT_KEYS,
  ACCENT_SWATCHES,
  PRIORITIES,
  PRIORITY_META,
  PROJECT_STATUSES,
  STATUS_META,
} from '@/lib/constants'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn, deriveKey, parseTags } from '@/lib/utils'

export interface ProjectFormValues {
  name: string
  key: string
  description: string
  status: ProjectStatus
  priority: Priority
  color: string
  favorite: boolean
  tags: string[]
  readme: string
}

interface ProjectFormProps {
  initial?: Partial<Project>
  onSubmit: (values: ProjectFormValues) => void
  onCancel: () => void
  submitLabel?: string
}

export function ProjectForm({ initial, onSubmit, onCancel, submitLabel = 'Create project' }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [key, setKey] = useState(initial?.key ?? '')
  const [keyTouched, setKeyTouched] = useState(Boolean(initial?.key))
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? 'planning')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [color, setColor] = useState(initial?.color ?? 'indigo')
  const [favorite, setFavorite] = useState(initial?.favorite ?? false)
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [readme, setReadme] = useState(initial?.readme ?? '')
  const [error, setError] = useState('')

  const effectiveKey = keyTouched ? key : deriveKey(name)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('A project name is required.')
      return
    }
    onSubmit({
      name: name.trim(),
      key: (effectiveKey || deriveKey(name)).toUpperCase().slice(0, 4),
      description: description.trim(),
      status,
      priority,
      color,
      favorite,
      tags: parseTags(tags),
      readme,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Name" htmlFor="p-name" required className="col-span-2">
          <Input
            id="p-name"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. Payments API"
          />
        </Field>
        <Field label="Key" htmlFor="p-key" hint="Shown as a chip">
          <Input
            id="p-key"
            value={effectiveKey}
            maxLength={4}
            onChange={(e) => {
              setKey(e.target.value.toUpperCase())
              setKeyTouched(true)
            }}
            placeholder="API"
            className="uppercase"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="p-desc">
        <Textarea
          id="p-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          rows={2}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Status" htmlFor="p-status">
          <Select id="p-status" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="p-priority">
          <Select id="p-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_META[p].label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Tags" htmlFor="p-tags" hint="Comma separated">
        <Input
          id="p-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="react, typescript, frontend"
        />
      </Field>

      <Field label="Accent color">
        <div className="flex flex-wrap items-center gap-2">
          {ACCENT_KEYS.map((c) => {
            const swatch = ACCENT_SWATCHES[c]
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                title={swatch.label}
                className={cn(
                  'h-7 w-7 rounded-full ring-2 ring-offset-2 ring-offset-elevated transition',
                  color === c ? 'ring-fg/60 scale-110' : 'ring-transparent hover:scale-105',
                )}
                style={{ backgroundImage: `linear-gradient(135deg, ${swatch.from}, ${swatch.to})` }}
              />
            )
          })}
        </div>
      </Field>

      <Field label="Overview (Markdown)" htmlFor="p-readme">
        <Textarea
          id="p-readme"
          value={readme}
          onChange={(e) => setReadme(e.target.value)}
          placeholder="# Overview&#10;&#10;Document the project here…"
          rows={4}
          className="font-mono text-[0.8125rem]"
        />
      </Field>

      <button
        type="button"
        onClick={() => setFavorite((f) => !f)}
        className={cn(
          'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition',
          favorite
            ? 'border-warning/30 bg-warning/10 text-warning'
            : 'border-border text-muted hover:bg-surface-hover',
        )}
      >
        <Star className={cn('h-4 w-4', favorite && 'fill-warning')} />
        {favorite ? 'Favorited' : 'Add to favorites'}
      </button>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
