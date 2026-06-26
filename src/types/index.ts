/**
 * Domain model for DevDash.
 *
 * Everything the app stores lives under a `Project` (or is global, like
 * settings). IDs are opaque strings (nanoid). Timestamps are epoch millis so
 * they sort cheaply and serialize cleanly to JSON.
 *
 * The schema is intentionally flat and additive — new entity types (e.g. a
 * future `Deployment` or `GithubRepo`) can be added as sibling arrays without
 * touching existing data. `SCHEMA_VERSION` gates migrations on import/load.
 */

export const SCHEMA_VERSION = 1

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived'
export type Priority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'done'
export type LinkCategory =
  | 'repository'
  | 'documentation'
  | 'deployment'
  | 'design'
  | 'issue'
  | 'other'

export interface Project {
  id: string
  name: string
  description: string
  /** Short slug-ish key shown as a chip, e.g. "API" or "WEB". */
  key: string
  status: ProjectStatus
  priority: Priority
  tags: string[]
  /** Accent color token (one of ACCENT_SWATCHES keys) for the project avatar. */
  color: string
  favorite: boolean
  /** Long-form overview rendered as Markdown on the project's overview tab. */
  readme: string
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  /** Manual ordering within a Kanban column. */
  order: number
  tags: string[]
  dueDate: number | null
  createdAt: number
  updatedAt: number
}

export interface Note {
  id: string
  projectId: string
  title: string
  /** Markdown content. */
  content: string
  pinned: boolean
  createdAt: number
  updatedAt: number
}

export interface Snippet {
  id: string
  /** Null = a global snippet not tied to a single project. */
  projectId: string | null
  title: string
  description: string
  language: string
  code: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export interface Command {
  id: string
  projectId: string | null
  title: string
  description: string
  command: string
  tags: string[]
  favorite: boolean
  createdAt: number
  updatedAt: number
}

export interface ProjectLink {
  id: string
  projectId: string
  label: string
  url: string
  category: LinkCategory
  createdAt: number
  updatedAt: number
}

export interface Resource {
  id: string
  projectId: string
  title: string
  /** Markdown notes about the resource. */
  notes: string
  url: string
  createdAt: number
  updatedAt: number
}

export type ThemeMode = 'dark' | 'light' | 'system'

export interface Settings {
  theme: ThemeMode
  accent: string
  /** View the index route ("/") redirects to on initial load. */
  defaultView: 'dashboard' | 'projects'
  reduceMotion: boolean
  /** When false, the Done column is hidden on Kanban boards. */
  showCompletedTasks: boolean
}

/** The complete serializable application state — the import/export unit. */
export interface DataState {
  projects: Project[]
  tasks: Task[]
  notes: Note[]
  snippets: Snippet[]
  commands: Command[]
  links: ProjectLink[]
  resources: Resource[]
}

export interface ExportBundle extends DataState {
  version: number
  exportedAt: number
  settings: Settings
}

/** Discriminated union used by global search results. */
export type SearchEntity =
  | { type: 'project'; item: Project }
  | { type: 'task'; item: Task }
  | { type: 'note'; item: Note }
  | { type: 'snippet'; item: Snippet }
  | { type: 'command'; item: Command }
  | { type: 'link'; item: ProjectLink }
  | { type: 'resource'; item: Resource }
