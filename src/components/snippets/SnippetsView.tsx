import { useMemo, useState } from 'react'
import { Plus, Search, Code2, Star } from 'lucide-react'
import type { Snippet } from '@/types'
import { useStore } from '@/store/store'
import { useConfirm } from '@/components/ui/Confirm'
import { useToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { SnippetCard } from './SnippetCard'
import { SnippetForm } from './SnippetForm'
import { SNIPPET_LANGUAGES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface SnippetsViewProps {
  /** Limit to one project; omit for the global library (all snippets). */
  projectId?: string
}

export function SnippetsView({ projectId }: SnippetsViewProps) {
  const allSnippets = useStore((s) => s.snippets)
  const deleteSnippet = useStore((s) => s.deleteSnippet)
  const confirm = useConfirm()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('all')
  const [favOnly, setFavOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Snippet | null>(null)

  const scoped = useMemo(
    () => (projectId ? allSnippets.filter((s) => s.projectId === projectId) : allSnippets),
    [allSnippets, projectId],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped
      .filter((s) => {
        if (language !== 'all' && s.language !== language) return false
        if (favOnly && !s.favorite) return false
        if (q) {
          const hay = `${s.title} ${s.description} ${s.code} ${s.tags.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.updatedAt - a.updatedAt)
  }, [scoped, query, language, favOnly])

  const usedLanguages = useMemo(
    () => SNIPPET_LANGUAGES.filter((l) => scoped.some((s) => s.language === l)),
    [scoped],
  )

  const onDelete = async (s: Snippet) => {
    const ok = await confirm({
      title: 'Delete snippet?',
      description: `“${s.title}” will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) {
      deleteSnippet(s.id)
      toast.success('Snippet deleted')
    }
  }

  const openNew = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (s: Snippet) => {
    setEditing(s)
    setFormOpen(true)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search snippets…"
            className="pl-9"
          />
        </div>
        <Select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-auto min-w-[8rem]"
        >
          <option value="all">All languages</option>
          {usedLanguages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </Select>
        <Button
          variant={favOnly ? 'primary' : 'secondary'}
          size="icon"
          onClick={() => setFavOnly((v) => !v)}
          aria-label="Favorites only"
        >
          <Star className={cn('h-4 w-4', favOnly && 'fill-current')} />
        </Button>
        <Button variant="primary" onClick={openNew}>
          <Plus className="h-4 w-4" /> New
        </Button>
      </div>

      <div className="mt-5">
        {scoped.length === 0 ? (
          <EmptyState
            icon={Code2}
            title="No snippets yet"
            description="Save reusable code you reach for again and again."
            action={
              <Button variant="primary" onClick={openNew}>
                <Plus className="h-4 w-4" /> New snippet
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No matches" compact />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filtered.map((s) => (
              <SnippetCard
                key={s.id}
                snippet={s}
                onEdit={openEdit}
                onDelete={onDelete}
                showProject={!projectId}
              />
            ))}
          </div>
        )}
      </div>

      <SnippetForm
        snippet={editing}
        defaultProjectId={projectId ?? null}
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />
    </div>
  )
}
