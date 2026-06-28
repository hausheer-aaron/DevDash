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
import { LocalRepository } from '@/repositories/localRepository'
import type {
  NewCommand,
  NewLink,
  NewNote,
  NewProject,
  NewResource,
  NewSnippet,
  NewTask,
  RepositoryResult,
  RepositoryState,
} from '@/repositories/types'
import type { WorkspaceSyncState } from '@/sync/types'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  accent: 'indigo',
  defaultView: 'dashboard',
  reduceMotion: false,
  showCompletedTasks: true,
}

interface StoreState extends DataState {
  settings: Settings
  sync: WorkspaceSyncState
  lastRepositoryError: string | null

  // Projects
  addProject: (input: NewProject) => Promise<Project>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>

  // Tasks
  addTask: (input: NewTask) => Promise<Task>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTask: (id: string, status: Task['status'], order: number) => Promise<void>
  reorderTasks: (updates: { id: string; status: Task['status']; order: number }[]) => Promise<void>

  // Notes
  addNote: (input: NewNote) => Promise<Note>
  updateNote: (id: string, patch: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>

  // Snippets
  addSnippet: (input: NewSnippet) => Promise<Snippet>
  updateSnippet: (id: string, patch: Partial<Snippet>) => Promise<void>
  deleteSnippet: (id: string) => Promise<void>

  // Commands
  addCommand: (input: NewCommand) => Promise<Command>
  updateCommand: (id: string, patch: Partial<Command>) => Promise<void>
  deleteCommand: (id: string) => Promise<void>

  // Links
  addLink: (input: NewLink) => Promise<ProjectLink>
  updateLink: (id: string, patch: Partial<ProjectLink>) => Promise<void>
  deleteLink: (id: string) => Promise<void>

  // Resources
  addResource: (input: NewResource) => Promise<Resource>
  updateResource: (id: string, patch: Partial<Resource>) => Promise<void>
  deleteResource: (id: string) => Promise<void>

  // Settings
  updateSettings: (patch: Partial<Settings>) => Promise<void>

  // Bulk / data management
  exportBundle: () => ExportBundle
  importBundle: (bundle: ExportBundle, mode: 'merge' | 'replace') => Promise<ImportResult>
  resetAll: () => Promise<void>
  loadSeed: () => Promise<void>
}

const repository = new LocalRepository(DEFAULT_SETTINGS)

function repositoryState(state: StoreState): RepositoryState {
  const { projects, tasks, notes, snippets, commands, links, resources, settings, sync } = state
  return { projects, tasks, notes, snippets, commands, links, resources, settings, sync }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Repository operation failed.'
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...repository.getInitialState(),
      lastRepositoryError: null,

      /* ── Projects ──────────────────────────────────────────────────── */
      addProject: async (input) =>
        applyRepositoryResult(set, repository.addProject(repositoryState(get()), input)),
      updateProject: (id, patch) =>
        applyRepositoryResult(set, repository.updateProject(repositoryState(get()), id, patch)),
      deleteProject: (id) =>
        applyRepositoryResult(set, repository.deleteProject(repositoryState(get()), id)),
      toggleFavorite: (id) =>
        applyRepositoryResult(set, repository.toggleFavorite(repositoryState(get()), id)),

      /* ── Tasks ─────────────────────────────────────────────────────── */
      addTask: async (input) =>
        applyRepositoryResult(set, repository.addTask(repositoryState(get()), input)),
      updateTask: (id, patch) =>
        applyRepositoryResult(set, repository.updateTask(repositoryState(get()), id, patch)),
      deleteTask: (id) => applyRepositoryResult(set, repository.deleteTask(repositoryState(get()), id)),
      moveTask: (id, status, order) =>
        applyRepositoryResult(set, repository.moveTask(repositoryState(get()), id, status, order)),
      reorderTasks: (updates) =>
        applyRepositoryResult(set, repository.reorderTasks(repositoryState(get()), updates)),

      /* ── Notes ─────────────────────────────────────────────────────── */
      addNote: async (input) =>
        applyRepositoryResult(set, repository.addNote(repositoryState(get()), input)),
      updateNote: (id, patch) =>
        applyRepositoryResult(set, repository.updateNote(repositoryState(get()), id, patch)),
      deleteNote: (id) => applyRepositoryResult(set, repository.deleteNote(repositoryState(get()), id)),

      /* ── Snippets ──────────────────────────────────────────────────── */
      addSnippet: async (input) =>
        applyRepositoryResult(set, repository.addSnippet(repositoryState(get()), input)),
      updateSnippet: (id, patch) =>
        applyRepositoryResult(set, repository.updateSnippet(repositoryState(get()), id, patch)),
      deleteSnippet: (id) =>
        applyRepositoryResult(set, repository.deleteSnippet(repositoryState(get()), id)),

      /* ── Commands ──────────────────────────────────────────────────── */
      addCommand: async (input) =>
        applyRepositoryResult(set, repository.addCommand(repositoryState(get()), input)),
      updateCommand: (id, patch) =>
        applyRepositoryResult(set, repository.updateCommand(repositoryState(get()), id, patch)),
      deleteCommand: (id) =>
        applyRepositoryResult(set, repository.deleteCommand(repositoryState(get()), id)),

      /* ── Links ─────────────────────────────────────────────────────── */
      addLink: async (input) =>
        applyRepositoryResult(set, repository.addLink(repositoryState(get()), input)),
      updateLink: (id, patch) =>
        applyRepositoryResult(set, repository.updateLink(repositoryState(get()), id, patch)),
      deleteLink: (id) => applyRepositoryResult(set, repository.deleteLink(repositoryState(get()), id)),

      /* ── Resources ─────────────────────────────────────────────────── */
      addResource: async (input) =>
        applyRepositoryResult(set, repository.addResource(repositoryState(get()), input)),
      updateResource: (id, patch) =>
        applyRepositoryResult(set, repository.updateResource(repositoryState(get()), id, patch)),
      deleteResource: (id) =>
        applyRepositoryResult(set, repository.deleteResource(repositoryState(get()), id)),

      /* ── Settings ──────────────────────────────────────────────────── */
      updateSettings: (patch) =>
        applyRepositoryResult(set, repository.updateSettings(repositoryState(get()), patch)),

      /* ── Data management ───────────────────────────────────────────── */
      exportBundle: () => {
        return repository.exportBundle(repositoryState(get()))
      },
      importBundle: (bundle, mode) =>
        applyRepositoryResult(
          set,
          repository.importBundle(repositoryState(get()), bundle, mode, DEFAULT_SETTINGS),
        ),
      resetAll: () => applyRepositoryResult(set, repository.resetAll(repositoryState(get()))),
      loadSeed: () => applyRepositoryResult(set, repository.loadSeed(repositoryState(get()))),
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      partialize: (s) => repository.getPersistedState(repositoryState(s)),
      migrate: (persisted) => repository.normalizePersistedState(persisted, DEFAULT_SETTINGS),
    },
  ),
)

async function applyRepositoryResult<T>(
  set: (partial: Partial<StoreState> | ((state: StoreState) => Partial<StoreState>)) => void,
  operation: Promise<RepositoryResult<T>>,
): Promise<T> {
  try {
    const outcome = await operation
    if (!outcome.ok) {
      set({ ...(outcome.state ?? {}), lastRepositoryError: outcome.error.message })
      throw outcome.error
    }
    set({ ...outcome.state, lastRepositoryError: null })
    return outcome.result
  } catch (error) {
    set({ lastRepositoryError: errorMessage(error) })
    throw error
  }
}
