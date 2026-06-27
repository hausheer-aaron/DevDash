import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
import { STORAGE_KEY } from '@/lib/constants'
import { createSeedData } from '@/lib/seed'
import { assertDataIntegrity, normalizeBundle, normalizePersistedState, normalizeTaskOrders } from '@/lib/schema'
import { deriveKey, now, uid } from '@/lib/utils'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accent: 'indigo',
  defaultView: 'dashboard',
  reduceMotion: false,
  showCompletedTasks: true,
}

/* Input types: callers supply meaningful fields; the store stamps ids + times. */
type NewProject = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<Project, 'name'>
type NewTask = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>> &
  Pick<Task, 'projectId' | 'title'>
type NewNote = Pick<Note, 'projectId'> & Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>
type NewSnippet = Partial<Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<Snippet, 'title' | 'code'>
type NewCommand = Partial<Omit<Command, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<Command, 'title' | 'command'>
type NewLink = Pick<ProjectLink, 'projectId' | 'label' | 'url'> &
  Partial<Omit<ProjectLink, 'id' | 'createdAt' | 'updatedAt'>>
type NewResource = Pick<Resource, 'projectId' | 'title'> &
  Partial<Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>>

interface StoreState extends DataState {
  settings: Settings

  // Projects
  addProject: (input: NewProject) => Project
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  toggleFavorite: (id: string) => void

  // Tasks
  addTask: (input: NewTask) => Task
  updateTask: (id: string, patch: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: Task['status'], order: number) => void
  reorderTasks: (updates: { id: string; status: Task['status']; order: number }[]) => void

  // Notes
  addNote: (input: NewNote) => Note
  updateNote: (id: string, patch: Partial<Note>) => void
  deleteNote: (id: string) => void

  // Snippets
  addSnippet: (input: NewSnippet) => Snippet
  updateSnippet: (id: string, patch: Partial<Snippet>) => void
  deleteSnippet: (id: string) => void

  // Commands
  addCommand: (input: NewCommand) => Command
  updateCommand: (id: string, patch: Partial<Command>) => void
  deleteCommand: (id: string) => void

  // Links
  addLink: (input: NewLink) => ProjectLink
  updateLink: (id: string, patch: Partial<ProjectLink>) => void
  deleteLink: (id: string) => void

  // Resources
  addResource: (input: NewResource) => Resource
  updateResource: (id: string, patch: Partial<Resource>) => void
  deleteResource: (id: string) => void

  // Settings
  updateSettings: (patch: Partial<Settings>) => void

  // Bulk / data management
  exportBundle: () => ExportBundle
  importBundle: (bundle: ExportBundle, mode: 'merge' | 'replace') => ImportResult
  resetAll: () => void
  loadSeed: () => void
}

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

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...createSeedData(),
      settings: DEFAULT_SETTINGS,

      /* ── Projects ──────────────────────────────────────────────────── */
      addProject: (input) => {
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
        set((s) => ({ projects: [project, ...s.projects] }))
        return project
      },
      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
          ),
        })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          // Cascade: remove everything owned by the project.
          tasks: s.tasks.filter((t) => t.projectId !== id),
          notes: s.notes.filter((n) => n.projectId !== id),
          links: s.links.filter((l) => l.projectId !== id),
          resources: s.resources.filter((r) => r.projectId !== id),
          // Snippets/commands may be global; only drop those tied to this project.
          snippets: s.snippets.filter((sn) => sn.projectId !== id),
          commands: s.commands.filter((c) => c.projectId !== id),
        })),
      toggleFavorite: (id) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, favorite: !p.favorite, updatedAt: now() } : p,
          ),
        })),

      /* ── Tasks ─────────────────────────────────────────────────────── */
      addTask: (input) => {
        requireProject(get(), input.projectId)
        const ts = now()
        const siblings = get().tasks.filter(
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
        set((s) => ({ tasks: [...s.tasks, task] }))
        return task
      },
      updateTask: (id, patch) =>
        set((s) => {
          if (patch.projectId) requireProject(s, patch.projectId)
          const current = s.tasks.find((t) => t.id === id)
          const statusChanged = current && patch.status && patch.status !== current.status
          return {
            tasks: s.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...patch,
                    order:
                      statusChanged && patch.order == null
                        ? nextTaskOrder(s, patch.projectId ?? t.projectId, patch.status!, id)
                        : patch.order ?? t.order,
                    updatedAt: now(),
                  }
                : t,
            ),
          }
        }),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (id, status, order) =>
        set((s) => normalizeTaskOrders({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status, order, updatedAt: now() } : t,
          ),
        })),
      reorderTasks: (updates) =>
        set((s) => {
          const map = new Map(updates.map((u) => [u.id, u]))
          return {
            tasks: s.tasks.map((t) => {
              const u = map.get(t.id)
              return u ? { ...t, status: u.status, order: u.order, updatedAt: now() } : t
            }),
          }
        }),

      /* ── Notes ─────────────────────────────────────────────────────── */
      addNote: (input) => {
        requireProject(get(), input.projectId)
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
        set((s) => ({ notes: [note, ...s.notes] }))
        return note
      },
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: now() } : n)),
        })),
      deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      /* ── Snippets ──────────────────────────────────────────────────── */
      addSnippet: (input) => {
        requireOptionalProject(get(), input.projectId ?? null)
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
        set((s) => ({ snippets: [snippet, ...s.snippets] }))
        return snippet
      },
      updateSnippet: (id, patch) =>
        set((s) => {
          if ('projectId' in patch) requireOptionalProject(s, patch.projectId ?? null)
          return {
            snippets: s.snippets.map((sn) =>
              sn.id === id ? { ...sn, ...patch, updatedAt: now() } : sn,
            ),
          }
        }),
      deleteSnippet: (id) => set((s) => ({ snippets: s.snippets.filter((sn) => sn.id !== id) })),

      /* ── Commands ──────────────────────────────────────────────────── */
      addCommand: (input) => {
        requireOptionalProject(get(), input.projectId ?? null)
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
        set((s) => ({ commands: [command, ...s.commands] }))
        return command
      },
      updateCommand: (id, patch) =>
        set((s) => {
          if ('projectId' in patch) requireOptionalProject(s, patch.projectId ?? null)
          return {
            commands: s.commands.map((c) =>
              c.id === id ? { ...c, ...patch, updatedAt: now() } : c,
            ),
          }
        }),
      deleteCommand: (id) => set((s) => ({ commands: s.commands.filter((c) => c.id !== id) })),

      /* ── Links ─────────────────────────────────────────────────────── */
      addLink: (input) => {
        requireProject(get(), input.projectId)
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
        set((s) => ({ links: [...s.links, link] }))
        return link
      },
      updateLink: (id, patch) =>
        set((s) => {
          if (patch.projectId) requireProject(s, patch.projectId)
          return {
            links: s.links.map((l) => (l.id === id ? { ...l, ...patch, updatedAt: now() } : l)),
          }
        }),
      deleteLink: (id) => set((s) => ({ links: s.links.filter((l) => l.id !== id) })),

      /* ── Resources ─────────────────────────────────────────────────── */
      addResource: (input) => {
        requireProject(get(), input.projectId)
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
        set((s) => ({ resources: [resource, ...s.resources] }))
        return resource
      },
      updateResource: (id, patch) =>
        set((s) => {
          if (patch.projectId) requireProject(s, patch.projectId)
          return {
            resources: s.resources.map((r) =>
              r.id === id ? { ...r, ...patch, updatedAt: now() } : r,
            ),
          }
        }),
      deleteResource: (id) => set((s) => ({ resources: s.resources.filter((r) => r.id !== id) })),

      /* ── Settings ──────────────────────────────────────────────────── */
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      /* ── Data management ───────────────────────────────────────────── */
      exportBundle: () => {
        const s = get()
        return {
          version: SCHEMA_VERSION,
          exportedAt: now(),
          settings: s.settings,
          projects: s.projects,
          tasks: s.tasks,
          notes: s.notes,
          snippets: s.snippets,
          commands: s.commands,
          links: s.links,
          resources: s.resources,
        }
      },
      importBundle: (bundle, mode) => {
        let result: ImportResult = { repaired: [] }
        set((s) => {
          if (mode === 'replace') {
            const normalized = normalizeBundle(bundle, {
              mode: 'strict',
              fallbackSettings: DEFAULT_SETTINGS,
            })
            const { projects, tasks, notes, snippets, commands, links, resources, settings } =
              normalized.bundle
            result = { repaired: normalized.repaired }
            return { projects, tasks, notes, snippets, commands, links, resources, settings }
          }

          const mergeById = <T extends { id: string }>(a: T[], b: T[]) => {
            const map = new Map(a.map((x) => [x.id, x]))
            for (const x of b) map.set(x.id, x)
            return [...map.values()]
          }
          const merged = {
            projects: mergeById(s.projects, bundle.projects),
            tasks: mergeById(s.tasks, bundle.tasks),
            notes: mergeById(s.notes, bundle.notes),
            snippets: mergeById(s.snippets, bundle.snippets),
            commands: mergeById(s.commands, bundle.commands),
            links: mergeById(s.links, bundle.links),
            resources: mergeById(s.resources, bundle.resources),
          }
          assertDataIntegrity(merged)
          return { ...normalizeTaskOrders(merged) }
        })
        return result
      },
      resetAll: () => set({ ...emptyData() }),
      loadSeed: () => set({ ...normalizeTaskOrders(createSeedData()) }),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      partialize: (s) => ({
        projects: s.projects,
        tasks: s.tasks,
        notes: s.notes,
        snippets: s.snippets,
        commands: s.commands,
        links: s.links,
        resources: s.resources,
        settings: s.settings,
      }),
      migrate: (persisted) => normalizePersistedState(persisted, DEFAULT_SETTINGS),
    },
  ),
)
