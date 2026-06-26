import { useMemo, useState } from 'react'
import {
  Plus,
  Link as LinkIcon,
  GitBranch,
  BookOpen,
  Rocket,
  Figma,
  CircleDot,
  ExternalLink,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import type { LinkCategory, ProjectLink } from '@/types'
import { useStore } from '@/store/store'
import { useConfirm } from '@/components/ui/Confirm'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { LINK_CATEGORIES, LINK_CATEGORY_META } from '@/lib/constants'

const CATEGORY_ICON: Record<LinkCategory, typeof LinkIcon> = {
  repository: GitBranch,
  documentation: BookOpen,
  deployment: Rocket,
  design: Figma,
  issue: CircleDot,
  other: LinkIcon,
}

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function LinksView({ projectId }: { projectId: string }) {
  const links = useStore((s) => s.links)
  const deleteLink = useStore((s) => s.deleteLink)
  const confirm = useConfirm()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProjectLink | null>(null)

  const projectLinks = useMemo(
    () => links.filter((l) => l.projectId === projectId),
    [links, projectId],
  )

  const grouped = useMemo(() => {
    const map = new Map<LinkCategory, ProjectLink[]>()
    for (const cat of LINK_CATEGORIES) {
      const items = projectLinks.filter((l) => l.category === cat)
      if (items.length) map.set(cat, items)
    }
    return map
  }, [projectLinks])

  const onDelete = async (l: ProjectLink) => {
    const ok = await confirm({
      title: 'Delete link?',
      description: `“${l.label}” will be removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteLink(l.id)
  }

  if (projectLinks.length === 0) {
    return (
      <>
        <EmptyState
          icon={LinkIcon}
          title="No links yet"
          description="Keep repos, docs and deployments one click away."
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Add link
            </Button>
          }
        />
        <LinkForm projectId={projectId} link={null} open={formOpen} onClose={() => setFormOpen(false)} />
      </>
    )
  }

  return (
    <div>
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> Add link
        </Button>
      </div>

      <div className="mt-4 space-y-6">
        {[...grouped.entries()].map(([cat, items]) => {
          const Icon = CATEGORY_ICON[cat]
          return (
            <div key={cat}>
              <h3 className="mb-2 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-wide text-faint">
                <Icon className="h-3.5 w-3.5" />
                {LINK_CATEGORY_META[cat].label}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map((l) => (
                  <div
                    key={l.id}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-3 transition hover:border-border-strong"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-bg-subtle text-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-fg">{l.label}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-faint opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <span className="truncate text-xs text-faint">{hostname(l.url)}</span>
                    </a>
                    <Menu
                      trigger={
                        <button
                          className="shrink-0 rounded-lg p-1.5 text-faint opacity-0 transition hover:bg-surface-hover hover:text-fg group-hover:opacity-100"
                          aria-label="Link actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      }
                    >
                      <MenuItem
                        icon={Pencil}
                        onClick={() => {
                          setEditing(l)
                          setFormOpen(true)
                        }}
                      >
                        Edit
                      </MenuItem>
                      <MenuSeparator />
                      <MenuItem icon={Trash2} destructive onClick={() => onDelete(l)}>
                        Delete
                      </MenuItem>
                    </Menu>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <LinkForm
        projectId={projectId}
        link={editing}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function LinkForm({
  projectId,
  link,
  open,
  onClose,
}: {
  projectId: string
  link: ProjectLink | null
  open: boolean
  onClose: () => void
}) {
  const addLink = useStore((s) => s.addLink)
  const updateLink = useStore((s) => s.updateLink)
  const editing = Boolean(link)

  const [label, setLabel] = useState(link?.label ?? '')
  const [url, setUrl] = useState(link?.url ?? '')
  const [category, setCategory] = useState<LinkCategory>(link?.category ?? 'repository')
  const [error, setError] = useState('')

  const key = link?.id ?? 'new'
  const [seededKey, setSeededKey] = useState(key)
  if (seededKey !== key) {
    setSeededKey(key)
    setLabel(link?.label ?? '')
    setUrl(link?.url ?? '')
    setCategory(link?.category ?? 'repository')
    setError('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return setError('A label is required.')
    if (!url.trim()) return setError('A URL is required.')
    const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
    if (editing && link) updateLink(link.id, { label: label.trim(), url: normalized, category })
    else addLink({ projectId, label: label.trim(), url: normalized, category })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit link' : 'Add link'} size="md">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Label" htmlFor="l-label" required>
          <Input
            id="l-label"
            autoFocus
            value={label}
            onChange={(e) => {
              setLabel(e.target.value)
              if (error) setError('')
            }}
            placeholder="e.g. GitHub repository"
          />
        </Field>
        <Field label="URL" htmlFor="l-url" required>
          <Input
            id="l-url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              if (error) setError('')
            }}
            placeholder="https://github.com/acme/repo"
          />
        </Field>
        <Field label="Category" htmlFor="l-cat">
          <Select id="l-cat" value={category} onChange={(e) => setCategory(e.target.value as LinkCategory)}>
            {LINK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {LINK_CATEGORY_META[c].label}
              </option>
            ))}
          </Select>
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editing ? 'Save changes' : 'Add link'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
