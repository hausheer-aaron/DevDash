import { describe, expect, it } from 'vitest'
import {
  createDefaultSyncState,
  createEmptySyncQueue,
  createSyncOperation,
  dequeueSyncOperation,
  enqueueSyncOperation,
  normalizeWorkspaceSyncState,
} from './queue'

describe('sync queue foundation', () => {
  it('defaults workspaces to local-only sync mode', () => {
    expect(createDefaultSyncState()).toEqual({
      mode: 'local_only',
      queue: { operations: [] },
      lastSyncedAt: null,
      lastError: null,
    })
  })

  it('can enqueue and dequeue inactive operations', () => {
    const operation = createSyncOperation({
      entityType: 'task',
      entityId: 'task_1',
      operation: 'update',
      payload: { title: 'Updated' },
    })
    const queued = enqueueSyncOperation(createEmptySyncQueue(), operation)

    expect(queued.operations).toHaveLength(1)
    expect(dequeueSyncOperation(queued, operation.id).operations).toHaveLength(0)
  })

  it('normalizes unsupported persisted sync metadata back to local-only', () => {
    expect(normalizeWorkspaceSyncState({ mode: 'remote', queue: { operations: ['bad'] } })).toEqual(
      createDefaultSyncState(),
    )
  })
})
