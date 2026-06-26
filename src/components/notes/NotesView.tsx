import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, FileText, Pin, Trash2, Eye, PenLine } from 'lucide-react'
import { useStore } from '@/store/store'
import { useConfirm } from '@/components/ui/Confirm'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { cn, timeAgo, truncate } from '@/lib/utils'

export function NotesView({ projectId }: { projectId: string }) {
  const notes = useStore((s) => s.notes)
  const addNote = useStore((s) => s.addNote)
  const updateNote = useStore((s) => s.updateNote)
  const deleteNote = useStore((s) => s.deleteNote)
  const confirm = useConfirm()

  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'write' | 'preview'>('write')

  const projectNotes = useMemo(
    () =>
      notes
        .filter((n) => n.projectId === projectId)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [notes, projectId],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projectNotes
    return projectNotes.filter((n) =>
      `${n.title} ${n.content}`.toLowerCase().includes(q),
    )
  }, [projectNotes, query])

  // Keep a valid selection.
  useEffect(() => {
    if (projectNotes.length === 0) {
      setSelectedId(null)
    } else if (!selectedId || !projectNotes.some((n) => n.id === selectedId)) {
      setSelectedId(projectNotes[0].id)
    }
  }, [projectNotes, selectedId])

  const selected = projectNotes.find((n) => n.id === selectedId) ?? null

  const createNote = () => {
    const note = addNote({ projectId, title: 'Untitled note', content: '' })
    setSelectedId(note.id)
    setMode('write')
  }

  const onDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Delete note?',
      description: `“${truncate(title, 50)}” will be permanently removed.`,
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) deleteNote(id)
  }

  if (projectNotes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No notes yet"
        description="Capture decisions, checklists and docs in Markdown."
        action={
          <Button variant="primary" onClick={createNote}>
            <Plus className="h-4 w-4" /> New note
          </Button>
        }
      />
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="h-9 pl-8"
            />
          </div>
          <Button size="icon" variant="primary" onClick={createNote} aria-label="New note">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="scrollbar-thin max-h-[60vh] space-y-1 overflow-y-auto lg:max-h-[calc(100vh-20rem)]">
          {filtered.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedId(n.id)}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-left transition',
                selectedId === n.id
                  ? 'border-border-strong bg-surface'
                  : 'border-transparent hover:bg-surface-hover',
              )}
            >
              <div className="flex items-center gap-1.5">
                {n.pinned && <Pin className="h-3 w-3 shrink-0 fill-warning text-warning" />}
                <span className="truncate text-sm font-medium text-fg">
                  {n.title || 'Untitled'}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-1 text-xs text-faint">
                {n.content.replace(/[#*`>\-[\]]/g, '').trim() || 'Empty note'}
              </p>
              <p className="mt-1 text-[0.6875rem] text-faint">{timeAgo(n.updatedAt)}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-faint">No notes match.</p>
          )}
        </div>
      </div>

      {/* Editor */}
      {selected && (
        <div className="flex flex-col rounded-2xl border border-border bg-surface/40">
          <div className="flex items-center gap-2 border-b border-border p-3">
            <Input
              value={selected.title}
              onChange={(e) => updateNote(selected.id, { title: e.target.value })}
              placeholder="Note title"
              className="h-9 flex-1 border-0 bg-transparent text-base font-semibold ring-0 focus:ring-0"
            />
            <SegmentedControl
              size="sm"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'write', label: 'Write' },
                { value: 'preview', label: 'Preview' },
              ]}
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={() => updateNote(selected.id, { pinned: !selected.pinned })}
              aria-label="Pin note"
              title={selected.pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={cn('h-4 w-4', selected.pinned && 'fill-warning text-warning')} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(selected.id, selected.title)}
              aria-label="Delete note"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-h-[40vh] flex-1 p-4">
            {mode === 'write' ? (
              <textarea
                value={selected.content}
                onChange={(e) => updateNote(selected.id, { content: e.target.value })}
                placeholder="Start writing in Markdown…"
                spellCheck
                className="scrollbar-thin h-full min-h-[40vh] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-fg outline-none placeholder:text-faint"
              />
            ) : selected.content.trim() ? (
              <Markdown>{selected.content}</Markdown>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-faint">
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> Nothing to preview yet
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[0.6875rem] text-faint">
            <span className="flex items-center gap-1.5">
              {mode === 'write' ? <PenLine className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              Markdown supported
            </span>
            <span>Saved · {timeAgo(selected.updatedAt)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
