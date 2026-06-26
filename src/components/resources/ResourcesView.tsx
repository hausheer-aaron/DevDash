import { useMemo, useState } from 'react'
import { Plus, BookMarked, ExternalLink, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import type { Resource } from '@/types'
import { useStore } from '@/store/store'
import { useConfirm } from '@/components/ui/Confirm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'

export function ResourcesView({ projectId }: { projectId: string }) {
  const resources = useStore((s) => s.resources)
  const deleteResource = useStore((s) => s.deleteResource)
  const confirm = useConfirm()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Resource | null>(null)

  const projectResources = useMemo(
    () => resources.filter((r) => r.projectId === projectId).sort((a, b) => b.updatedAt - a.updatedAt),
    [resources, projectId],
  )

  const onDelete = async (r: Resource) => {
    const ok = await confirm({
      title: 'Delete resource?',
      description: `“${r.title}” will be removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteResource(r.id)
  }

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }

  if (projectResources.length === 0) {
    return (
      <>
        <EmptyState
          icon={BookMarked}
          title="No resources yet"
          description="Reference material, dashboards, ADRs and anything worth bookmarking."
          action={
            <Button variant="primary" onClick={openNew}>
              <Plus className="h-4 w-4" /> Add resource
            </Button>
          }
        />
        <ResourceForm projectId={projectId} resource={null} open={formOpen} onClose={() => setFormOpen(false)} />
      </>
    )
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add resource
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {projectResources.map((r) => (
          <div
            key={r.id}
            className="group flex flex-col rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-border-strong"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-fg">{r.title}</h3>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-flex items-center gap-1 text-xs text-accent transition hover:underline"
                  >
                    {hostname(r.url)} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <Menu
                trigger={
                  <button
                    className="shrink-0 rounded-lg p-1.5 text-faint opacity-0 transition hover:bg-surface-hover hover:text-fg group-hover:opacity-100"
                    aria-label="Resource actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                }
              >
                <MenuItem
                  icon={Pencil}
                  onClick={() => {
                    setEditing(r)
                    setFormOpen(true)
                  }}
                >
                  Edit
                </MenuItem>
                <MenuSeparator />
                <MenuItem icon={Trash2} destructive onClick={() => onDelete(r)}>
                  Delete
                </MenuItem>
              </Menu>
            </div>
            {r.notes && (
              <div className="mt-2 border-t border-border pt-2">
                <Markdown className="text-[0.85rem]">{r.notes}</Markdown>
              </div>
            )}
          </div>
        ))}
      </div>

      <ResourceForm
        projectId={projectId}
        resource={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function ResourceForm({
  projectId,
  resource,
  open,
  onClose,
}: {
  projectId: string
  resource: Resource | null
  open: boolean
  onClose: () => void
}) {
  const addResource = useStore((s) => s.addResource)
  const updateResource = useStore((s) => s.updateResource)
  const editing = Boolean(resource)

  const [title, setTitle] = useState(resource?.title ?? '')
  const [url, setUrl] = useState(resource?.url ?? '')
  const [notes, setNotes] = useState(resource?.notes ?? '')
  const [error, setError] = useState('')

  const key = resource?.id ?? 'new'
  const [seededKey, setSeededKey] = useState(key)
  if (seededKey !== key) {
    setSeededKey(key)
    setTitle(resource?.title ?? '')
    setUrl(resource?.url ?? '')
    setNotes(resource?.notes ?? '')
    setError('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('A title is required.')
    const normalized = url.trim()
      ? /^https?:\/\//i.test(url.trim())
        ? url.trim()
        : `https://${url.trim()}`
      : ''
    if (editing && resource)
      updateResource(resource.id, { title: title.trim(), url: normalized, notes })
    else addResource({ projectId, title: title.trim(), url: normalized, notes })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit resource' : 'Add resource'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title" htmlFor="r-title" required>
          <Input
            id="r-title"
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. Architecture decision records"
          />
        </Field>
        <Field label="URL" htmlFor="r-url" hint="Optional">
          <Input id="r-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Notes (Markdown)" htmlFor="r-notes">
          <Textarea
            id="r-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why it matters, what to read first…"
            rows={4}
          />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editing ? 'Save changes' : 'Add resource'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
