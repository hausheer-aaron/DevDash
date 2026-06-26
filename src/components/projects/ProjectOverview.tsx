import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Pencil, CheckSquare, Code2, TerminalSquare, Link2, BookMarked } from 'lucide-react'
import type { Project } from '@/types'
import { useStore } from '@/store/store'
import { useProjectStats } from '@/store/selectors'
import { Markdown } from '@/components/ui/Markdown'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export function ProjectOverview({ project }: { project: Project }) {
  const stats = useProjectStats(project.id)
  const updateProject = useStore((s) => s.updateProject)
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(project.readme)

  const save = () => {
    updateProject(project.id, { readme: draft })
    setEditing(false)
  }

  const go = (tab: string) => navigate(`/projects/${project.id}?tab=${tab}`)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Readme */}
      <div className="min-w-0">
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-fg">
              <FileText className="h-4 w-4 text-muted" /> Overview
            </h2>
            {!editing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(project.readme)
                  setEditing(true)
                }}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={16}
                autoFocus
                placeholder="# Overview&#10;&#10;Document this project in Markdown…"
                className="font-mono text-[0.8125rem] leading-relaxed"
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={save}>
                  Save
                </Button>
              </div>
            </div>
          ) : project.readme.trim() ? (
            <Markdown>{project.readme}</Markdown>
          ) : (
            <EmptyState
              icon={FileText}
              title="No overview yet"
              description="Add a README-style overview to document this project."
              compact
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDraft(project.readme)
                    setEditing(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Write overview
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface/40 p-4">
          <h3 className="mb-3 text-[0.6875rem] font-semibold uppercase tracking-wide text-faint">
            Progress
          </h3>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-fg">{stats.progress}%</span>
            <span className="text-xs text-faint">
              {stats.done}/{stats.total} tasks
            </span>
          </div>
          <Progress value={stats.progress} className="mt-2" />
        </div>

        <div className="rounded-2xl border border-border bg-surface/40 p-2">
          <CountRow icon={CheckSquare} label="Tasks" value={stats.total} onClick={() => go('tasks')} />
          <CountRow icon={FileText} label="Notes" value={stats.notes} onClick={() => go('notes')} />
          <CountRow icon={Code2} label="Snippets" value={stats.snippets} onClick={() => go('snippets')} />
          <CountRow icon={TerminalSquare} label="Commands" value={stats.commands} onClick={() => go('commands')} />
          <CountRow icon={Link2} label="Links" value={stats.links} onClick={() => go('links')} />
          <CountRow icon={BookMarked} label="Resources" value={stats.resources} onClick={() => go('resources')} />
        </div>

        <div className="rounded-2xl border border-border bg-surface/40 p-4 text-xs text-muted">
          <div className="flex items-center justify-between py-1">
            <span className="text-faint">Created</span>
            <span>{formatDate(project.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-faint">Updated</span>
            <span>{formatDate(project.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CountRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon
  label: string
  value: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition hover:bg-surface-hover"
    >
      <Icon className="h-4 w-4 text-faint" />
      <span className="flex-1 text-left text-muted">{label}</span>
      <span className="font-medium text-fg">{value}</span>
    </button>
  )
}
