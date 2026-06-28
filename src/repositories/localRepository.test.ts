import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS } from '@/store/store'
import { LocalRepository } from '@/repositories/localRepository'
import { dataState, exportBundle, settings } from '@/test/factories'
import { createDefaultSyncState } from '@/sync/queue'
import type { RepositoryState } from './types'

const repository = new LocalRepository(DEFAULT_SETTINGS)

function state(patch: Partial<RepositoryState> = {}): RepositoryState {
  return {
    ...dataState(),
    settings: settings(),
    sync: createDefaultSyncState(),
    ...patch,
  }
}

describe('local repository', () => {
  it('preserves project delete cascade behavior', async () => {
    const result = await repository.deleteProject(state(), 'proj_1')

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.state.projects).toEqual([])
    expect(result.state.tasks).toEqual([])
    expect(result.state.notes).toEqual([])
    expect(result.state.snippets).toEqual([])
    expect(result.state.commands).toEqual([])
    expect(result.state.links).toEqual([])
    expect(result.state.resources).toEqual([])
  })

  it('keeps relationship guards out of the UI store', async () => {
    await expect(repository.addTask(state(), { projectId: 'missing', title: 'Task' })).rejects.toThrow(
      'Project not found.',
    )
    await expect(
      repository.addSnippet(state(), { projectId: 'missing', title: 'Snippet', code: 'x' }),
    ).rejects.toThrow('Project not found.')
  })

  it('exports the same serializable bundle shape as the store', () => {
    const bundle = repository.exportBundle(state())

    expect(bundle).toMatchObject({
      version: 2,
      settings: settings(),
      projects: expect.any(Array),
      tasks: expect.any(Array),
      notes: expect.any(Array),
      snippets: expect.any(Array),
      commands: expect.any(Array),
      links: expect.any(Array),
      resources: expect.any(Array),
    })
  })

  it('validates replace imports before returning state changes', async () => {
    const invalid = exportBundle({
      tasks: [{ ...dataState().tasks[0], projectId: 'missing_project' }],
    })

    await expect(repository.importBundle(state(), invalid, 'replace', DEFAULT_SETTINGS)).rejects.toThrow(
      'Import contains orphaned records',
    )
  })

  it('normalizes persisted local state through the repository boundary', () => {
    const migrated = repository.normalizePersistedState({
      ...exportBundle({
        tasks: [{ ...dataState().tasks[0], projectId: 'missing_project' }],
      }),
      settings: { theme: 'light' },
    }, DEFAULT_SETTINGS)

    expect(migrated.tasks).toEqual([])
    expect(migrated.settings).toEqual({ ...DEFAULT_SETTINGS, theme: 'light' })
    expect(migrated.sync.mode).toBe('local_only')
  })
})
