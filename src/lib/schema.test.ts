import { describe, expect, it } from 'vitest'
import { normalizeBundle, normalizePersistedState, parseBundle } from '@/lib/schema'
import { exportBundle } from '@/test/factories'
import { DEFAULT_SETTINGS } from '@/store/store'

describe('schema validation', () => {
  it('accepts valid import data', () => {
    const bundle = parseBundle(JSON.stringify(exportBundle()))

    expect(bundle.projects).toHaveLength(1)
    expect(bundle.tasks[0].order).toBe(0)
    expect(bundle.settings.theme).toBe('dark')
  })

  it('rejects invalid entity shapes', () => {
    const bundle = exportBundle({
      tasks: [{ ...exportBundle().tasks[0], title: 42 } as never],
    })

    expect(() => normalizeBundle(bundle, { mode: 'strict' })).toThrow(
      'Invalid tasks[0]: title must be a string.',
    )
  })

  it('rejects invalid enum values', () => {
    const bundle = exportBundle({
      projects: [{ ...exportBundle().projects[0], status: 'shipping' } as never],
    })

    expect(() => normalizeBundle(bundle, { mode: 'strict' })).toThrow(
      'Invalid projects[0]: status has an unsupported value.',
    )
  })

  it('rejects duplicate ids within a collection', () => {
    const task = exportBundle().tasks[0]
    const bundle = exportBundle({
      tasks: [task, { ...task, title: 'Duplicate task' }],
    })

    expect(() => normalizeBundle(bundle, { mode: 'strict' })).toThrow(
      'Invalid tasks[1]: duplicate id "task_1".',
    )
  })

  it('rejects broken project references in strict imports', () => {
    const bundle = exportBundle({
      tasks: [{ ...exportBundle().tasks[0], projectId: 'missing_project' }],
    })

    expect(() => normalizeBundle(bundle, { mode: 'strict' })).toThrow(
      'Import contains orphaned records: task "First task".',
    )
  })
})

describe('persisted-state migration', () => {
  it('defaults missing settings and strips removed fields', () => {
    const migrated = normalizePersistedState({
      ...exportBundle(),
      settings: { theme: 'light' },
      obsoleteField: 'remove me',
    })

    expect(migrated.settings).toEqual({ ...DEFAULT_SETTINGS, theme: 'light' })
    expect('obsoleteField' in migrated).toBe(false)
  })

  it('repairs orphaned records in persisted data', () => {
    const migrated = normalizePersistedState({
      ...exportBundle({
        tasks: [{ ...exportBundle().tasks[0], projectId: 'missing_project' }],
        snippets: [{ ...exportBundle().snippets[0], projectId: 'missing_project' }],
      }),
    })

    expect(migrated.tasks).toHaveLength(0)
    expect(migrated.snippets).toHaveLength(0)
    expect(migrated.projects).toHaveLength(1)
  })

  it('normalizes task ordering during migration', () => {
    const task = exportBundle().tasks[0]
    const migrated = normalizePersistedState({
      ...exportBundle({
        tasks: [
          { ...task, id: 'task_b', title: 'B', order: 10, updatedAt: 2 },
          { ...task, id: 'task_a', title: 'A', order: 5, updatedAt: 1 },
        ],
      }),
    })

    expect(migrated.tasks.map((task) => [task.id, task.order])).toEqual([
      ['task_b', 1],
      ['task_a', 0],
    ])
  })
})
