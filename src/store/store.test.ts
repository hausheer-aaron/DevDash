import { beforeEach, describe, expect, it } from 'vitest'
import type { DataState } from '@/types'
import { useStore, DEFAULT_SETTINGS } from '@/store/store'
import { dataState, exportBundle, t } from '@/test/factories'
import { createDefaultSyncState } from '@/sync/queue'

const emptyData: DataState = {
  projects: [],
  tasks: [],
  notes: [],
  snippets: [],
  commands: [],
  links: [],
  resources: [],
}

function resetStore(data: Partial<DataState> = {}) {
  useStore.setState({
    ...emptyData,
    ...data,
    settings: DEFAULT_SETTINGS,
    sync: createDefaultSyncState(),
    lastRepositoryError: null,
  })
}

describe('store import/export behavior', () => {
  beforeEach(() => resetStore())

  it('merge import keeps existing valid data', async () => {
    const existing = dataState({
      projects: [{ ...dataState().projects[0], id: 'proj_existing', name: 'Existing' }],
      tasks: [],
      notes: [],
      snippets: [],
      commands: [],
      links: [],
      resources: [],
    })
    resetStore(existing)

    const incoming = exportBundle({
      projects: [{ ...dataState().projects[0], id: 'proj_incoming', name: 'Incoming' }],
      tasks: [],
      notes: [],
      snippets: [],
      commands: [],
      links: [],
      resources: [],
    })

    await useStore.getState().importBundle(incoming, 'merge')

    expect(useStore.getState().projects.map((p) => p.id).sort()).toEqual([
      'proj_existing',
      'proj_incoming',
    ])
  })

  it('replace import validates before applying', async () => {
    resetStore(dataState())
    const invalid = exportBundle({
      tasks: [{ ...dataState().tasks[0], projectId: 'missing_project' }],
    })

    await expect(useStore.getState().importBundle(invalid, 'replace')).rejects.toThrow(
      'Import contains orphaned records',
    )
    expect(useStore.getState().projects[0].id).toBe('proj_1')
  })
})

describe('store integrity guards', () => {
  beforeEach(() => resetStore(dataState()))

  it('prevents child records from referencing missing projects', async () => {
    const store = useStore.getState()

    await expect(store.addTask({ projectId: 'missing', title: 'Task' })).rejects.toThrow('Project not found.')
    await expect(store.addNote({ projectId: 'missing', title: 'Note' })).rejects.toThrow('Project not found.')
    await expect(store.addLink({ projectId: 'missing', label: 'Link', url: 'https://example.com' })).rejects.toThrow(
      'Project not found.',
    )
    await expect(store.addResource({ projectId: 'missing', title: 'Resource' })).rejects.toThrow(
      'Project not found.',
    )
    expect(useStore.getState().lastRepositoryError).toBe('Project not found.')
  })

  it('prevents project-scoped snippets and commands from referencing missing projects', async () => {
    const store = useStore.getState()

    await expect(store.addSnippet({ projectId: 'missing', title: 'Snippet', code: 'x' })).rejects.toThrow(
      'Project not found.',
    )
    await expect(store.addCommand({ projectId: 'missing', title: 'Command', command: 'echo x' })).rejects.toThrow(
      'Project not found.',
    )
  })

  it('deleting a project cascades without leaving invalid references', async () => {
    await useStore.getState().deleteProject('proj_1')
    const state = useStore.getState()

    expect(state.projects).toHaveLength(0)
    expect(state.tasks).toHaveLength(0)
    expect(state.notes).toHaveLength(0)
    expect(state.links).toHaveLength(0)
    expect(state.resources).toHaveLength(0)
    expect(state.snippets).toHaveLength(0)
    expect(state.commands).toHaveLength(0)
  })
})

describe('task ordering', () => {
  beforeEach(() => {
    const task = dataState().tasks[0]
    resetStore({
      ...dataState(),
      tasks: [
        { ...task, id: 'task_a', title: 'A', status: 'todo', order: 0, updatedAt: t },
        { ...task, id: 'task_b', title: 'B', status: 'todo', order: 1, updatedAt: t + 1 },
        { ...task, id: 'task_c', title: 'C', status: 'in_progress', order: 0, updatedAt: t + 2 },
      ],
    })
  })

  it('reordering within a column preserves order', async () => {
    await useStore.getState().reorderTasks([
      { id: 'task_a', status: 'todo', order: 1 },
      { id: 'task_b', status: 'todo', order: 0 },
    ])

    const todo = useStore
      .getState()
      .tasks.filter((task) => task.status === 'todo')
      .sort((a, b) => a.order - b.order)

    expect(todo.map((task) => task.id)).toEqual(['task_b', 'task_a'])
  })

  it('moving between columns updates status and order', async () => {
    await useStore.getState().reorderTasks([
      { id: 'task_a', status: 'in_progress', order: 1 },
      { id: 'task_c', status: 'in_progress', order: 0 },
    ])

    const moved = useStore.getState().tasks.find((task) => task.id === 'task_a')
    expect(moved).toMatchObject({ status: 'in_progress', order: 1 })
  })

  it('completes a task through ordering updates when completed tasks are hidden', async () => {
    useStore.setState({ settings: { ...DEFAULT_SETTINGS, showCompletedTasks: false } })

    await useStore.getState().reorderTasks([{ id: 'task_a', status: 'done', order: 0 }])

    expect(useStore.getState().tasks.find((task) => task.id === 'task_a')).toMatchObject({
      status: 'done',
      order: 0,
    })
  })
})

describe('store sync metadata', () => {
  beforeEach(() => resetStore())

  it('starts in local-only mode with an inactive queue', () => {
    expect(useStore.getState().sync).toEqual(createDefaultSyncState())
  })
})
