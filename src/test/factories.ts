import type { DataState, ExportBundle, Settings } from '@/types'
import { SCHEMA_VERSION } from '@/types'
import { DEFAULT_SETTINGS } from '@/store/store'

export const t = 1_800_000_000_000

export const settings = (patch: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  ...patch,
})

export function dataState(patch: Partial<DataState> = {}): DataState {
  const base: DataState = {
    projects: [
      {
        id: 'proj_1',
        name: 'Project One',
        description: 'A project',
        key: 'P1',
        status: 'active',
        priority: 'high',
        tags: ['app'],
        color: 'indigo',
        favorite: false,
        readme: '# Project One',
        createdAt: t,
        updatedAt: t,
      },
    ],
    tasks: [
      {
        id: 'task_1',
        projectId: 'proj_1',
        title: 'First task',
        description: '',
        status: 'todo',
        priority: 'medium',
        order: 0,
        tags: [],
        dueDate: null,
        createdAt: t,
        updatedAt: t,
      },
    ],
    notes: [
      {
        id: 'note_1',
        projectId: 'proj_1',
        title: 'First note',
        content: 'Initial content',
        pinned: false,
        createdAt: t,
        updatedAt: t,
      },
    ],
    snippets: [
      {
        id: 'snip_1',
        projectId: 'proj_1',
        title: 'Snippet',
        description: '',
        language: 'typescript',
        code: 'const value = 1',
        tags: [],
        favorite: false,
        createdAt: t,
        updatedAt: t,
      },
    ],
    commands: [
      {
        id: 'cmd_1',
        projectId: 'proj_1',
        title: 'Command',
        description: '',
        command: 'npm test',
        tags: [],
        favorite: false,
        createdAt: t,
        updatedAt: t,
      },
    ],
    links: [
      {
        id: 'link_1',
        projectId: 'proj_1',
        label: 'Repo',
        url: 'https://example.com/repo',
        category: 'repository',
        createdAt: t,
        updatedAt: t,
      },
    ],
    resources: [
      {
        id: 'res_1',
        projectId: 'proj_1',
        title: 'Docs',
        notes: '',
        url: 'https://example.com/docs',
        createdAt: t,
        updatedAt: t,
      },
    ],
  }
  return { ...base, ...patch }
}

export function exportBundle(patch: Partial<ExportBundle> = {}): ExportBundle {
  return {
    ...dataState(),
    version: SCHEMA_VERSION,
    exportedAt: t,
    settings: settings(),
    ...patch,
  }
}
