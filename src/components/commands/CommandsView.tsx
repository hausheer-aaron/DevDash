import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  TerminalSquare,
  Star,
  Copy,
  Check,
  Pencil,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import type { Command } from '@/types'
import { useStore } from '@/store/store'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { CommandForm } from './CommandForm'
import { cn, copyToClipboard } from '@/lib/utils'

export function CommandsView({ projectId }: { projectId?: string }) {
  const allCommands = useStore((s) => s.commands)
  const deleteCommand = useStore((s) => s.deleteCommand)
  const confirm = useConfirm()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Command | null>(null)

  const scoped = useMemo(
    () => (projectId ? allCommands.filter((c) => c.projectId === projectId) : allCommands),
    [allCommands, projectId],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped
      .filter((c) => {
        if (favOnly && !c.favorite) return false
        if (q) {
          const hay = `${c.title} ${c.description} ${c.command} ${c.tags.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt)
  }, [scoped, query, favOnly])

  const onDelete = async (c: Command) => {
    const ok = await confirm({
      title: 'Delete command?',
      description: `“${c.title}” will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) {
      deleteCommand(c.id)
      toast.success('Command deleted')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="pl-9"
          />
        </div>
        <Button
          variant={favOnly ? 'primary' : 'secondary'}
          size="icon"
          onClick={() => setFavOnly((v) => !v)}
          aria-label="Favorites only"
        >
          <Star className={cn('h-4 w-4', favOnly && 'fill-current')} />
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <div className="mt-5">
        {scoped.length === 0 ? (
          <EmptyState
            icon={TerminalSquare}
            title="No commands yet"
            description="Stash the terminal commands you keep forgetting."
            action={
              <Button
                variant="primary"
                onClick={() => {
                  setEditing(null)
                  setFormOpen(true)
                }}
              >
                <Plus className="h-4 w-4" /> New command
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matches" compact />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((c) => (
              <CommandRow
                key={c.id}
                command={c}
                showProject={!projectId}
                onEdit={() => {
                  setEditing(c)
                  setFormOpen(true)
                }}
                onDelete={() => onDelete(c)}
              />
            ))}
          </div>
        )}
      </div>

      <CommandForm
        command={editing}
        defaultProjectId={projectId ?? null}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}

function CommandRow({
  command,
  showProject,
  onEdit,
  onDelete,
}: {
  command: Command
  showProject?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const updateCommand = useStore((s) => s.updateCommand)
  const project = useStore((s) =>
    command.projectId ? s.projects.find((p) => p.id === command.projectId) : undefined,
  )
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyToClipboard(command.command)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="group rounded-xl border border-border bg-surface/60 p-3.5 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-fg">{command.title}</h3>
            {command.favorite && <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />}
          </div>
          {command.description && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted">{command.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Menu
            trigger={
              <button
                className="rounded-lg p-1.5 text-faint opacity-0 transition hover:bg-surface-hover hover:text-fg group-hover:opacity-100"
                aria-label="Command actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <MenuItem icon={Pencil} onClick={onEdit}>
              Edit
            </MenuItem>
            <MenuItem
              icon={Star}
              onClick={() => updateCommand(command.id, { favorite: !command.favorite })}
            >
              {command.favorite ? 'Remove favorite' : 'Add favorite'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={Trash2} destructive onClick={onDelete}>
              Delete
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-border bg-[#0c0c10] px-3 py-2">
        <span className="select-none text-faint">$</span>
        <code className="scrollbar-thin flex-1 overflow-x-auto whitespace-pre font-mono text-[0.8125rem] text-fg/90">
          {command.command}
        </code>
        <button
          onClick={copy}
          className="shrink-0 rounded-md p-1 text-faint transition hover:bg-surface-hover hover:text-fg"
          aria-label="Copy command"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {(command.tags.length > 0 || (showProject && project)) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {command.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {showProject && project && (
            <Link
              to={`/projects/${project.id}?tab=commands`}
              className="ml-auto text-xs text-faint transition hover:text-fg"
            >
              {project.name}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
