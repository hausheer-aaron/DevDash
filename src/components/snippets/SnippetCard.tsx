import { Link } from 'react-router-dom'
import { Star, MoreHorizontal, Pencil, Trash2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { Snippet } from '@/types'
import { useStore } from '@/store/store'
import { CodeBlock } from '@/components/ui/CodeBlock'
import { Badge, Tag } from '@/components/ui/Badge'
import { Menu, MenuItem, MenuSeparator } from '@/components/ui/Menu'
import { cn, copyToClipboard, timeAgo } from '@/lib/utils'

interface SnippetCardProps {
  snippet: Snippet
  onEdit: (s: Snippet) => void
  onDelete: (s: Snippet) => void
  showProject?: boolean
}

export function SnippetCard({ snippet, onEdit, onDelete, showProject }: SnippetCardProps) {
  const updateSnippet = useStore((s) => s.updateSnippet)
  const project = useStore((s) =>
    snippet.projectId ? s.projects.find((p) => p.id === snippet.projectId) : undefined,
  )
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (await copyToClipboard(snippet.code)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface/60 p-4 transition hover:border-border-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-fg">{snippet.title}</h3>
            {snippet.favorite && <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />}
          </div>
          {snippet.description && (
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">{snippet.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={copy}
            className="rounded-lg p-1.5 text-faint transition hover:bg-surface-hover hover:text-fg"
            aria-label="Copy code"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
          <Menu
            trigger={
              <button
                className="rounded-lg p-1.5 text-faint transition hover:bg-surface-hover hover:text-fg"
                aria-label="Snippet actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <MenuItem icon={Pencil} onClick={() => onEdit(snippet)}>
              Edit
            </MenuItem>
            <MenuItem
              icon={Star}
              onClick={() => updateSnippet(snippet.id, { favorite: !snippet.favorite })}
            >
              {snippet.favorite ? 'Remove favorite' : 'Add favorite'}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={Trash2} destructive onClick={() => onDelete(snippet)}>
              Delete
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="mt-3">
        <CodeBlock code={snippet.code} language={snippet.language} maxHeight={240} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge>{snippet.language}</Badge>
        {snippet.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
        <span className="ml-auto flex items-center gap-2 text-xs text-faint">
          {showProject && project && (
            <Link
              to={`/projects/${project.id}?tab=snippets`}
              className={cn('truncate transition hover:text-fg')}
            >
              {project.name}
            </Link>
          )}
          <span>{timeAgo(snippet.updatedAt)}</span>
        </span>
      </div>
    </div>
  )
}
