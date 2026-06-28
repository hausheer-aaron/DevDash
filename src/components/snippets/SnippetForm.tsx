import { useState } from 'react'
import type { Snippet } from '@/types'
import { useStore } from '@/store/store'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { SNIPPET_LANGUAGES } from '@/lib/constants'
import { parseTags } from '@/lib/utils'

interface SnippetFormProps {
  snippet?: Snippet | null
  defaultProjectId?: string | null
  open: boolean
  onClose: () => void
}

export function SnippetForm({ snippet, defaultProjectId = null, open, onClose }: SnippetFormProps) {
  const addSnippet = useStore((s) => s.addSnippet)
  const updateSnippet = useStore((s) => s.updateSnippet)
  const projects = useStore((s) => s.projects)
  const editing = Boolean(snippet)

  const [title, setTitle] = useState(snippet?.title ?? '')
  const [description, setDescription] = useState(snippet?.description ?? '')
  const [language, setLanguage] = useState(snippet?.language ?? 'typescript')
  const [code, setCode] = useState(snippet?.code ?? '')
  const [tags, setTags] = useState((snippet?.tags ?? []).join(', '))
  const [projectId, setProjectId] = useState<string | null>(
    snippet?.projectId ?? defaultProjectId,
  )
  const [error, setError] = useState('')

  const key = snippet?.id ?? `new-${defaultProjectId}`
  const [seededKey, setSeededKey] = useState(key)
  if (seededKey !== key) {
    setSeededKey(key)
    setTitle(snippet?.title ?? '')
    setDescription(snippet?.description ?? '')
    setLanguage(snippet?.language ?? 'typescript')
    setCode(snippet?.code ?? '')
    setTags((snippet?.tags ?? []).join(', '))
    setProjectId(snippet?.projectId ?? defaultProjectId)
    setError('')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return setError('A title is required.')
    if (!code.trim()) return setError('The snippet is empty.')
    const payload = {
      title: title.trim(),
      description: description.trim(),
      language,
      code,
      tags: parseTags(tags),
      projectId,
    }
    if (editing && snippet) await updateSnippet(snippet.id, payload)
    else await addSnippet(payload)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit snippet' : 'New snippet'} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Title" htmlFor="s-title" required className="col-span-2">
            <Input
              id="s-title"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError('')
              }}
              placeholder="e.g. Debounce hook"
            />
          </Field>
          <Field label="Language" htmlFor="s-lang">
            <Select id="s-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
              {SNIPPET_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Description" htmlFor="s-desc">
          <Input
            id="s-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does it do?"
          />
        </Field>

        <Field label="Code" htmlFor="s-code" required>
          <Textarea
            id="s-code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value)
              if (error) setError('')
            }}
            placeholder="Paste your code here…"
            rows={10}
            spellCheck={false}
            className="font-mono text-[0.8125rem] leading-relaxed"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Project" htmlFor="s-project">
            <Select
              id="s-project"
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
          <Field label="Tags" htmlFor="s-tags" hint="Comma separated">
            <Input id="s-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="react, hooks" />
          </Field>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {editing ? 'Save changes' : 'Save snippet'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
