import type {
  Command,
  DataState,
  ExportBundle,
  ImportResult,
  Note,
  Project,
  ProjectLink,
  Resource,
  Settings,
  Snippet,
  Task,
} from '@/types'
import { SCHEMA_VERSION } from '@/types'
import { createSeedData } from '@/lib/seed'
import {
  assertDataIntegrity,
  normalizeBundle,
  normalizePersistedState,
  normalizeTaskOrders,
} from '@/lib/schema'
import { deriveKey, now, uid } from '@/lib/utils'
import {
  createDefaultSyncState,
  normalizeWorkspaceSyncState,
} from '@/sync/queue'
import type {
  DevDashRepository,
  NewCommand,
  NewLink,
  NewNote,
  NewProject,
  NewResource,
  NewSnippet,
  NewTask,
  RepositoryResult,
  RepositoryState,
} from './types'

const emptyData = (): DataState => ({
  projects: [],
  tasks: [],
  notes: [],
  snippets: [],
  commands: [],
  links: [],
  resources: [],
})

function requireProject(state: DataState, projectId: string) {
  if (!state.projects.some((p) => p.id === projectId)) {
    throw new Error('Project not found.')
  }
}

function requireOptionalProject(state: DataState, projectId: string | null) {
  if (projectId !== null) requireProject(state, projectId)
}

function nextTaskOrder(state: DataState, projectId: string, status: Task['status'], excludeId?: string) {
  return state.tasks.filter(
    (t) => t.projectId === projectId && t.status === status && t.id !== excludeId,
  ).length
}

const voidResult = (state: Partial<RepositoryState>): RepositoryResult => ({
  ok: true,
  state,
  result: undefined,
})

export class LocalRepository implements DevDashRepository {
  constructor(private readonly defaultSettings: Settings) {}

  getInitialState(): RepositoryState {
    return {
      ...createSeedData(),
      settings: this.defaultSettings,
      sync: createDefaultSyncState(),
    }
  }

  normalizePersistedState(input: unknown, fallbackSettings: Settings): RepositoryState {
    const data = normalizePersistedState(input, fallbackSettings)
    const sync = isRecord(input) ? normalizeWorkspaceSyncState(input.sync) : createDefaultSyncState()
    return { ...data, sync }
  }

  getPersistedState(state: RepositoryState): RepositoryState {
    const { projects, tasks, notes, snippets, commands, links, resources, settings, sync } = state
    return { projects, tasks, notes, snippets, commands, links, resources, settings, sync }
  }

  async addProject(state: RepositoryState, input: NewProject): Promise<RepositoryResult<Project>> {
    const ts = now()
    const project: Project = {
      id: uid('proj'),
      name: input.name.trim(),
      description: input.description ?? '',
      key: (input.key || deriveKey(input.name)).toUpperCase().slice(0, 4),
      status: input.status ?? 'planning',
      priority: input.priority ?? 'medium',
      tags: input.tags ?? [],
      color: input.color ?? 'indigo',
      favorite: input.favorite ?? false,
      readme: input.readme ?? '',
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { projects: [project, ...state.projects] }, result: project }
  }

  async updateProject(state: RepositoryState, id: string, patch: Partial<Project>): Promise<RepositoryResult> {
    return voidResult({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
      ),
    })
  }

  async deleteProject(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({
      projects: state.projects.filter((p) => p.id !== id),
      tasks: state.tasks.filter((t) => t.projectId !== id),
      notes: state.notes.filter((n) => n.projectId !== id),
      links: state.links.filter((l) => l.projectId !== id),
      resources: state.resources.filter((r) => r.projectId !== id),
      snippets: state.snippets.filter((sn) => sn.projectId !== id),
      commands: state.commands.filter((c) => c.projectId !== id),
    })
  }

  async toggleFavorite(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite, updatedAt: now() } : p,
      ),
    })
  }

  async addTask(state: RepositoryState, input: NewTask): Promise<RepositoryResult<Task>> {
    requireProject(state, input.projectId)
    const ts = now()
    const siblings = state.tasks.filter(
      (t) => t.projectId === input.projectId && t.status === (input.status ?? 'todo'),
    )
    const task: Task = {
      id: uid('task'),
      projectId: input.projectId,
      title: input.title.trim(),
      description: input.description ?? '',
      status: input.status ?? 'todo',
      priority: input.priority ?? 'medium',
      order: input.order ?? siblings.length,
      tags: input.tags ?? [],
      dueDate: input.dueDate ?? null,
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { tasks: [...state.tasks, task] }, result: task }
  }

  async updateTask(state: RepositoryState, id: string, patch: Partial<Task>): Promise<RepositoryResult> {
    if (patch.projectId) requireProject(state, patch.projectId)
    const current = state.tasks.find((t) => t.id === id)
    const statusChanged = current && patch.status && patch.status !== current.status
    return voidResult({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              order:
                statusChanged && patch.order == null
                  ? nextTaskOrder(state, patch.projectId ?? t.projectId, patch.status!, id)
                  : patch.order ?? t.order,
              updatedAt: now(),
            }
          : t,
      ),
    })
  }

  async deleteTask(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({ tasks: state.tasks.filter((t) => t.id !== id) })
  }

  async moveTask(
    state: RepositoryState,
    id: string,
    status: Task['status'],
    order: number,
  ): Promise<RepositoryResult> {
    return voidResult(normalizeTaskOrders({
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, order, updatedAt: now() } : t,
      ),
    }))
  }

  async reorderTasks(
    state: RepositoryState,
    updates: { id: string; status: Task['status']; order: number }[],
  ): Promise<RepositoryResult> {
    const map = new Map(updates.map((u) => [u.id, u]))
    return voidResult({
      tasks: state.tasks.map((t) => {
        const update = map.get(t.id)
        return update ? { ...t, status: update.status, order: update.order, updatedAt: now() } : t
      }),
    })
  }

  async addNote(state: RepositoryState, input: NewNote): Promise<RepositoryResult<Note>> {
    requireProject(state, input.projectId)
    const ts = now()
    const note: Note = {
      id: uid('note'),
      projectId: input.projectId,
      title: input.title?.trim() || 'Untitled note',
      content: input.content ?? '',
      pinned: input.pinned ?? false,
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { notes: [note, ...state.notes] }, result: note }
  }

  async updateNote(state: RepositoryState, id: string, patch: Partial<Note>): Promise<RepositoryResult> {
    return voidResult({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
    })
  }

  async deleteNote(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({ notes: state.notes.filter((n) => n.id !== id) })
  }

  async addSnippet(state: RepositoryState, input: NewSnippet): Promise<RepositoryResult<Snippet>> {
    requireOptionalProject(state, input.projectId ?? null)
    const ts = now()
    const snippet: Snippet = {
      id: uid('snip'),
      projectId: input.projectId ?? null,
      title: input.title.trim(),
      description: input.description ?? '',
      language: input.language ?? 'typescript',
      code: input.code,
      tags: input.tags ?? [],
      favorite: input.favorite ?? false,
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { snippets: [snippet, ...state.snippets] }, result: snippet }
  }

  async updateSnippet(state: RepositoryState, id: string, patch: Partial<Snippet>): Promise<RepositoryResult> {
    if ('projectId' in patch) requireOptionalProject(state, patch.projectId ?? null)
    return voidResult({
      snippets: state.snippets.map((sn) =>
        sn.id === id ? { ...sn, ...patch, updatedAt: now() } : sn,
      ),
    })
  }

  async deleteSnippet(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({ snippets: state.snippets.filter((sn) => sn.id !== id) })
  }

  async addCommand(state: RepositoryState, input: NewCommand): Promise<RepositoryResult<Command>> {
    requireOptionalProject(state, input.projectId ?? null)
    const ts = now()
    const command: Command = {
      id: uid('cmd'),
      projectId: input.projectId ?? null,
      title: input.title.trim(),
      description: input.description ?? '',
      command: input.command,
      tags: input.tags ?? [],
      favorite: input.favorite ?? false,
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { commands: [command, ...state.commands] }, result: command }
  }

  async updateCommand(state: RepositoryState, id: string, patch: Partial<Command>): Promise<RepositoryResult> {
    if ('projectId' in patch) requireOptionalProject(state, patch.projectId ?? null)
    return voidResult({
      commands: state.commands.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: now() } : c,
      ),
    })
  }

  async deleteCommand(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({ commands: state.commands.filter((c) => c.id !== id) })
  }

  async addLink(state: RepositoryState, input: NewLink): Promise<RepositoryResult<ProjectLink>> {
    requireProject(state, input.projectId)
    const ts = now()
    const link: ProjectLink = {
      id: uid('link'),
      projectId: input.projectId,
      label: input.label.trim(),
      url: input.url.trim(),
      category: input.category ?? 'other',
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { links: [...state.links, link] }, result: link }
  }

  async updateLink(state: RepositoryState, id: string, patch: Partial<ProjectLink>): Promise<RepositoryResult> {
    if (patch.projectId) requireProject(state, patch.projectId)
    return voidResult({
      links: state.links.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l)),
    })
  }

  async deleteLink(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({ links: state.links.filter((l) => l.id !== id) })
  }

  async addResource(state: RepositoryState, input: NewResource): Promise<RepositoryResult<Resource>> {
    requireProject(state, input.projectId)
    const ts = now()
    const resource: Resource = {
      id: uid('res'),
      projectId: input.projectId,
      title: input.title.trim(),
      url: input.url ?? '',
      notes: input.notes ?? '',
      createdAt: ts,
      updatedAt: ts,
    }
    return { ok: true, state: { resources: [resource, ...state.resources] }, result: resource }
  }

  async updateResource(state: RepositoryState, id: string, patch: Partial<Resource>): Promise<RepositoryResult> {
    if (patch.projectId) requireProject(state, patch.projectId)
    return voidResult({
      resources: state.resources.map((r) =>
        r.id === id ? { ...r, ...patch, updatedAt: now() } : r,
      ),
    })
  }

  async deleteResource(state: RepositoryState, id: string): Promise<RepositoryResult> {
    return voidResult({ resources: state.resources.filter((r) => r.id !== id) })
  }

  async updateSettings(state: RepositoryState, patch: Partial<Settings>): Promise<RepositoryResult> {
    return voidResult({ settings: { ...state.settings, ...patch } })
  }

  exportBundle(state: RepositoryState): ExportBundle {
    return {
      version: SCHEMA_VERSION,
      exportedAt: now(),
      settings: state.settings,
      projects: state.projects,
      tasks: state.tasks,
      notes: state.notes,
      snippets: state.snippets,
      commands: state.commands,
      links: state.links,
      resources: state.resources,
    }
  }

  async importBundle(
    state: RepositoryState,
    bundle: ExportBundle,
    mode: 'merge' | 'replace',
    fallbackSettings: Settings,
  ): Promise<RepositoryResult<ImportResult>> {
    if (mode === 'replace') {
      const normalized = normalizeBundle(bundle, {
        mode: 'strict',
        fallbackSettings,
      })
      const { projects, tasks, notes, snippets, commands, links, resources, settings } =
        normalized.bundle
      return {
        ok: true,
        state: { projects, tasks, notes, snippets, commands, links, resources, settings },
        result: { repaired: normalized.repaired },
      }
    }

    const mergeById = <T extends { id: string }>(a: T[], b: T[]) => {
      const map = new Map(a.map((x) => [x.id, x]))
      for (const x of b) map.set(x.id, x)
      return [...map.values()]
    }
    const merged = {
      projects: mergeById(state.projects, bundle.projects),
      tasks: mergeById(state.tasks, bundle.tasks),
      notes: mergeById(state.notes, bundle.notes),
      snippets: mergeById(state.snippets, bundle.snippets),
      commands: mergeById(state.commands, bundle.commands),
      links: mergeById(state.links, bundle.links),
      resources: mergeById(state.resources, bundle.resources),
    }
    assertDataIntegrity(merged)
    return {
      ok: true,
      state: normalizeTaskOrders(merged),
      result: { repaired: [] },
    }
  }

  async resetAll(_state: RepositoryState): Promise<RepositoryResult> {
    return voidResult(emptyData())
  }

  async loadSeed(_state: RepositoryState): Promise<RepositoryResult> {
    return voidResult(normalizeTaskOrders(createSeedData()))
  }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}
