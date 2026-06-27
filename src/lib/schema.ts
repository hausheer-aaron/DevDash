import type {
  Command,
  DataState,
  ExportBundle,
  Note,
  Project,
  ProjectLink,
  Resource,
  Settings,
  Snippet,
  Task,
} from '@/types'
import { SCHEMA_VERSION } from '@/types'
import {
  ACCENT_KEYS,
  LINK_CATEGORIES,
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
} from '@/lib/constants'

type Mode = 'strict' | 'repair'

interface NormalizeOptions {
  mode: Mode
  fallbackSettings?: Settings
}

export interface NormalizedBundle {
  bundle: ExportBundle
  repaired: string[]
}

const COLLECTIONS = ['projects', 'tasks', 'notes', 'snippets', 'commands', 'links', 'resources'] as const
const THEME_VALUES = ['dark', 'light', 'system'] as const
const DEFAULT_VIEW_VALUES = ['dashboard', 'projects'] as const

const BASE_SETTINGS: Settings = {
  theme: 'dark',
  accent: 'indigo',
  defaultView: 'dashboard',
  reduceMotion: false,
  showCompletedTasks: true,
}

export function parseBundle(text: string): ExportBundle {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  return normalizeBundle(json, { mode: 'strict' }).bundle
}

export function normalizeBundle(input: unknown, options: NormalizeOptions): NormalizedBundle {
  const obj = asRecord(input, 'Import file')
  const hasAnyArray = COLLECTIONS.some((key) => Array.isArray(obj[key]))
  if (!hasAnyArray) throw new Error('This file does not look like a DevDash export.')

  const repaired: string[] = []
  const settings = normalizeSettings(obj.settings, options.fallbackSettings, options.mode, repaired)
  const projects = normalizeArray(obj.projects, 'projects', normalizeProject, options.mode, repaired)
  const projectIds = new Set(projects.map((p) => p.id))

  const data: DataState = {
    projects,
    tasks: normalizeArray(obj.tasks, 'tasks', normalizeTask, options.mode, repaired),
    notes: normalizeArray(obj.notes, 'notes', normalizeNote, options.mode, repaired),
    snippets: normalizeArray(obj.snippets, 'snippets', normalizeSnippet, options.mode, repaired),
    commands: normalizeArray(obj.commands, 'commands', normalizeCommand, options.mode, repaired),
    links: normalizeArray(obj.links, 'links', normalizeLink, options.mode, repaired),
    resources: normalizeArray(obj.resources, 'resources', normalizeResource, options.mode, repaired),
  }

  const checked = enforceRelationships(data, projectIds, options.mode, repaired)
  return {
    bundle: {
      ...normalizeTaskOrders(checked),
      version: SCHEMA_VERSION,
      exportedAt: validTimestamp(obj.exportedAt) ? obj.exportedAt : Date.now(),
      settings,
    },
    repaired,
  }
}

export function normalizePersistedState(input: unknown, fallbackSettings = BASE_SETTINGS) {
  try {
    const { bundle } = normalizeBundle(input, { mode: 'repair', fallbackSettings })
    const { projects, tasks, notes, snippets, commands, links, resources, settings } = bundle
    return { projects, tasks, notes, snippets, commands, links, resources, settings }
  } catch {
    return {
      projects: [],
      tasks: [],
      notes: [],
      snippets: [],
      commands: [],
      links: [],
      resources: [],
      settings: fallbackSettings,
    }
  }
}

export function assertDataIntegrity(data: DataState) {
  const projectIds = new Set(data.projects.map((p) => p.id))
  const bad: string[] = []
  for (const t of data.tasks) if (!projectIds.has(t.projectId)) bad.push(`task "${t.title}"`)
  for (const n of data.notes) if (!projectIds.has(n.projectId)) bad.push(`note "${n.title}"`)
  for (const l of data.links) if (!projectIds.has(l.projectId)) bad.push(`link "${l.label}"`)
  for (const r of data.resources) if (!projectIds.has(r.projectId)) bad.push(`resource "${r.title}"`)
  for (const s of data.snippets) {
    if (s.projectId !== null && !projectIds.has(s.projectId)) bad.push(`snippet "${s.title}"`)
  }
  for (const c of data.commands) {
    if (c.projectId !== null && !projectIds.has(c.projectId)) bad.push(`command "${c.title}"`)
  }
  if (bad.length) throw new Error(`Import contains orphaned records: ${bad.slice(0, 5).join(', ')}.`)
}

export function normalizeTaskOrders(data: DataState): DataState {
  const tasks = [...data.tasks]
  for (const project of data.projects) {
    for (const status of TASK_STATUSES) {
      tasks
        .filter((task) => task.projectId === project.id && task.status === status)
        .sort((a, b) => a.order - b.order || a.updatedAt - b.updatedAt)
        .forEach((task, order) => {
          task.order = order
        })
    }
  }
  return { ...data, tasks }
}

export function bundleSummary(bundle: Partial<ExportBundle>) {
  return {
    projects: bundle.projects?.length ?? 0,
    tasks: bundle.tasks?.length ?? 0,
    notes: bundle.notes?.length ?? 0,
    snippets: bundle.snippets?.length ?? 0,
    commands: bundle.commands?.length ?? 0,
    links: bundle.links?.length ?? 0,
    resources: bundle.resources?.length ?? 0,
  }
}

function normalizeArray<T>(
  value: unknown,
  key: string,
  normalize: (value: unknown) => T,
  mode: Mode,
  repaired: string[],
): T[] {
  if (value == null) {
    if (mode === 'repair') repaired.push(`Missing "${key}" collection was reset.`)
    return []
  }
  if (!Array.isArray(value)) {
    if (mode === 'repair') {
      repaired.push(`Malformed "${key}" collection was reset.`)
      return []
    }
    throw new Error(`The "${key}" field must be an array.`)
  }

  const out: T[] = []
  const ids = new Set<string>()
  for (let i = 0; i < value.length; i += 1) {
    try {
      const item = normalize(value[i])
      const id = (item as { id: string }).id
      if (ids.has(id)) throw new Error(`duplicate id "${id}"`)
      ids.add(id)
      out.push(item)
    } catch (e) {
      if (mode === 'strict') {
        const message = e instanceof Error ? e.message : 'invalid record'
        throw new Error(`Invalid ${key}[${i}]: ${message}.`)
      }
      repaired.push(`Dropped invalid ${key}[${i}].`)
    }
  }
  return out
}

function enforceRelationships(
  data: DataState,
  projectIds: Set<string>,
  mode: Mode,
  repaired: string[],
): DataState {
  const keepProject = (projectId: string) => projectIds.has(projectId)
  const keepOptionalProject = (projectId: string | null) => projectId === null || projectIds.has(projectId)

  if (mode === 'strict') {
    assertDataIntegrity(data)
    return data
  }

  const next = {
    ...data,
    tasks: data.tasks.filter((x) => keepProject(x.projectId)),
    notes: data.notes.filter((x) => keepProject(x.projectId)),
    snippets: data.snippets.filter((x) => keepOptionalProject(x.projectId)),
    commands: data.commands.filter((x) => keepOptionalProject(x.projectId)),
    links: data.links.filter((x) => keepProject(x.projectId)),
    resources: data.resources.filter((x) => keepProject(x.projectId)),
  }
  for (const key of COLLECTIONS) {
    const before = data[key].length
    const after = next[key].length
    if (after < before) repaired.push(`Removed ${before - after} orphaned ${key}.`)
  }
  return next
}

function normalizeSettings(value: unknown, fallback: Settings | undefined, mode: Mode, repaired: string[]): Settings {
  const base = { ...BASE_SETTINGS, ...fallback }
  if (value == null) {
    if (mode === 'repair') repaired.push('Missing settings were defaulted.')
    return base
  }
  const obj = asRecord(value, 'settings')
  return {
    theme: enumValue(obj.theme, THEME_VALUES, base.theme, 'settings.theme', mode, repaired),
    accent: enumValue(obj.accent, ACCENT_KEYS, base.accent, 'settings.accent', mode, repaired),
    defaultView: enumValue(
      obj.defaultView,
      DEFAULT_VIEW_VALUES,
      base.defaultView,
      'settings.defaultView',
      mode,
      repaired,
    ),
    reduceMotion: booleanValue(obj.reduceMotion, base.reduceMotion, 'settings.reduceMotion', mode, repaired),
    showCompletedTasks: booleanValue(
      obj.showCompletedTasks,
      base.showCompletedTasks,
      'settings.showCompletedTasks',
      mode,
      repaired,
    ),
  }
}

function normalizeProject(value: unknown): Project {
  const o = asRecord(value, 'project')
  return {
    id: stringField(o.id, 'id'),
    name: nonEmptyString(o.name, 'name'),
    description: stringOrDefault(o.description, ''),
    key: nonEmptyString(o.key, 'key').toUpperCase().slice(0, 4),
    status: enumStrict(o.status, PROJECT_STATUSES, 'status'),
    priority: enumStrict(o.priority, PRIORITIES, 'priority'),
    tags: stringArray(o.tags, 'tags'),
    color: enumStrict(o.color, ACCENT_KEYS, 'color'),
    favorite: booleanStrict(o.favorite, 'favorite'),
    readme: stringOrDefault(o.readme, ''),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function normalizeTask(value: unknown): Task {
  const o = asRecord(value, 'task')
  return {
    id: stringField(o.id, 'id'),
    projectId: stringField(o.projectId, 'projectId'),
    title: nonEmptyString(o.title, 'title'),
    description: stringOrDefault(o.description, ''),
    status: enumStrict(o.status, TASK_STATUSES, 'status'),
    priority: enumStrict(o.priority, PRIORITIES, 'priority'),
    order: finiteNumber(o.order, 'order'),
    tags: stringArray(o.tags, 'tags'),
    dueDate: nullableTimestamp(o.dueDate, 'dueDate'),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function normalizeNote(value: unknown): Note {
  const o = asRecord(value, 'note')
  return {
    id: stringField(o.id, 'id'),
    projectId: stringField(o.projectId, 'projectId'),
    title: nonEmptyString(o.title, 'title'),
    content: stringOrDefault(o.content, ''),
    pinned: booleanStrict(o.pinned, 'pinned'),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function normalizeSnippet(value: unknown): Snippet {
  const o = asRecord(value, 'snippet')
  return {
    id: stringField(o.id, 'id'),
    projectId: optionalProjectId(o.projectId, 'projectId'),
    title: nonEmptyString(o.title, 'title'),
    description: stringOrDefault(o.description, ''),
    language: nonEmptyString(o.language, 'language'),
    code: stringField(o.code, 'code'),
    tags: stringArray(o.tags, 'tags'),
    favorite: booleanStrict(o.favorite, 'favorite'),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function normalizeCommand(value: unknown): Command {
  const o = asRecord(value, 'command')
  return {
    id: stringField(o.id, 'id'),
    projectId: optionalProjectId(o.projectId, 'projectId'),
    title: nonEmptyString(o.title, 'title'),
    description: stringOrDefault(o.description, ''),
    command: nonEmptyString(o.command, 'command'),
    tags: stringArray(o.tags, 'tags'),
    favorite: booleanStrict(o.favorite, 'favorite'),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function normalizeLink(value: unknown): ProjectLink {
  const o = asRecord(value, 'link')
  return {
    id: stringField(o.id, 'id'),
    projectId: stringField(o.projectId, 'projectId'),
    label: nonEmptyString(o.label, 'label'),
    url: nonEmptyString(o.url, 'url'),
    category: enumStrict(o.category, LINK_CATEGORIES, 'category'),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function normalizeResource(value: unknown): Resource {
  const o = asRecord(value, 'resource')
  return {
    id: stringField(o.id, 'id'),
    projectId: stringField(o.projectId, 'projectId'),
    title: nonEmptyString(o.title, 'title'),
    notes: stringOrDefault(o.notes, ''),
    url: stringOrDefault(o.url, ''),
    createdAt: timestampField(o.createdAt, 'createdAt'),
    updatedAt: timestampField(o.updatedAt, 'updatedAt'),
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function stringField(value: unknown, field: string) {
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  return value
}

function nonEmptyString(value: unknown, field: string) {
  const str = stringField(value, field).trim()
  if (!str) throw new Error(`${field} is required`)
  return str
}

function stringOrDefault(value: unknown, fallback: string) {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || !value.every((x) => typeof x === 'string')) {
    throw new Error(`${field} must be an array of strings`)
  }
  return [...new Set(value.map((x) => x.trim()).filter(Boolean))]
}

function booleanStrict(value: unknown, field: string) {
  if (typeof value !== 'boolean') throw new Error(`${field} must be a boolean`)
  return value
}

function finiteNumber(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${field} must be a number`)
  return value
}

function timestampField(value: unknown, field: string) {
  if (!validTimestamp(value)) throw new Error(`${field} must be a valid timestamp`)
  return value
}

function nullableTimestamp(value: unknown, field: string) {
  if (value === null) return null
  return timestampField(value, field)
}

function validTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function optionalProjectId(value: unknown, field: string) {
  if (value === null) return null
  return stringField(value, field)
}

function enumStrict<T extends readonly string[]>(value: unknown, values: T, field: string): T[number] {
  if (typeof value === 'string' && values.includes(value)) return value as T[number]
  throw new Error(`${field} has an unsupported value`)
}

function enumValue<T extends readonly string[]>(
  value: unknown,
  values: T,
  fallback: T[number],
  field: string,
  mode: Mode,
  repaired: string[],
): T[number] {
  if (typeof value === 'string' && values.includes(value)) return value as T[number]
  if (mode === 'repair') {
    repaired.push(`Defaulted ${field}.`)
    return fallback
  }
  throw new Error(`${field} has an unsupported value.`)
}

function booleanValue(value: unknown, fallback: boolean, field: string, mode: Mode, repaired: string[]) {
  if (typeof value === 'boolean') return value
  if (mode === 'repair') {
    repaired.push(`Defaulted ${field}.`)
    return fallback
  }
  throw new Error(`${field} must be a boolean.`)
}
