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
import type { WorkspaceSyncState } from '@/sync/types'

export interface RepositoryState extends DataState {
  settings: Settings
  sync: WorkspaceSyncState
}

export type NewProject = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<Project, 'name'>
export type NewTask = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'projectId'>> &
  Pick<Task, 'projectId' | 'title'>
export type NewNote = Pick<Note, 'projectId'> & Partial<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>>
export type NewSnippet = Partial<Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<Snippet, 'title' | 'code'>
export type NewCommand = Partial<Omit<Command, 'id' | 'createdAt' | 'updatedAt'>> &
  Pick<Command, 'title' | 'command'>
export type NewLink = Pick<ProjectLink, 'projectId' | 'label' | 'url'> &
  Partial<Omit<ProjectLink, 'id' | 'createdAt' | 'updatedAt'>>
export type NewResource = Pick<Resource, 'projectId' | 'title'> &
  Partial<Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>>

export interface RepositorySuccess<T = void> {
  ok: true
  state: Partial<RepositoryState>
  result: T
}

export interface RepositoryFailure {
  ok: false
  state?: Partial<RepositoryState>
  error: Error
}

export type RepositoryResult<T = void> = RepositorySuccess<T> | RepositoryFailure
export type AsyncRepositoryResult<T = void> = Promise<RepositoryResult<T>>

export interface DevDashRepository {
  getInitialState(): RepositoryState
  normalizePersistedState(input: unknown, fallbackSettings: Settings): RepositoryState
  getPersistedState(state: RepositoryState): RepositoryState

  addProject(state: RepositoryState, input: NewProject): AsyncRepositoryResult<Project>
  updateProject(state: RepositoryState, id: string, patch: Partial<Project>): AsyncRepositoryResult
  deleteProject(state: RepositoryState, id: string): AsyncRepositoryResult
  toggleFavorite(state: RepositoryState, id: string): AsyncRepositoryResult

  addTask(state: RepositoryState, input: NewTask): AsyncRepositoryResult<Task>
  updateTask(state: RepositoryState, id: string, patch: Partial<Task>): AsyncRepositoryResult
  deleteTask(state: RepositoryState, id: string): AsyncRepositoryResult
  moveTask(
    state: RepositoryState,
    id: string,
    status: Task['status'],
    order: number,
  ): AsyncRepositoryResult
  reorderTasks(
    state: RepositoryState,
    updates: { id: string; status: Task['status']; order: number }[],
  ): AsyncRepositoryResult

  addNote(state: RepositoryState, input: NewNote): AsyncRepositoryResult<Note>
  updateNote(state: RepositoryState, id: string, patch: Partial<Note>): AsyncRepositoryResult
  deleteNote(state: RepositoryState, id: string): AsyncRepositoryResult

  addSnippet(state: RepositoryState, input: NewSnippet): AsyncRepositoryResult<Snippet>
  updateSnippet(state: RepositoryState, id: string, patch: Partial<Snippet>): AsyncRepositoryResult
  deleteSnippet(state: RepositoryState, id: string): AsyncRepositoryResult

  addCommand(state: RepositoryState, input: NewCommand): AsyncRepositoryResult<Command>
  updateCommand(state: RepositoryState, id: string, patch: Partial<Command>): AsyncRepositoryResult
  deleteCommand(state: RepositoryState, id: string): AsyncRepositoryResult

  addLink(state: RepositoryState, input: NewLink): AsyncRepositoryResult<ProjectLink>
  updateLink(state: RepositoryState, id: string, patch: Partial<ProjectLink>): AsyncRepositoryResult
  deleteLink(state: RepositoryState, id: string): AsyncRepositoryResult

  addResource(state: RepositoryState, input: NewResource): AsyncRepositoryResult<Resource>
  updateResource(state: RepositoryState, id: string, patch: Partial<Resource>): AsyncRepositoryResult
  deleteResource(state: RepositoryState, id: string): AsyncRepositoryResult

  updateSettings(state: RepositoryState, patch: Partial<Settings>): AsyncRepositoryResult

  exportBundle(state: RepositoryState): ExportBundle
  importBundle(
    state: RepositoryState,
    bundle: ExportBundle,
    mode: 'merge' | 'replace',
    fallbackSettings: Settings,
  ): AsyncRepositoryResult<ImportResult>
  resetAll(state: RepositoryState): AsyncRepositoryResult
  loadSeed(state: RepositoryState): AsyncRepositoryResult
}
